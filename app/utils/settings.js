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

  return getDefaultDolphinPath();
}

export function getDefaultDolphinPath() {
  // Build default packaged path
  const platform = process.platform;
  if (platform === "win32") {
    // In windows we move dolphin to AppData so settings will save
    const userDataPath = app.getPath("userData")
    return path.join(userDataPath, 'dolphin');
  }
  
  const appPath = app.getAppPath();
  return path.join(appPath, "../app.asar.unpacked/app/dolphin");
}
