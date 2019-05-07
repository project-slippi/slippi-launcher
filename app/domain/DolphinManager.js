import util from 'util';
import { execFile } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import retry from 'async-retry';
import log from 'electron-log';

import { getDolphinPath } from '../utils/settings';

const electronSettings = require('electron-settings');

export default class DolphinManager {
  constructor(key, settings = {}) {
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

  async startPlayback() {
    await this.runDolphin(true);
  }

  async playFile(filePath, startDolphin = true) {
    const uniqueId = crypto.randomBytes(3 * 4).toString('hex');

    const jsonString = JSON.stringify({
      mode: this.settings.mode || "normal",
      replay: filePath,
      isRealTimeMode: this.settings.isRealTimeMode || false,
      commandId: uniqueId, // Indicates to Dolphin to play new replay
    });

    await retry(() => {
      log.info(`Writing to Dolphin comm file, playing replay: ${filePath}`);
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

    if (startDolphin) {
      await this.runDolphin(true);
    }
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
        `Files cannot be played without a melee iso selected. Please return to the
        settings page and select a melee iso.`
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
      executablePath = path.join(dolphinPath, "Dolphin.app/Contents/MacOS/Dolphin");
      break;
    case "win32": // windows
      dolphinPath = isDev ? "./app/dolphin-dev/windows" : dolphinPath;
      executablePath = path.join(dolphinPath, "Dolphin.exe");
      break;
    case "linux": // linux
      // No need to dev override because Linux users will always need to specify
      // the path inside of the application
      executablePath = path.join(dolphinPath, "dolphin-emu");
      break;
    default:
      throw new Error("The current platform is not supported");
    }

    let args = [
      '-i',
      this.outputFilePath,
    ];

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
    }
  }
}
