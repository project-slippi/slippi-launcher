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
import { app, shell, BrowserWindow } from 'electron';
import _ from 'lodash';
import os from 'os';
import { Storage, File } from '@google-cloud/storage';
import { URL } from 'url';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import path from 'path';
import fs from 'fs-extra';
import MenuBuilder from './menu';

// Set up AppUpdater
log.transports.file.level = 'info';
autoUpdater.logger = log;
log.info('App starting...');

const slippiProtocol = "slippi";

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

const platform = process.platform;
if (process.env.NODE_ENV === 'production' && platform === "win32") {
  log.info("Checking if Dolphin path has been moved...");

  // If on production and windows, check if dolphin has been moved to the right place
  const appPath = app.getAppPath();
  const originalDolphinPath = path.join(appPath, "../app.asar.unpacked/app/dolphin");
  log.info(`Looking for ${originalDolphinPath}`);
  const originalPathExists = fs.existsSync(originalDolphinPath);

  if (originalPathExists) {
    // If path exists, let's move it to app data
    log.info("Moving dolphin path...");
    const userDataPath = app.getPath("userData")
    const targetPath = path.join(userDataPath, 'dolphin');
    fs.moveSync(originalDolphinPath, targetPath, true);
  } else {
    log.info("Path not found, we're good?");
  }
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

const handleSlippiURIAsync = async (url) => {
  log.info("Handling URL...");
  log.info(url);
  
  // Specifying a base will provide sane defaults if the input is null or wrong
  const myUrl = new URL(url, `${slippiProtocol}://null`);
  log.info(`protocol: ${myUrl.protocol}, hostname: ${myUrl.hostname}`);
  if (myUrl.protocol !== `${slippiProtocol}:`) {
    const wait = ms => new Promise((resolve) => setTimeout(resolve, ms));
    let retryIdx = 0;
    while (!didFinishLoad && retryIdx < 200) {
      // It's okay to await in loop, we want things to be slow in this case
      await wait(100); // eslint-disable-line
      retryIdx += 1;
    }

    if (retryIdx === 100) {
      log.warn("Timed out waiting for mainWindow to exist.");
      return;
    }

    log.info(`Found mainWindow after ${retryIdx} tries.`);

    log.info("calling play-local-replay");
    mainWindow.webContents.send("play-local-replay", url);
  }
 
  // When handling a Slippi request, focus the window
  if (mainWindow) {
    if (mainWindow.isMinimized()){
      mainWindow.restore();
    } 
    mainWindow.focus();
  }

  switch (myUrl.hostname) {
  case "play":
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
    const wait = ms => new Promise((resolve) => setTimeout(resolve, ms));
    let retryIdx = 0;
    while (!didFinishLoad && retryIdx < 200) {
      // It's okay to await in loop, we want things to be slow in this case
      await wait(100); // eslint-disable-line
      retryIdx += 1;
    }

    if (retryIdx === 100) {
      log.warn("Timed out waiting for mainWindow to exist.");
      return;
    }

    log.info(`Found mainWindow after ${retryIdx} tries.`);
    mainWindow.webContents.send("play-replay");

    break;
  default:
    break; // Do nothing
  }
};

const handleSlippiURI = (url) => {
  handleSlippiURIAsync(url).catch((err) => {
    log.error("Handling URI encountered error");
    log.error(err);
  });
}

/**
 * Add event listeners...
 */

app.on('open-url', (event, url) => {
  log.info(`Received mac open-url: ${url}`);
  handleSlippiURI(url);
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

// Only allow a single Slippi Launcher instance
const lockObtained = app.requestSingleInstanceLock();
if (!lockObtained) {
  app.quit();
}

app.on('second-instance', (event, argv) => {
  log.info("Second instance detected...");
  log.info(argv);

  // Could do a really shitty hack here because argv does contain the URI
  const url = _.get(argv, 1) || "";
  handleSlippiURI(url);
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

    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on('update-downloaded', () => {
      mainWindow.webContents.send('update-downloaded');
    });

    didFinishLoad = true;
  });

  // On navigation links to http urls, open in external browser
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith("http")) {
      // Do nothing if url doesn't start with http, without this
      // HMR was not working
      return;
    }

    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});
