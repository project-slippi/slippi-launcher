import {
  LOAD_ROOT_FOLDER, CHANGE_FOLDER_SELECTION, LOAD_FILES_IN_FOLDER, STORE_SCROLL_POSITION, SET_STATS_GAME_PAGE, SET_PLAYER_PROFILE_PAGE, STORE_FILE_LOAD_STATE, SET_FILTER_REPLAYS, DELETE_FILE,
} from '../actions/fileLoader';
import DolphinManager from '../domain/DolphinManager';

const path = require('path');

// Default state for this reducer
const defaultState = {
  dolphinManager: new DolphinManager('vod'),
  rootFolderName: "",
  rootFolderPath: "",
  selectedFolderFullPath: "",
  isLoading: false,
  folders: {},
  files: [],
  folderFound: false,
  playingFile: null,
  numFilteredFiles: 0,
  statsGameIndex: 0,
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
  case STORE_FILE_LOAD_STATE:
    return storeFileLoadState(state, action);
  case SET_STATS_GAME_PAGE:
    return setStatsGamePage(state, action);
  case SET_PLAYER_PROFILE_PAGE:
    return setPlayerProfilePage(state, action);
  case SET_FILTER_REPLAYS:
    return setFilterReplays(state, action);
  case DELETE_FILE:
    return deleteFile(state, action);
  default:
    return state;
  }
}

function loadRootFolder(state, action) {
  if (!action.payload.folderFound) {
    return state;
  }

  const rootFolderName = action.payload.rootFolderName;
  const rootFolderPath = action.payload.rootFolderPath;
  const folders = {};
  folders[rootFolderName] = {
    fullPath: rootFolderPath,
    folderName: rootFolderName,
    pathArr: [rootFolderName],
    expanded: false,
    subDirectories: [],
  };

  // Combine the state we got from selecting a folder
  return {
    ...state,
    rootFolderPath: rootFolderPath,
    rootFolderName: rootFolderName,
    folderFound: true,
    folders: folders,
  };
}

function changeFolderSelection(state, action) {
  const folderPath = action.payload.folderPath;

  return {
    ...state,
    selectedFolderFullPath: folderPath,
    isLoading: true,
    fileLoadState: {},
  };
}

function loadFilesInFolder(state, action) {
  const rootFolderPath = state.rootFolderPath;
  if (!state.selectedFolderFullPath.startsWith(rootFolderPath)) {
    return state;
  }

  const rootFolderName = state.rootFolderName;
  const pathArr = [rootFolderName];
  const folders = {...state.folders};
  let currentFolder = folders[rootFolderName];
  let remainingPath = path.relative(rootFolderPath, state.selectedFolderFullPath);
  while(remainingPath.length > 0) {
    const paths = remainingPath.split(path.sep);
    const nextPath = paths[0];
    const nextFolder = currentFolder.subDirectories.find(subDirectory => (
      subDirectory.folderName === nextPath
    ));
    if (!nextFolder) {
      return state;
    }
    pathArr.push(nextPath);
    currentFolder = nextFolder;
    remainingPath = paths.slice(1).join(path.sep);
  }

  currentFolder.subDirectories = action.payload.folders.map(folder => ({
    ...folder,
    pathArr: Array.from(pathArr),
  }));
  return {
    ...state,
    isLoading: false,
    files: action.payload.files,
    allFiles: action.payload.allFiles,
    folders: folders,
    numErroredFiles: action.payload.numErroredFiles,
    numDurationFilteredFiles: action.payload.numDurationFilteredFiles,
    numFilteredFiles: action.payload.numFilteredFiles,
    fileLoadState: {},
  };
}

function storeScrollPosition(state, action) {
  return {
    ...state,
    scrollPosition: action.payload.position,
  };
}

function storeFileLoadState(state, action) {
  return {
    ...state,
    fileLoadState: action.payload.fileLoadState,
  };
}

function setStatsGamePage(state, action) {
  return {
    ...state,
    statsGameIndex: action.payload.statsGameIndex,
  };
}

function setPlayerProfilePage(state, action) {
  return {
    ...state,
    playerSelection: action.payload.player,
  };
}


function setFilterReplays(state, action) {
  return {
    ...state,
    filterReplays: action.payload.filterReplays,
  }
}

function deleteFile(state, action) {
  return {
    ...state,
    allFiles: action.payload.allFiles,
    files: action.payload.files,
    fileLoadState: action.payload.fileLoadState,
  }
}
