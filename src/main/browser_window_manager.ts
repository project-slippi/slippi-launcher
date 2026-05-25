import { BrowserWindow } from "electron";
import log from "electron-log";

const isDevelopment = process.env.NODE_ENV !== "production";

const BACKGROUND_COLOR = "#1B0B28";

export class BrowserWindowManager {
  private externalWindowsByUrl = new Map<string, BrowserWindow>();

  public openInNewBrowserWindow(url: string) {
    const existing = this.externalWindowsByUrl.get(url);
    if (existing && !existing.isDestroyed()) {
      if (existing.isMinimized()) {
        existing.restore();
      }
      existing.show();
      existing.focus();
      return;
    }

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
      },
    });

    if (isDevelopment) {
      // Devtools automatically opens when a new browser window is created in development mode.
      // We don't really care about devtools in this situation so just close it immediately.
      win.webContents.on("devtools-opened", () => {
        win.webContents.closeDevTools();
      });
    }

    win.loadURL(url).catch(log.error);

    win.on("closed", () => {
      this.externalWindowsByUrl.delete(url);
    });

    win.on("ready-to-show", () => {
      win.show();
    });

    this.externalWindowsByUrl.set(url, win);
  }
}
