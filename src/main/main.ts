/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { colors } from "@common/colors";
import { delay } from "@common/delay";
import { dolphinManager } from "@dolphin/manager";
import { ipc_statsPageRequestedEvent } from "@replays/ipc";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import log from "electron-log";
import { autoUpdater } from "electron-updater";
import * as fs from "fs-extra";
import get from "lodash/get";
import last from "lodash/last";
import path from "path";
import url from "url";

import { download } from "./download";
import { fileExists } from "./fileExists";
import { MenuBuilder } from "./menu";
import { setupIpc } from "./setupIpc";
import { resolveHtmlPath } from "./util";

let mainWindow: BrowserWindow | null = null;
let didFinishLoad = false;

// Only allow a single Slippi App instance
const lockObtained = app.requestSingleInstanceLock();
if (!lockObtained) {
  app.quit();
}

setupIpc();

class AppUpdater {
  public constructor() {
    log.transports.file.level = "info";
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify().catch(log.error);
  }
}

ipcMain.on("ipc-example", async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply("ipc-example", msgTemplate("pong"));
});

if (process.env.NODE_ENV === "production") {
  const sourceMapSupport = require("source-map-support");
  sourceMapSupport.install();
}

const isDevelopment = process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true";

if (isDevelopment) {
  require("electron-debug")();
}

const installExtensions = async () => {
  const installer = require("electron-devtools-installer");
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ["REACT_DEVELOPER_TOOLS"];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1100,
    height: 728,
    minHeight: isDevelopment ? undefined : 450,
    minWidth: isDevelopment ? undefined : 900,
    backgroundColor: colors.purpleDarker,

    // This setting only takes effect on macOS, and simply opts it into the modern
    // Big-Sur frame UI for the window style.
    titleBarStyle: "hiddenInset",
    autoHideMenuBar: true,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadURL(resolveHtmlPath("index.html")).catch(log.error);

  mainWindow.on("ready-to-show", () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    didFinishLoad = true;

    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu({
    enableDevTools: isDevelopment,
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    void shell.openExternal(edata.url);
    return { action: "deny" };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on("window-all-closed", () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== "darwin") {
    app.quit();
  }
});

const slippiProtocol = "slippi";

const waitForMainWindow = async () => {
  let retryIdx = 0;
  while (!didFinishLoad && retryIdx < 200) {
    // It's okay to await in loop, we want things to be slow in this case
    await delay(100); // eslint-disable-line
    retryIdx += 1;
  }

  if (retryIdx >= 100) {
    throw "Timed out waiting for mainWindow to exist."; // eslint-disable-line
  }

  log.info(`Found mainWindow after ${retryIdx} tries.`);
};

const handleSlippiURIAsync = async (aUrl: string) => {
  log.info("Handling URL...");
  log.info(aUrl);

  // Check if the input is
  // Specifying a base will provide sane defaults if the input is null or wrong
  const myUrl = new url.URL(aUrl, `null://null`);
  let protocol = myUrl.protocol;
  log.info(`protocol: ${myUrl.protocol}, hostname: ${myUrl.hostname}`);
  if (myUrl.protocol !== `${slippiProtocol}:`) {
    if (await fileExists(aUrl)) {
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
  } else {
    await createWindow();
  }

  switch (protocol) {
    case "slippi:": {
      let replayPath = myUrl.searchParams.get("path");
      if (!replayPath) {
        return;
      }
      // For some reason the file refuses to download if it's prefixed with "/"
      if (replayPath[0] === "/") {
        replayPath = replayPath.slice(1);
      }

      const tmpDir = path.join(app.getPath("userData"), "temp");
      await fs.ensureDir(tmpDir);
      const destination = path.join(tmpDir, path.basename(replayPath));

      const fileAlreadyExists = await fileExists(destination);
      if (!fileAlreadyExists) {
        const dlUrl = `https://storage.googleapis.com/slippi.appspot.com/${replayPath}`;
        log.info(`Downloading file ${replayPath} to ${destination}`);
        // Dowload file
        await download(dlUrl, destination);
        log.info(`Finished download`);
      } else {
        log.info(`${destination} already exists. Skipping download...`);
      }

      // Wait until mainWindow exists so that we can send an IPC to play.
      // We are willing to wait for a few seconds before timing out
      await waitForMainWindow();
      if (mainWindow) {
        await playReplayAndShowStats(destination);
      }

      break;
    }
    case "file:": {
      log.info(myUrl.pathname);
      await waitForMainWindow();
      if (mainWindow) {
        // mainWindow.webContents.send("play-replay", aUrl);
        await playReplayAndShowStats(aUrl);
      }

      break;
    }
    default: {
      break; // Do nothing
    }
  }
};

const handleSlippiURI = (aUrl: string) => {
  // Filter out command line parameters and invalid urls
  if (aUrl.startsWith("-")) {
    return;
  }

  handleSlippiURIAsync(aUrl).catch((err) => {
    log.error("Handling URI encountered error");
    log.error(err);
  });
};

app.on("open-url", (_, aUrl) => {
  log.info(`Received open-url event: ${aUrl}`);
  handleSlippiURI(aUrl);
});

app.on("open-file", (_, aUrl) => {
  log.info(`Received open-file event: ${aUrl}`);
  handleSlippiURI(aUrl);
});

app.on("second-instance", (_, argv) => {
  log.info("Second instance detected...");
  log.info(argv);

  const lastItem = last(argv);
  if (argv.length === 1 || !lastItem) {
    return;
  }

  handleSlippiURI(lastItem);
});

const playReplayAndShowStats = async (filePath: string) => {
  await dolphinManager.launchPlaybackDolphin("playback", {
    mode: "normal",
    replay: filePath,
  });
  await ipc_statsPageRequestedEvent.main!.trigger({ filePath });
};

app
  .whenReady()
  .then(() => {
    if (!lockObtained) {
      return;
    }

    void createWindow();

    // Handle Slippi URI if provided
    const argURI = get(process.argv, 1);
    log.info(process.argv);
    if (argURI) {
      handleSlippiURI(argURI);
    }

    app.on("activate", () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) {
        void createWindow();
      }
    });
  })
  .catch(console.log);
