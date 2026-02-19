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
import { delay } from "@common/delay";
import { Preconditions } from "@common/preconditions";
import { DolphinLaunchType } from "@dolphin/types";
import { ipc_statsPageRequestedEvent } from "@replays/ipc";
import { ipc_openSettingsModalEvent } from "@settings/ipc";
import { SlippiGame } from "@slippi/slippi-js";
import type CrossProcessExports from "electron";
import { app, BrowserWindow, shell } from "electron";
import log from "electron-log";
import { autoUpdater } from "electron-updater";
import * as fs from "fs-extra";
import * as http from "http";
import * as https from "https";
import get from "lodash/get";
import last from "lodash/last";
import path from "path";
import url from "url";
import { download } from "utils/download";
import { fileExists } from "utils/file_exists";

import { getConfigFlags } from "./flags/flags";
import { installModules } from "./install_modules";
import { MenuBuilder } from "./menu";
import { clearTempFolder, resolveHtmlPath } from "./util";

const BACKGROUND_COLOR = "#1B0B28";

const isDevelopment = process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true";

const isMac = process.platform === "darwin";

let menu: CrossProcessExports.Menu | null = null;
let mainWindow: BrowserWindow | null = null;
let didFinishLoad = false;

log.initialize();
log.errorHandler.startCatching();
log.transports.file.level = isDevelopment ? "info" : "warn";

// Disable IPC hooks in development to prevent duplicate console logs
// In dev mode, both main and renderer import electron-log, which causes duplication
if (isDevelopment) {
  log.transports.ipc.level = false;
}

// Only allow a single Slippi App instance
const lockObtained = app.requestSingleInstanceLock();
if (!lockObtained) {
  app.quit();
}

const flags = getConfigFlags();
const { dolphinManager, settingsManager } = installModules(flags);

class AppUpdater {
  constructor() {
    autoUpdater.logger = log;
    autoUpdater.autoInstallOnAppQuit = settingsManager.get().settings.autoUpdateLauncher;
  }
}

if (process.env.NODE_ENV === "production") {
  const sourceMapSupport = require("source-map-support");
  sourceMapSupport.install();
}

if (isDevelopment) {
  require("electron-debug")();
}

const installExtensions = async () => {
  const installer = require("electron-devtools-installer");
  const forceDownload = Boolean(process.env.UPGRADE_EXTENSIONS);
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

  // clear temp files safely before the app has fully started and replays are being loaded for playback
  try {
    await clearTempFolder();
  } catch (err) {
    // silently fail since this isn't a critical issue
    log.error(
      `Could not clear temp folder on startup due to:
      ${err instanceof Error ? err.message : JSON.stringify(err)}`,
    );
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1100,
    height: 728,
    minHeight: isDevelopment ? undefined : 450,
    minWidth: isDevelopment ? undefined : 900,
    backgroundColor: BACKGROUND_COLOR,

    // This setting only takes effect on macOS, and simply opts it into the modern
    // Big-Sur frame UI for the window style.
    titleBarStyle: "hiddenInset",
    autoHideMenuBar: true,

    webPreferences: {
      sandbox: false,
      preload: app.isPackaged ? path.join(__dirname, "preload.js") : path.join(__dirname, "../../.erb/dll/preload.js"),
    },
  });

  mainWindow.loadURL(resolveHtmlPath("index.html")).catch(log.error);

  mainWindow.on("ready-to-show", () => {
    Preconditions.checkExists(mainWindow, '"mainWindow" is not defined');

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

  mainWindow.on("page-title-updated", (event) => {
    // Always keep the initial window title
    event.preventDefault();
  });

  const menuBuilder = new MenuBuilder({
    mainWindow,
    onOpenPreferences: () => {
      void openPreferences().catch(log.error);
    },
    onOpenReplayFile: (filePath: string) => playReplayAndShowStats(filePath, false),
    createWindow,
    onOpenAppSupportFolder: () => {
      const path = app.getPath("userData");
      void shell.openPath(path);
    },
    enableDevTools: isDevelopment,
  });
  menu = menuBuilder.buildMenu();

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
  // Clean up any active streams
  activeStreams.forEach((timeoutId, destination) => {
    clearTimeout(timeoutId);
    log.info(`Cleaned up stream for ${destination}`);
  });
  activeStreams.clear();

  // On macOS, the window closing shouldn't quit the actual process.
  // Instead, grab and activate a hidden menu item to enable the user to
  // recreate the window on-demand.
  if (isMac && menu) {
    const macMenuItem = menu.getMenuItemById("macos-window-toggle");
    if (macMenuItem) {
      macMenuItem.enabled = true;
      macMenuItem.visible = true;
    }
    return;
  }

  app.quit();
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

// Track active streams for cleanup
const activeStreams = new Map<string, NodeJS.Timeout>();

/**
 * Streams a replay file continuously for mirror mode.
 * Downloads the file in chunks and updates it as new data becomes available.
 * Stops streaming when the Game End event (0x39) is detected.
 */
const startReplayStream = async (url: string, destination: string): Promise<void> => {
  log.info(`Starting replay stream from ${url} to ${destination}`);

  let lastSize = 0;
  let gameEndDetected = false;
  const streamInterval = 500; // Check for updates every 500ms
  let consecutiveErrorCount = 0;
  const maxConsecutiveErrors = 10; // Stop after 10 consecutive errors (5 seconds of errors)

  // Initial download to get the file started
  try {
    await download({ url, destinationFile: destination, overwrite: true });
    const stats = await fs.stat(destination);
    lastSize = stats.size;
    log.info(`Initial download complete, file size: ${lastSize} bytes`);
  } catch (err) {
    log.error(`Failed to start initial download: ${err}`);
    throw err;
  }

  // Function to check if Game End event is present using SlippiGame
  const checkForGameEnd = async (): Promise<boolean> => {
    try {
      // Use SlippiGame with processOnTheFly to handle incomplete files
      const game = new SlippiGame(destination, { processOnTheFly: true });
      const gameEnd = game.getGameEnd();

      if (gameEnd) {
        const endTypes = {
          1: "TIME!",
          2: "GAME!",
          7: "No Contest",
        };
        const endMessage = endTypes[gameEnd.gameEndMethod as keyof typeof endTypes] || "Unknown";
        log.info(`Game End detected: ${endMessage}`);
        return true;
      }

      return false;
    } catch (err) {
      // This is expected for incomplete files during streaming
      log.debug(`Game end check failed (expected during streaming): ${err}`);
      return false;
    }
  };

  // Start continuous streaming in the background
  const streamLoop = async () => {
    try {
      // Check if game has ended before making another request
      if (gameEndDetected) {
        log.info(`Game has ended, stopping stream for ${url}`);
        activeStreams.delete(destination);
        return;
      }

      // Use HTTP range request to get only new data
      const urlObj = new URL(url);
      const httpModule = urlObj.protocol === "https:" ? https : http;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        headers: {
          Range: `bytes=${lastSize}-`,
        },
      };

      const req = httpModule.request(options, (res) => {
        if (res.statusCode === 206 || res.statusCode === 200) {
          consecutiveErrorCount = 0; // Reset error count on successful response
          const chunks: Buffer[] = [];

          res.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
          });

          res.on("end", async () => {
            if (chunks.length > 0) {
              const newData = Buffer.concat(chunks);
              if (newData.length > 0) {
                // Append new data to the file
                await fs.appendFile(destination, newData);
                lastSize += newData.length;
                log.debug(`Streamed ${newData.length} new bytes, total size: ${lastSize}`);

                // Check if the game has ended
                gameEndDetected = await checkForGameEnd();
                if (gameEndDetected) {
                  log.info(`Game End detected, stopping stream for ${url}`);
                  activeStreams.delete(destination);
                  return;
                }
              }
            }

            // Continue streaming
            const timeoutId = setTimeout(streamLoop, streamInterval);
            activeStreams.set(destination, timeoutId);
          });
        } else {
          // Continue streaming even if no new data as the game could be paused
          const timeoutId = setTimeout(streamLoop, streamInterval);
          activeStreams.set(destination, timeoutId);
        }
      });

      req.on("error", (err) => {
        log.error(`Stream request failed: ${err}`);
        consecutiveErrorCount++;

        // Stop streaming if too many consecutive errors
        if (consecutiveErrorCount >= maxConsecutiveErrors) {
          log.info(`Stopping stream for ${url} - too many consecutive errors (${consecutiveErrorCount})`);
          activeStreams.delete(destination);
          return;
        }

        // Continue streaming despite errors
        const timeoutId = setTimeout(streamLoop, streamInterval);
        activeStreams.set(destination, timeoutId);
      });

      req.end();
    } catch (err) {
      log.error(`Stream update failed: ${err}`);
      consecutiveErrorCount++;

      // Stop streaming if too many consecutive errors
      if (consecutiveErrorCount >= maxConsecutiveErrors) {
        log.info(`Stopping stream for ${url} - too many consecutive errors (${consecutiveErrorCount})`);
        activeStreams.delete(destination);
        return;
      }

      // Continue streaming despite errors
      const timeoutId = setTimeout(streamLoop, streamInterval);
      activeStreams.set(destination, timeoutId);
    }
  };

  // Start the streaming loop after a brief delay to let Dolphin start
  const initialTimeoutId = setTimeout(streamLoop, 1000);
  activeStreams.set(destination, initialTimeoutId);
};

/**
 * Stops streaming for a specific destination file
 */
const stopReplayStream = (destination: string): void => {
  const timeoutId = activeStreams.get(destination);
  if (timeoutId) {
    clearTimeout(timeoutId);
    activeStreams.delete(destination);
    log.info(`Stopped streaming for ${destination}`);
  }
};

/**
 * Handles slippi:// protocol URLs for opening remote replays.
 * Supports the following parameters:
 * - path: The path to the replay file (required)
 * - mirror: Set to "true" or "1" to launch in mirror mode (optional, defaults to normal mode)
 *
 * Examples:
 * - slippi://path=replay.slp (normal mode)
 * - slippi://path=replay.slp&mirror=true (mirror mode)
 */
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
      // Check if mirror mode is requested
      const mirrorParam = myUrl.searchParams.get("mirror");
      const isMirror = mirrorParam === "true" || mirrorParam === "1";

      log.info(`Mirror mode requested: ${isMirror}`);

      if (isMirror) {
        // For mirror mode, we need to stream the replay continuously
        const streamUrl = replayPath.startsWith("http")
          ? replayPath
          : `https://storage.googleapis.com/slippi.appspot.com/${replayPath}`;
        log.info(`Streaming replay in mirror mode: ${streamUrl}`);

        const tmpDir = path.join(app.getPath("userData"), "temp");
        await fs.ensureDir(tmpDir);
        const destination = path.join(tmpDir, `mirror_${Date.now()}_${path.basename(replayPath)}`);

        // Start streaming the replay file
        await startReplayStream(streamUrl, destination);
        await playReplayAndShowStats(destination, isMirror);
      } else {
        // For normal mode, download the file first
        // For some reason the file refuses to download if it's prefixed with "/"
        if (replayPath[0] === "/") {
          replayPath = replayPath.slice(1);
        }

        const tmpDir = path.join(app.getPath("userData"), "temp");
        await fs.ensureDir(tmpDir);
        const destination = path.join(tmpDir, path.basename(replayPath));

        const fileAlreadyExists = await fileExists(destination);
        if (!fileAlreadyExists) {
          const dlUrl = replayPath.startsWith("http")
            ? replayPath
            : `https://storage.googleapis.com/slippi.appspot.com/${replayPath}`;
          log.info(`Downloading file ${replayPath} to ${destination}`);
          // Download file
          await download({ url: dlUrl, destinationFile: destination, overwrite: true });
          log.info(`Finished download`);
        } else {
          log.info(`${destination} already exists. Skipping download...`);
        }
        await playReplayAndShowStats(destination, isMirror);
      }
      break;
    }
    case "file:": {
      log.info(myUrl.pathname);
      await playReplayAndShowStats(aUrl, false);
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

const playReplayAndShowStats = async (filePath: string, mirror = false) => {
  // Ensure playback dolphin is actually installed
  await dolphinManager.installDolphin(DolphinLaunchType.PLAYBACK);

  log.info(`Launching replay in ${mirror ? "mirror" : "normal"} mode: ${filePath}`);

  // For mirror mode, set up a listener to stop streaming when Dolphin closes
  if (mirror) {
    const stopStreamingOnDolphinClose = (event: any) => {
      if (event.dolphinType === DolphinLaunchType.PLAYBACK && event.instanceId === "playback") {
        log.info("Dolphin closed, stopping stream...");
        stopReplayStream(filePath);
        // Unsubscribe from future events
        subscription.unsubscribe();
      }
    };

    // Subscribe to dolphin events to detect when it closes
    const subscription = dolphinManager.events.subscribe(stopStreamingOnDolphinClose);
  }

  // Launch the replay
  await dolphinManager.launchPlaybackDolphin("playback", {
    mode: mirror ? "mirror" : "normal",
    replay: filePath,
  });

  // For mirror mode, wait a bit longer before showing stats to ensure some data is available
  if (mirror) {
    log.info("Waiting for initial stream data before showing stats...");
    await delay(2000); // Wait 2 seconds for some data to be streamed
  }

  await waitForMainWindow();
  if (mainWindow) {
    await ipc_statsPageRequestedEvent.main!.trigger({ filePath });
  }
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
  .catch(log.error);

// Clean up streams on app quit
app.on("before-quit", () => {
  log.info("App is quitting, cleaning up active streams...");
  activeStreams.forEach((timeoutId, destination) => {
    clearTimeout(timeoutId);
    log.info(`Cleaned up stream for ${destination}`);
  });
  activeStreams.clear();
});

const openPreferences = async () => {
  if (!mainWindow) {
    await createWindow();
  }
  await ipc_openSettingsModalEvent.main!.trigger({});
};
