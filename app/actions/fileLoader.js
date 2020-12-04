import _ from 'lodash';
import fs from 'fs';
import * as fsExtra from 'fs-extra'
import path from 'path';
import { SlippiGame, Frames } from '@slippi/slippi-js';
import { shell, remote } from 'electron';

import * as timeUtils from '../utils/time';
import { displayError } from './error';
import { gameProfileLoad } from './game';
import { playerGamesLoad } from './player';
import { getRootSlpPath } from '../utils/settings';

export const LOAD_ROOT_FOLDER = 'LOAD_ROOT_FOLDER';
export const CHANGE_FOLDER_SELECTION = 'CHANGE_FOLDER_SELECTION';
export const LOAD_FILES_IN_FOLDER = 'LOAD_FILES_IN_FOLDER';
export const SET_STATS_GAME_PAGE = 'SET_STATS_GAME_PAGE';
export const SET_PLAYER_PROFILE_PAGE = 'SET_PLAYER_PROFILE_PAGE';
export const STORE_SCROLL_POSITION = 'STORE_SCROLL_POSITION';
export const STORE_FILE_LOAD_STATE = 'STORE_FILE_LOAD_STATE';
export const SET_FILTER_REPLAYS = 'SET_FILTER_REPLAYS';
export const DELETE_FILE = 'DELETE_FILE';

export const MIN_GAME_LENGTH_SECONDS = 30;
const MIN_GAME_LENGTH_FRAMES = MIN_GAME_LENGTH_SECONDS * 60;

/*
 * WARNING: Increasing this value will trigger the app
 * to flush the stats data cache. This is to be able to 
 * recreate the cache when a new slp feature is added.
 */
const STATS_VERSION = 1;

export function loadRootFolder() {
  return async (dispatch, getState) => {
    const rootFolderPath = getRootSlpPath();
    if (!rootFolderPath) {
      dispatch({
        type: LOAD_ROOT_FOLDER,
        payload: {
          folderFound: false,
        },
      });
    }

    if (rootFolderPath === getState().fileLoader.rootFolderPath) {
      // Reload the currently selected folder even if the root hasn't changed, the loadRootFolder
      // function only gets called when entering the fileLoader component from the main menu and
      // we want to support returning to the fileLoader from the main menu to update the files
      // in the list
      await changeFolderSelection(getState().fileLoader.selectedFolderFullPath)(dispatch, getState);
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
    const [unfilteredFiles, allFiles] = processFiles(filesAndFolders[0]);

    dispatch({
      type: LOAD_FILES_IN_FOLDER,
      payload: {
        files: unfilteredFiles,
        allFiles: allFiles,
        folders: filesAndFolders[1],
        numErroredFiles: filesAndFolders[0].length - allFiles.length,
        numDurationFilteredFiles: allFiles.length - unfilteredFiles.length,
        numFilteredFiles: filesAndFolders[0].length - unfilteredFiles.length,
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
    const [unfilteredFiles, allFiles] = processFiles(filesAndFolders[0]);

    dispatch({
      type: LOAD_FILES_IN_FOLDER,
      payload: {
        files: unfilteredFiles,
        allFiles: allFiles,
        folders: filesAndFolders[1],
        numErroredFiles: filesAndFolders[0].length - allFiles.length,
        numDurationFilteredFiles: allFiles.length - unfilteredFiles.length,
        numFilteredFiles: filesAndFolders[0].length - unfilteredFiles.length,
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

export function storeFileLoadState(fileLoadState) {
  return {
    type: STORE_FILE_LOAD_STATE,
    payload: {
      fileLoadState: fileLoadState,
    },
  };
}

export function playFile(file, startFrame=Frames.FIRST) {
  return async (dispatch, getState) => {
    const filePath = file.fullPath;
    if (!filePath) {
      // TODO: Maybe show error message
      return;
    }

    const dolphinManager = getState().fileLoader.dolphinManager;
    dolphinManager.playFile(filePath, true, startFrame).catch((err) => {
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

export function setStatsGamePage(index) {
  return (dispatch, getState) => {
    const state = getState().fileLoader;
    const files = (state.filterReplays ? state.files : state.allFiles) || [];
    let statsGameIndex = index;
    if (statsGameIndex >= files.length) {
      statsGameIndex = 0;
    }

    if (statsGameIndex < 0) {
      statsGameIndex = files.length - 1;
    }

    dispatch({
      type: SET_STATS_GAME_PAGE,
      payload: { statsGameIndex: statsGameIndex },
    });
    gameProfileLoad(files[statsGameIndex].game)(dispatch);
  };
}

export function setPlayerProfilePage(player) { 
  return (dispatch, getState) => { // eslint-disable-line no-unused-vars
    const state = getState().fileLoader;
    const files = (state.filterReplays ? state.files : state.allFiles) || [];
    dispatch({
      type: SET_PLAYER_PROFILE_PAGE,
      payload: { player: player },
    });
    playerGamesLoad(files.map(f=>f.game), player)(dispatch)
  };
}


export function deleteSelections(selections) {
  return (dispatch, getState) => {
    const tempStore = getState().fileLoader;
    const filesToRender = _.without(tempStore.fileLoadState.filesToRender, ...selections);
    const files = _.without(tempStore.files, ...selections);
    const allFiles = _.without(tempStore.allFiles, ...selections);
    _.each(selections, (selection) => {
      shell.moveItemToTrash(selection.fullPath);
    });
    tempStore.filesToRender = filesToRender;
    tempStore.filesOffset = filesToRender.length;
    dispatch({
      type: DELETE_FILE,
      payload: {
        fileLoadState: tempStore,
        files: files,
        allFiles: allFiles,
      },
    });
  };
}

export function setFilterReplays(val) {
  return {
    type: SET_FILTER_REPLAYS,
    payload: {
      filterReplays: val,
    },
  }
}


function parseStats(fullPath, dir, name) {
  const extension = path.extname(name);
  const statsName = `${path.basename(name,extension)}_stats.json`;
  const statsFile = path.join(dir, statsName);
  let parsedGame;
  if (fs.existsSync(statsFile)){
    parsedGame =  JSON.parse(fs.readFileSync(statsFile));
  } else {
    const game = new SlippiGame(fullPath);
    parsedGame = {
      metadata: game.getMetadata(),
      settings: game.getSettings(),
      stats: game.getStats(),
    }
    fs.writeFileSync(statsFile, JSON.stringify(parsedGame))
  }
  parsedGame.getMetadata = () => parsedGame.metadata
  parsedGame.getSettings = () => parsedGame.settings
  parsedGame.getStats    = () => parsedGame.stats
  parsedGame.getFilePath = () => fullPath
  return parsedGame
}

async function loadFilesInFolder(folderPath) {
  const readdirPromise = new Promise((resolve, reject) => {
    fs.readdir(folderPath, { withFileTypes: true }, (err, dirents) => {
      if (err) {
        reject(err);
      }
      resolve(dirents);
    });
  });

  const statsDir = path.join(remote.app.getPath('appData'), 'Slippi Desktop App', 'stats')
  if (!fs.existsSync(statsDir)){
    fs.mkdirSync(statsDir);
  }

  const metadataPath = path.join(statsDir, '.metadata')

  let meta = { version: -1 }
  if (fs.existsSync(metadataPath)) meta = JSON.parse(fs.readFileSync(metadataPath))
  console.log(meta)
  if (meta.version < STATS_VERSION) {
    fsExtra.emptyDirSync(statsDir)
    meta.version =  STATS_VERSION
    fs.writeFileSync(metadataPath, JSON.stringify(meta)) 
  }

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
      let lastFrame = null;

      // Pre-load settings here
      try {
        game = parseStats(fullPath, statsDir, fileName)

        // Preload settings
        const settings = game.getSettings();
        if (_.isEmpty(settings.players)) {
          throw new Error("Game settings could not be properly loaded.");
        }

        // Preload metadata
        const metadata = game.getMetadata();
        if (metadata && metadata.lastFrame !== undefined) {
          lastFrame = metadata.lastFrame;
        }
      } catch (err) {
        console.log(`Failed to parse file: ${fullPath}`);
        console.log(err);
        hasError = true;
      }

      const startTime = timeUtils.fileToDateAndTime(game, fileName, fullPath);

      return {
        fullPath: fullPath,
        fileName: fileName,
        startTime: startTime,
        game: game,
        hasError: hasError,
        lastFrame: lastFrame,
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

function processFiles(files) {
  let goodFiles = files;

  goodFiles = goodFiles.filter(file => {
    if (file.hasError) {
      // This will occur if an error was encountered while parsing
      return false;
    }

    const settings = file.game.getSettings() || {};
    if (!settings.stageId) {
      // I know that right now if you play games from debug mode it make some
      // weird replay files... this should filter those out
      return false;
    }

    return true;
  });

  let filteredFiles = goodFiles.filter(file => {
    const metadata = file.game.getMetadata() || {};
    const totalFrames = metadata.lastFrame || MIN_GAME_LENGTH_FRAMES + 1;
    return totalFrames > MIN_GAME_LENGTH_FRAMES;
  })

  goodFiles = _.orderBy(
    goodFiles,
    ['startTime', 'fileName'],
    ['desc', 'desc']
  );

  filteredFiles = _.orderBy(
    filteredFiles,
    ['startTime', 'fileName'],
    ['desc', 'desc']
  );

  // Filter out files that were shorter than 30 seconds
  return [filteredFiles, goodFiles];
}
