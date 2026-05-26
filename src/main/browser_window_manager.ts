import { BrowserWindow, shell } from "electron";
import log from "electron-log";

const isDevelopment = process.env.NODE_ENV !== "production";

const BACKGROUND_COLOR = "#1B0B28";

/**
 * Manages browser windows that are opened from the main app. Used for external URLs.
 * This is primarily used for opening tournament streams in a separate always-on-top window.
 */
export class BrowserWindowManager {
  private externalWindowsByUrl = new Map<string, BrowserWindow>();

  public async openInNewBrowserWindow(url: string) {
    const existing = this.externalWindowsByUrl.get(url);
    if (existing && !existing.isDestroyed()) {
      if (existing.isMinimized()) {
        existing.restore();
      }
      existing.show();
      existing.focus();
      return;
    }

    const { hostname } = new URL(url);
    const win = new BrowserWindow({
      width: 960,
      height: 540,
      alwaysOnTop: true,
      fullscreenable: false, // When a website requests fullscreen, fill only the browser window
      show: false,
      backgroundColor: BACKGROUND_COLOR,
      autoHideMenuBar: true,
      webPreferences: {
        sandbox: true,
        // We partition by hostname to isolate cookies and other data
        partition: `temp:${hostname}`,
      },
    });

    if (isDevelopment) {
      // Devtools automatically opens when a new browser window is created in development mode.
      // We don't really care about devtools in this situation so just close it immediately.
      win.webContents.on("devtools-opened", () => {
        win.webContents.closeDevTools();
      });
    }

    win.on("closed", () => {
      this.externalWindowsByUrl.delete(url);
    });

    win.on("ready-to-show", () => {
      win.show();
    });

    win.webContents.setWindowOpenHandler((edata) => {
      void shell.openExternal(edata.url);
      return { action: "deny" };
    });

    try {
      await win.loadURL(url);
      this.externalWindowsByUrl.set(url, win);
    } catch (err) {
      log.error(err);
      throw err;
    }
  }
}
