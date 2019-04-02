import _ from 'lodash';
import SlippiGame from 'slp-parser-js';
import {
  LOAD_ROOT_FOLDER, CHANGE_FOLDER_SELECTION, LOAD_FILES_IN_FOLDER, STORE_SCROLL_POSITION,
} from '../actions/fileLoader';
import DolphinManager from '../domain/DolphinManager';

const fs = require('fs');
const path = require('path');
const electronSettings = require('electron-settings');

// Default state for this reducer
const defaultState = {
  dolphinManager: new DolphinManager('vod'),
  rootFolderName: "",
  selectedFolderFullPath: "",
  isLoading: false,
  folders: {},
  files: [],
  folderFound: false,
  playingFile: null,
  scrollPosition: {
    x: 0,
    y: 0,
  },
};

export default function fileLoader(state = defaultState, action) {
  switch (action.type) {
  case LOAD_ROOT_FOLDER:
    return loadRootFolder(state, action);
  case CHANGE_FOLDER_SELECTION:
    return changeFolderSelection(state, action);
  case LOAD_FILES_IN_FOLDER:
    return loadFilesInFolder(state, action);
  case STORE_SCROLL_POSITION:
    return storeScrollPosition(state, action);
  default:
    return state;
  }
}

function loadRootFolder(state) {
  const rootFolder = electronSettings.get('settings.rootSlpPath');
  if (!rootFolder) {
    return state;
  }

  let folderFound = true;
  let files = [];
  try {
    files = fs.readdirSync(rootFolder) || [];
  } catch (err) {
    folderFound = false;
  }

  const rootFolderBasename = path.basename(rootFolder);

  // Filter for folders in the root folder
  const subDirectories = files.map((file) => {
    const fullPath = path.join(rootFolder, file);
    return {
      fullPath: fullPath,
      folderName: file,
      pathArr: [rootFolderBasename, file],
      expanded: true,
      subDirectories: {},
    };
  }).filter(folderDetails => (
    fs.lstatSync(folderDetails.fullPath).isDirectory()
  ));

  const folders = {};
  folders[rootFolderBasename] = {
    fullPath: rootFolder,
    folderName: rootFolderBasename,
    pathArr: [rootFolderBasename],
    expanded: false,
    subDirectories: subDirectories,
  };

  // Maintain selection if there is one and it is for a loaded sub-directory
  const subDirectoriesByFullPath = _.keyBy(subDirectories, 'fullPath') || {};
  let previouslySelectedFolderFullPath = null;
  if (subDirectoriesByFullPath[state.selectedFolderFullPath]) {
    previouslySelectedFolderFullPath = state.selectedFolderFullPath;
  }

  const folderSelection = previouslySelectedFolderFullPath || rootFolder;

  // Select the root folder
  const newState = changeFolderSelection(state, {
    payload: {
      folderPath: folderSelection,
    },
  });

  // Combine the state we got from selecting a folder
  return {
    ...newState,
    rootFolderName: rootFolderBasename,
    folderFound: folderFound,
    folders: folders,
  };
}

function changeFolderSelection(state, action) {
  const folderPath = action.payload.folderPath;

  return {
    ...state,
    selectedFolderFullPath: folderPath,
    isLoading: true,
  };
}

function loadFilesInFolder(state) {
  const folderPath = state.selectedFolderFullPath;

  let files = [];
  try {
    files = fs.readdirSync(folderPath) || [];
  } catch (err) {
    // do nothing
  }

  // Filter for all .slp files
  files = files.filter(file => (
    path.extname(file) === ".slp"
  ));

  // Compute header information for display
  files = files.map((file) => {
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
  
  return {
    ...state,
    isLoading: false,
    files: files,
  };
}

function storeScrollPosition(state, action) {
  return {
    ...state,
    scrollPosition: action.payload.position,
  };
}
