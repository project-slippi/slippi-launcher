import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import SlippiGame from 'slp-parser-js';

import { displayError } from './error';

const electronSettings = require('electron-settings');

export const LOAD_ROOT_FOLDER = 'LOAD_ROOT_FOLDER';
export const CHANGE_FOLDER_SELECTION = 'CHANGE_FOLDER_SELECTION';
export const LOAD_FILES_IN_FOLDER = 'LOAD_FILES_IN_FOLDER';
export const STORE_SCROLL_POSITION = 'STORE_SCROLL_POSITION';

export function loadRootFolder() {
  return async (dispatch, getState) => {
    const rootFolderPath = electronSettings.get('settings.rootSlpPath');
    if (!rootFolderPath) {
      dispatch({
        type: LOAD_ROOT_FOLDER,
        payload: {
          folderFound: false,
        },
      });
    }

    if (rootFolderPath === getState().fileLoader.rootFolderPath) {
      return;
    }

    const folderFound = await new Promise((resolve, reject) => {
      fs.stat(rootFolderPath, (err, stats) => {
        if (err) {
          reject(err);
        }
        resolve(stats);
      });
    }).then(stats => stats.isDirectory(), () => false);

    if (!folderFound) {
      dispatch({
        type: LOAD_ROOT_FOLDER,
        payload: {
          folderFound: false,
        },
      });
      return;
    }

    dispatch({
      type: LOAD_ROOT_FOLDER,
      payload: {
        folderFound: true,
        rootFolderPath: rootFolderPath,
        rootFolderName: path.basename(rootFolderPath),
      },
    });

    dispatch({
      type: CHANGE_FOLDER_SELECTION,
      payload: {
        folderPath: rootFolderPath,
      },
    });

    // Had to add this wait here otherwise the loading screen would not show
    await wait(10); // eslint-disable-line

    const filesAndFolders = await loadFilesInFolder(rootFolderPath);

    dispatch({
      type: LOAD_FILES_IN_FOLDER,
      payload: {
        files: filesAndFolders[0],
        folders: filesAndFolders[1],
      },
    });
  };
}

export function changeFolderSelection(folder) {
  return async (dispatch, getState) => {
    dispatch({
      type: CHANGE_FOLDER_SELECTION,
      payload: {
        folderPath: folder,
      },
    });

    // Had to add this wait here otherwise the loading screen would not show
    await wait(10); // eslint-disable-line

    const currentPath = getState().fileLoader.selectedFolderFullPath;
    const filesAndFolders = await loadFilesInFolder(currentPath);

    dispatch({
      type: LOAD_FILES_IN_FOLDER,
      payload: {
        files: filesAndFolders[0],
        folders: filesAndFolders[1],
      },
    });
  };
}

export function storeScrollPosition(position) {
  return {
    type: STORE_SCROLL_POSITION,
    payload: {
      position: position,
    },
  };
}

export function playFile(file) {
  return (dispatch, getState) => {
    const filePath = file.fullPath;
    if (!filePath) {
      // TODO: Maybe show error message
      return;
    }

    const dolphinManager = getState().fileLoader.dolphinManager;
    dolphinManager.playFile(filePath).catch((err) => {
      const errorAction = displayError(
        'fileLoader-global',
        err.message,
      );

      dispatch(errorAction);
    });
  };
}

export function queueFiles(files) {
  return (dispatch, getState) => {
    if (!Array.isArray(files) || files.length === 0) {
      return;
    }

    const dolphinManager = getState().fileLoader.dolphinManager;
    dolphinManager.queueFiles(files).catch(err => {
      const errorAction = displayError(
        'fileLoader-global',
        err.message,
      );

      dispatch(errorAction);
    });
  };
}

async function loadFilesInFolder(folderPath) {
  const readdirPromise = new Promise((resolve, reject) => {
    fs.readdir(folderPath, {withFileTypes: true}, (err, dirents) => {
      if (err) {
        reject(err);
      }
      resolve(dirents);
    });
  });

  const filesPromise = readdirPromise.then(dirents => (
    dirents.filter(dirent => (
      dirent.isFile()
    )).map(dirent => (
      dirent.name
    )).filter(fileName => (
      // Filter for all .slp files
      path.extname(fileName) === ".slp"
    )).map(fileName => {
      // Compute header information for display
      const fullPath = path.join(folderPath, fileName);
      let game = null;
      let hasError = false;

      // Pre-load settings here
      try {
        game = new SlippiGame(fullPath);

        // Preload settings
        const settings = game.getSettings();
        if (_.isEmpty(settings.players)) {
          throw new Error("Game settings could not be properly loaded.");
        }

        // Preload metadata
        game.getMetadata();
      } catch (err) {
        console.log(`Failed to parse file: ${fullPath}`);
        console.log(err);
        hasError = true;
      }

      return {
        fullPath: fullPath,
        fileName: fileName,
        game: game,
        hasError: hasError,
      };
    })
  ));

  const foldersPromise = readdirPromise.then(dirents => (
    dirents.filter(dirent => (
      dirent.isDirectory()
    )).map(dirent => {
      const folderName = dirent.name;
      const fullPath = path.join(folderPath, folderName);
      return {
        fullPath: fullPath,
        folderName: folderName,
        expanded: true,
        subDirectories: [],
      };
    })
  ));

  return Promise.all([filesPromise, foldersPromise]);
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
