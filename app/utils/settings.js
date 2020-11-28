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
  const userDataPath = app.getPath("userData")
  return path.join(userDataPath, 'dolphin');
}

export function getDefaultRootSlpPath() {
  let root = app.getPath("home");
  if (process.platform === "win32") {
    root = app.getPath("documents");
  }
  return path.join(root, "Slippi")
}

export function getRootSlpPath() {
  const storedRootSlpPath = electronSettings.get('settings.rootSlpPath');
  if (storedRootSlpPath) {
    return storedRootSlpPath;
  }

  return getDefaultRootSlpPath();
}