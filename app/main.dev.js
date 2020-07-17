/* eslint global-require: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 */
import { app, shell, ipcMain, BrowserWindow } from 'electron';
import electronSettings from 'electron-settings';
import _ from 'lodash';
import os from 'os';
import { Storage, File } from '@google-cloud/storage';
import url from 'url';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import path from 'path';
import fs from 'fs-extra';
import ini from 'ini';
import semver from 'semver';
import MenuBuilder from './menu';
import { sudoRemovePath } from './utils/sudoExec';

// Set up AppUpdater
log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.autoInstallOnAppQuit = false;
log.info('App starting...');

const slippiProtocol = "slippi";
const platform = process.platform;
const appDataPath = app.getPath("appData");
const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === "development";

let mainWindow = null;
let didFinishLoad = false;

app.disableHardwareAcceleration();

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const handlePreloadLogic = async () => {
  if (isProd && (platform === "win32" || platform === "darwin" || process.env.APPIMAGE)) {
    log.info("Checking if Dolphin path has been moved...");

    const appPath = app.getAppPath();
    const exePlatformPaths = {
      "win32": path.join(appPath, "../../Slippi Launcher.exe"),
      "darwin": path.join(appPath, "../../MacOS/Slippi Launcher"),
      "linux": path.join(process.env.APPDIR, "AppRun"),
    };

    // If on production and mac/windows/appimage, let's see if this is a fresh install
    const exePath = exePlatformPaths[platform];
    const exeStats = fs.statSync(exePath);
    log.info(`Exe path: ${exePath}`);
    const exeCreateTime = exeStats.ctimeMs;
    const previousCreateTime = electronSettings.get("boot.installTime");
    log.info(`Install time is ${exeCreateTime}, previous install is ${previousCreateTime}`);

    let isCopySuccess = true;
    const shouldCopyDolphin = exeCreateTime !== previousCreateTime;
    if (shouldCopyDolphin) {
      const originalDolphinPath = process.env.APPIMAGE ? path.join(process.env.APPDIR, "resources/app.asar.unpacked/app/dolphin") : path.join(appPath, "../app.asar.unpacked/app/dolphin");

      electronSettings.set("boot.installTime", exeCreateTime);

      // If path exists, let's move it to app data
      const userDataPath = app.getPath("userData");
      const targetPath = path.join(userDataPath, 'dolphin');

      const targetUserPath = path.join(targetPath, "User");
      let shouldBkpUserDir = fs.existsSync(targetUserPath);
      const backupUserPath = path.join(userDataPath, "DolphinUserBkp");
      log.info(`Copying dolphin path ${originalDolphinPath} to ${userDataPath}`);

      // If we are upgrading from a version prior to 1.5.0, let's not back up and restore. This is
      // because we disabled dual core and changed hotkeys in the more recent version of Dolphin
      // AppImages are new and we don't need to mess with a user directory for them
      const prevVersion = electronSettings.get('previousVersion');
      if (!prevVersion || (semver.lt(prevVersion, '1.5.0-dev-2') && !process.env.APPIMAGE)) {
        shouldBkpUserDir = false;
      }

      if (shouldBkpUserDir) {
        try {
          log.info("Backing up previous User directory...");
          fs.removeSync(backupUserPath);
          fs.copySync(targetUserPath, backupUserPath);
        } catch (ex) {
          log.warn("Failed to back up user dir");
          log.warn(ex);

          shouldBkpUserDir = false;
        }
      }

      // Copy dolphin dir
      isCopySuccess = false;
      try {
        log.info("Copying dolphin instance...");
        fs.removeSync(targetPath);
        fs.copySync(originalDolphinPath, targetPath);
        isCopySuccess = true;
      } catch (ex) {
        log.warn("Failed copy dolphin without permissions, will try with permissions...");
        log.warn(ex);
      }

      // If first attempt failed, try again with elevated privileges
      if (!isCopySuccess) {

        try {
          log.info("Copying dolphin instance...");
          await sudoRemovePath(targetPath);
          fs.copySync(originalDolphinPath, targetPath);
          isCopySuccess = true;
        } catch (ex) {
          log.warn("Failed copy dolphin with permissions...");
          log.warn(ex);

          throw new Error(
            "Failed to install latest Dolphin instance, your application may not work correctly. " +
            "Please follow these instructions to get support:\n\n" +
            `1) Browse to the directory: ${userDataPath}\n` +
            `2) You should see a file called "log". This file will help us figure out what went wrong.\n` +
            `3) Join the Slippi Discord and report that you are having issues in the proper support channel\n`,
          );
        }
      }

      if (shouldBkpUserDir) {
        try {
          log.info("Restoring backed up User directory...");
          fs.moveSync(backupUserPath, targetUserPath, { overwrite: true });
        } catch (ex) {
          log.warn("Failed to restore user dir");
          log.warn(ex);
        }
      }

      log.info("Done copying Dolphin");
    } else {
      log.info("Install time matches, this is not a new install.");
    }
  }

  // Add game path to Playback Dolphin
  const isoPath = electronSettings.get("settings.isoPath");
  if (isoPath) {
    log.info("ISO path found");
    const fileDir = path.dirname(isoPath);
    const storedDolphinPath = electronSettings.get('settings.playbackDolphinPath');
    let dolphinPath = storedDolphinPath || path.join(appDataPath, "Slippi Desktop App", "dolphin");
    // Handle the dolphin INI file being in different paths per platform
    switch (platform) {
    case "darwin": // osx
      dolphinPath = isDev ? "./app/dolphin-dev/osx/Dolphin.app/Contents/Resources" : path.join(dolphinPath, "Dolphin.app", "Contents", "Resources", "User");
      break;
    case "win32": // windows
      dolphinPath = isDev ? "./app/dolphin-dev/windows" : path.join(dolphinPath, "User");
      break;
    case "linux":
      dolphinPath = path.join(os.homedir(),".config", "SlippiPlayback");
      break;
    default:
      throw new Error("The current platform is not supported");
    }
    try {
      const iniPath = path.join(dolphinPath, "Config", "Dolphin.ini");
      const dolphinINI = ini.parse(fs.readFileSync(iniPath, 'utf-8'));
      dolphinINI.General.ISOPath0 = fileDir;
      const numPaths = dolphinINI.General.ISOPaths;
      dolphinINI.General.ISOPaths = numPaths !== "0" ? numPaths : "1";
      const newINI = ini.encode(dolphinINI);
      fs.writeFileSync(iniPath, newINI);
    } catch (err) {
      log.warn(`Failed to update the dolphin paths\n${err}`);
    }
  }

  // Copy settings from when the app was called Slippi Launcher
  const prevVersion = electronSettings.get('previousVersion');
  if (isProd && !prevVersion) {
    // On the very first install of the "Slippi Desktop App", let's transfer over settings from
    // "Slippi Launcher"
    const oldAppDataPath = path.join(appDataPath, "Slippi Launcher");
    const newAppDataPath = path.join(appDataPath, "Slippi Desktop App");

    log.info("Transferring settings from previous Slippi Launcher install...");

    try {
      const oldSettingPath = path.join(oldAppDataPath, "Settings");
      const newSettingsPath = path.join(newAppDataPath, "Settings");
      fs.copyFileSync(oldSettingPath, newSettingsPath);

      const oldDolphinUserPath = path.join(oldAppDataPath, "dolphin", "User");
      const newDolphinUserPath = path.join(newAppDataPath, "dolphin", "User");
      fs.copySync(oldDolphinUserPath, newDolphinUserPath, { overwrite: true });

      log.info("Done transferring settings.");
    } catch (err) {
      log.warn("Failed to transfer settings. Maybe old version didn't exist?");
    }
  }
};

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload)),
  ).catch(console.log);
};

const waitForMainWindow = async () => {
  const wait = ms => new Promise((resolve) => setTimeout(resolve, ms));
  let retryIdx = 0;
  while (!didFinishLoad && retryIdx < 200) {
    // It's okay to await in loop, we want things to be slow in this case
    await wait(100); // eslint-disable-line
    retryIdx += 1;
  }

  if (retryIdx >= 100) {
    throw "Timed out waiting for mainWindow to exist."; // eslint-disable-line
  }

  log.info(`Found mainWindow after ${retryIdx} tries.`);
};

const handleSlippiURIAsync = async (aUrl) => {
  log.info("Handling URL...");
  log.info(aUrl);

  // Check if the input is
  // Specifying a base will provide sane defaults if the input is null or wrong
  const myUrl = new url.URL(aUrl, `null://null`);
  let protocol = myUrl.protocol;
  log.info(`protocol: ${myUrl.protocol}, hostname: ${myUrl.hostname}`);
  if (myUrl.protocol !== `${slippiProtocol}:`) {
    if (fs.existsSync(aUrl)) {
      log.info(`File ${aUrl} exists`);
      protocol = "file:";
    } else {
      return;
    }
  }

  // When handling a Slippi request, focus the window
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }

  switch (protocol) {
  case "slippi:":
    const tmpDir = os.tmpdir();
    const destination = path.join(tmpDir, 'replay.slp');
    const replayPath = myUrl.searchParams.get('path');

    // The following path generation will not work on dev
    // __static didn't exist and __dirname didn't work. /shrug
    const appPath = app.getAppPath();
    const keyPath = path.join(appPath, "../app.asar.unpacked/static/storage-reader.json");
    log.info(`Keypath: ${keyPath}`);
    const storage = new Storage({
      projectId: 'slippi',
      keyFilename: keyPath,
    });
    const bucket = storage.bucket('slippi.appspot.com');
    const file = new File(bucket, replayPath);

    log.info(`Downloading file ${replayPath} to ${destination}`);

    // Dowload file
    await file.download({ destination: destination });

    log.info(`Finished download`);

    // Wait until mainWindow exists so that we can send an IPC to play.
    // We are willing to wait for a few seconds before timing out
    await waitForMainWindow();
    mainWindow.webContents.send("play-replay", path.join(tmpDir, 'replay.slp'));

    break;
  case "file:":
    log.info(myUrl.pathname);
    await waitForMainWindow();
    mainWindow.webContents.send("play-replay", aUrl);

    break;
  default:
    break; // Do nothing
  }
};

const handleSlippiURI = (aUrl) => {
  handleSlippiURIAsync(aUrl).catch((err) => {
    log.error("Handling URI encountered error");
    log.error(err);
  });
};

/**
 * Add event listeners...
 */

app.on('open-url', (event, aUrl) => {
  log.info(`Received mac open-url: ${aUrl}`);
  handleSlippiURI(aUrl);
});

app.on('open-file', (event, aUrl) => {
  log.info(`Received mac open-file: ${aUrl}`);
  handleSlippiURI(aUrl);
});

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }

  // The above code didn't really work well. I couldn't re-open the app,
  // and I couldn't launch replays from URI. Fuck the conventions
  app.quit();
});

// Only allow a single Slippi App instance
const lockObtained = app.requestSingleInstanceLock();
if (!lockObtained) {
  app.quit();
}

app.on('second-instance', (event, argv) => {
  log.info("Second instance detected...");
  log.info(argv);

  // Could do a really shitty hack here because argv does contain the URI
  const aUrl = _.get(argv, 1) || "";
  handleSlippiURI(aUrl);
});

// const isProtocolHandler = app.isDefaultProtocolClient(slippiProtocol);
// if (isProtocolHandler) {
//   log.info("I am the default handler for slippi://");
// } else {
//   // Even with the setup correctly setting up the registry, the previous function would return
//   // false. This next function causes it to return true, but it doesn't fix the issue with the
//   // handler not being triggered
//   log.info("I am NOT the default handler for slippi://");
//   app.setAsDefaultProtocolClient(slippiProtocol);
// }

app.on('ready', async () => {
  if (!lockObtained) {
    return;
  }

  let bootError = null;
  try {
    await handlePreloadLogic();
  } catch (err) {
    bootError = err.message;
  }

  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1100,
    height: 728,
    icon: path.join(__dirname, '../resources/icons/64x64.png'),
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // Handle Slippi URI if provided
  const argURI = _.get(process.argv, 1) || "";
  handleSlippiURI(argURI);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }

    if (bootError) {
      mainWindow.webContents.send('boot-error-encountered', bootError);
    }

    autoUpdater.on('update-downloaded', (info) => {
      mainWindow.webContents.send('update-downloaded', {
        version: info.version,
      });
    });

    autoUpdater.checkForUpdatesAndNotify();

    didFinishLoad = true;
  });

  ipcMain.on('should-quit-and-update', () => {
    console.log("Install message received");
    autoUpdater.quitAndInstall();
  });

  // On navigation links to http urls, open in external browser
  mainWindow.webContents.on('will-navigate', (event, aUrl) => {
    if (!aUrl.startsWith("http")) {
      // Do nothing if aUrl doesn't start with http, without this
      // HMR was not working
      return;
    }

    event.preventDefault();
    shell.openExternal(aUrl);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});
