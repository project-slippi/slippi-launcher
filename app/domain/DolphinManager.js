import util from 'util';
import { execFile } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import retry from 'async-retry';
import log from 'electron-log';
import ini from 'ini';
import electronSettings from 'electron-settings';
import { EventEmitter } from 'events';
import { Frames } from '@slippi/slippi-js';

import { getDolphinPath } from '../utils/settings';
import { sudoRemovePath } from '../utils/sudoExec';

const { app } = require('electron').remote;

export default class DolphinManager extends EventEmitter {
  constructor(key, settings = {}) {
    super();
    // The key of this dolphin manager, doesn't really do anything
    // atm other than get added to the commFileName
    this.key = key;
    this.isRunning = false;
    this.settings = settings;

    const commFilePaths = this.genCommFilePaths();

    this.outputFilePath = commFilePaths.output;
  }

  genCommFilePaths() {
    // Create comm file in temp directory
    const tmpDir = os.tmpdir();
    const uniqueId = crypto.randomBytes(3 * 4).toString('hex');
    const commFileName = `slippi-comm-${this.key}-${uniqueId}.txt`;
    const commFileFullPath = path.join(tmpDir, commFileName);

    return {
      'output': commFileFullPath,
    };
  }

  updateSettings(settings) {
    this.settings = {
      ...this.settings,
      ...settings,
    };
  }

  removeCommFiles() {
    fs.removeSync(this.outputFilePath);
  }

  async configureDolphin() {
    await this.runDolphin(false);
  }

  async resetDolphin() {
    const platform = process.platform;
    const appPath = app.getAppPath();
    const originalDolphinPath = process.env.APPIMAGE ? path.join(process.env.APPDIR, "resources/app.asar.unpacked/app/dolphin") : path.join(appPath, "../app.asar.unpacked/app/dolphin");
    log.info("Resetting dolphin");
    const userDataPath = app.getPath("userData");
    const targetPath = path.join(userDataPath, 'dolphin');
    log.info("Overwriting dolphin");

    let isCopySuccess = false;
    try {
      if (platform === "win32" || platform === "darwin" || process.env.APPIMAGE) {
        fs.removeSync(targetPath);
        fs.copySync(originalDolphinPath, targetPath);
      }
      if (process.platform === "linux") {
        const linuxUserDir = path.join(os.homedir(), ".config", "SlippiPlayback");
        fs.removeSync(linuxUserDir); // clear the User dir on linux
      }
      isCopySuccess = true;
    } catch (err) {
      log.error("Failed to reset Dolphin, will try again with elevated permissions");
    }

    if (!isCopySuccess) {
      try {
        // TODO: This doesn't actually work, the UAC prompt never shows up. Might need to use
        // TODO: ipc to trigger it in the main process? But I'm too lazy right now
        await sudoRemovePath(targetPath);
        fs.copySync(originalDolphinPath, targetPath);
        isCopySuccess = true;
      } catch (err) {
        log.error("Failed to reset Dolphin with elevated permissions");
        log.error(err);
        throw new Error("Failed to reset Dolphin. You may need to reinstall the desktop app.");
      }
    }
  }

  setGamePath(filePath) {
    const fileDir = path.dirname(filePath);
    const platform = process.platform;
    const isDev = process.env.NODE_ENV === "development";
    const storedDolphinPath = electronSettings.get('settings.playbackDolphinPath');
    let dolphinPath = storedDolphinPath || path.join(app.getPath("appData"), "Slippi Desktop App", "dolphin");
    // Handle the dolphin INI file being in different paths per platform
    switch (platform) {
    case "darwin": // osx
      dolphinPath = isDev ? "./app/dolphin-dev/osx/Slippi Dolphin.app/Contents/Resources/User" : path.join(dolphinPath, "Slippi Dolphin.app", "Contents", "Resources", "User");
      break;
    case "win32": // windows
      dolphinPath = isDev ? "./app/dolphin-dev/windows/User" : path.join(dolphinPath, "User");
      break;
    case "linux":
      dolphinPath = path.join(os.homedir(), ".config", "SlippiPlayback");
      break;
    default:
      throw new Error("The current platform is not supported");
    }
    try {
      const iniPath = path.join(dolphinPath, "Config", "Dolphin.ini");
      if (fs.existsSync(iniPath)) {
        const dolphinINI = ini.parse(fs.readFileSync(iniPath, 'utf-8'));
        dolphinINI.General.ISOPath0 = fileDir;
        const numPaths = dolphinINI.General.ISOPaths;
        dolphinINI.General.ISOPaths = numPaths !== "0" ? numPaths : "1";
        const newINI = ini.encode(dolphinINI);
        fs.writeFileSync(iniPath, newINI);
      } else {
        log.info("There isn't a User dir to write to.");
        const configPath = path.join(dolphinPath, "Config");
        const newINI = ini.encode({ "General": { "ISOPath0": fileDir, "ISOPaths": 1 } });
        log.info("attempting to mkdir -p");
        fs.mkdirpSync(configPath);
        fs.writeFileSync(iniPath, newINI);
      }
    } catch (err) {
      log.warn(`Failed to update the dolphin paths\n${err}`);
      throw err;
    }
  }

  async startPlayback() {
    await this.runDolphin(true);
  }

  async writeCommFile(jsonString) {
    return retry(() => {
      log.info(`Writing to Dolphin comm file: ${jsonString}`);
      fs.writeFileSync(this.outputFilePath, jsonString);
    }, {
      retries: 5,
      factor: 1,
      minTimeout: 100,
      maxTimeout: 300,
      onRetry: (err) => {
        log.error("Encountered error trying to write to Dolphin comm file.", err);
      },
    });
  }

  async playFile(filePath, startDolphin = true, startFrame=Frames.FIRST) {
    const uniqueId = crypto.randomBytes(3 * 4).toString('hex');

    const jsonString = JSON.stringify({
      mode: this.settings.mode || "normal",
      replay: filePath,
      isRealTimeMode: this.settings.isRealTimeMode || false,
      commandId: uniqueId, // Indicates to Dolphin to play new replay
      startFrame: startFrame,
    });

    await this.writeCommFile(jsonString);

    if (startDolphin) {
      await this.runDolphin(true);
    }
  }

  async queueFiles(files) {
    const jsonString = JSON.stringify({
      mode: "queue",
      replay: "",
      isRealTimeMode: false,
      queue: files.map(file => ({
        path: file.fullPath,
        gameStartAt: file.game.getMetadata().startAt || "",
        gameStation: file.game.getMetadata().consoleNick || "",
      })),
    });

    return this.writeCommFile(jsonString).then(() => this.runDolphin(true));
  }

  async runDolphin(startPlayback) {
    if (this.isRunning) {
      // TODO: Bring dolphin into focus
      return;
    }

    const platform = process.platform;
    const isDev = process.env.NODE_ENV === "development";

    // Get release dolphin path. Will be overwritten if in
    // development mode
    let dolphinPath = getDolphinPath();

    // Get melee file location from settings
    const meleeFile = electronSettings.get('settings.isoPath');
    if (!meleeFile) {
      throw new Error(
        `Replays cannot be played without a Melee ISO selected. Please return to the
        settings page and select a Melee ISO.`
      );
    }

    if (!fs.existsSync(meleeFile)) {
      throw new Error(
        `The ISO selected does not exist. Please return to the settings page and select a Melee ISO.`
      );
    }

    if (path.extname(meleeFile) !== ".iso" || path.extname(meleeFile !== ".gcm")) {
      throw new Error(
        `The Melee game file selected is not an ISO or GCM file. Please return to the settings page 
        and select a Melee ISO.`
      );
    }

    // Here we are going to build the platform-specific commands required to launch
    // dolphin from the command line with the correct game
    // When in development mode, use the build-specific dolphin version
    // In production mode, only the build from the correct platform should exist
    let executablePath;
    switch (platform) {
    case "darwin": // osx
      dolphinPath = isDev ? "./app/dolphin-dev/osx" : dolphinPath;
      executablePath = path.join(dolphinPath, "Slippi Dolphin.app/Contents/MacOS/Slippi Dolphin");
      break;
    case "win32": // windows
      dolphinPath = isDev ? "./app/dolphin-dev/windows" : dolphinPath;
      executablePath = path.join(dolphinPath, "Slippi Dolphin.exe");
      break;
    case "linux": // linux
      dolphinPath = isDev ? "./app/dolphin-dev/linux" : dolphinPath;
      const appImagePath = path.join(dolphinPath, "Slippi_Playback-x86_64.AppImage");
      const emuPath = path.join(dolphinPath, "dolphin-emu");
      if (fs.existsSync(appImagePath)) {
        executablePath = appImagePath;
      } else {
        executablePath = emuPath;
      }
      break;
    default:
      throw new Error("The current platform is not supported");
    }

    let args = [
      '-i',
      this.outputFilePath,
    ];

    if (this.settings.mode === "mirror") {
      args = args.concat(['--hide-seekbar']);
    }

    if (startPlayback) {
      args = args.concat([
        '-b',
        '-e',
        meleeFile,
      ]);
    }

    if (!fs.existsSync(executablePath)) {
      throw new Error(
        `Couldn't find Dolphin executable at ${executablePath}. ` +
        `Your "Playback Dolphin Path" option is currently set to ${dolphinPath}. ` +
        `Make sure this directory exists and contains the playback instance of Dolphin.`
      );
    }

    try {
      this.isRunning = true;
      const execFilePromise = util.promisify(execFile);
      await execFilePromise(executablePath, args);
    } finally {
      // TODO: This doesn't work right when the main electon app gets
      // TODO: closed first instead of the dolphin instance.
      // TODO: Could cause the temp directory to get cluttered
      this.removeCommFiles();
      this.isRunning = false;
      this.emit('dolphin-closed');
    }
  }
}
