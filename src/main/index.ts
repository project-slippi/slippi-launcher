import "@broadcast/main";
import "@dolphin/main";

import { isDevelopment } from "common/constants";
import { app, BrowserWindow, shell } from "electron";
import contextMenu from "electron-context-menu";
import * as path from "path";
import { format as formatUrl } from "url";

import { setupListeners } from "./listeners";

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow | null = null;

function createMainWindow() {
  const window = new BrowserWindow({
    show: false,
    width: 1100,
    height: 728,
    backgroundColor: "#23252C",
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

  // Automatically open new-tab/new-window URLs in their default browser
  window.webContents.on("new-window", (event: Event, url: string) => {
    event.preventDefault();
    shell.openExternal(url);
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
