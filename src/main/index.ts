import { colors } from "common/colors";
import { FileResult } from "common/replayBrowser/types";
import { app, BrowserWindow, ipcMain } from "electron";
import contextMenu from "electron-context-menu";
import Nedb from "nedb-promises-ts";
import * as path from "path";
import { format as formatUrl } from "url";

import { setupListeners } from "./listeners";

const db = new Nedb<FileResult>({ autoload: true, filename: path.join(app.getPath("userData"), "statsDB") });

const loadReplays = async () => {
  const res = await db.find({}).sort({ timestamp: 1 });
  return Array.from(res.values());
};

const saveReplay = async (replayFile: FileResult) => {
  await db.insert(replayFile);
  console.log(`inserted ${replayFile.fullPath} to the db`);
  return null;
};

ipcMain.on("load-replays", async (event) => {
  event.reply("load-replays", await loadReplays());
});

ipcMain.on("save-replay", async (event, replay) => {
  event.reply("save-replay", await saveReplay(replay));
});

const isDevelopment = process.env.NODE_ENV !== "production";

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow | null = null;

function createMainWindow() {
  const window = new BrowserWindow({
    show: false,
    width: 1100,
    height: 728,
    backgroundColor: colors.offGray,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      enableRemoteModule: true,
    },
    autoHideMenuBar: true,
  });

  if (isDevelopment) {
    window.webContents.openDevTools();

    // Enable context menu for inspecting elements
    contextMenu();
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
  } else {
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file",
        slashes: true,
      }),
    );
  }

  window.on("closed", () => {
    mainWindow = null;
  });

  window.webContents.on("devtools-opened", () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  window.once("ready-to-show", () => {
    window.show();
    window.focus();
  });

  setupListeners();

  return window;
}

// quit application when all windows are closed
app.on("window-all-closed", () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

const onReady = () => {
  mainWindow = createMainWindow();
};

if (isDevelopment) {
  // There's an issue with Windows 10 dark mode where the ready event doesn't fire
  // when running in dev mode. Use the prepend listener to work around this.
  // See https://github.com/electron/electron/issues/19468#issuecomment-623529556 for more info.
  app.prependOnceListener("ready", onReady);
} else {
  // Otherwise create main BrowserWindow when electron is ready normally
  app.on("ready", onReady);
}
