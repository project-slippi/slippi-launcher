import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import SlippiGame from 'slp-parser-js';

import { displayError } from './error';

export const LOAD_ROOT_FOLDER = 'LOAD_ROOT_FOLDER';
export const CHANGE_FOLDER_SELECTION = 'CHANGE_FOLDER_SELECTION';
export const LOAD_FILES_IN_FOLDER = 'LOAD_FILES_IN_FOLDER';
export const STORE_SCROLL_POSITION = 'STORE_SCROLL_POSITION';

export function loadRootFolder() {
  return async (dispatch, getState) => { 
    dispatch({
      type: LOAD_ROOT_FOLDER,
      payload: {},
    });

    // Had to add this wait here otherwise the loading screen would not show
    const wait = ms => new Promise((resolve) => setTimeout(resolve, ms));
    await wait(10); // eslint-disable-line

    const currentPath = getState().fileLoader.selectedFolderFullPath;
    const files = await loadFilesInFolder(currentPath);

    dispatch({
      type: LOAD_FILES_IN_FOLDER,
      payload: {
        files: files,
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
    const wait = ms => new Promise((resolve) => setTimeout(resolve, ms));
    await wait(10); // eslint-disable-line

    const currentPath = getState().fileLoader.selectedFolderFullPath;
    const files = await loadFilesInFolder(currentPath);

    dispatch({
      type: LOAD_FILES_IN_FOLDER,
      payload: {
        files: files,
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
  // console.log(`Loading files in ${folderPath}...`);

  let files = [];
  try {
    files = fs.readdirSync(folderPath) || [];
  } catch (err) {
    // do nothing
    console.log(err);
  }

  // Filter for all .slp files
  files = files.filter(file => (
    path.extname(file) === ".slp"
  ));

  // const start = new Date();

  // Compute header information for display
  const fileProcessors = files.map(async (file) => {
    const fullPath = path.join(folderPath, file);
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
      fileName: file,
      game: game,
      hasError: hasError,
    };
  });

  files = await Promise.all(fileProcessors);
  
  // console.log(`Time: ${new Date() - start}ms`);

  return files;
}
