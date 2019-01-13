import electronSettings from 'electron-settings';
import path from 'path';

const { app } = require('electron').remote;

export function isDolphinPathSet() {
  const storedDolphinPath = electronSettings.get('settings.playbackDolphinPath');
  return !!storedDolphinPath;
}

export function getDolphinPath() {
  const storedDolphinPath = electronSettings.get('settings.playbackDolphinPath');
  if (storedDolphinPath) {
    return storedDolphinPath;
  }

  // Build default packaged path
  const appPath = app.getAppPath();
  return path.join(appPath, "../app.asar.unpacked/app/dolphin");
}
