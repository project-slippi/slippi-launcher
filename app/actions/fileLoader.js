import { displayError } from './error';

export const LOAD_ROOT_FOLDER = 'LOAD_ROOT_FOLDER';
export const CHANGE_FOLDER_SELECTION = 'CHANGE_FOLDER_SELECTION';
export const LOAD_FILES_IN_FOLDER = 'LOAD_FILES_IN_FOLDER';
export const STORE_SCROLL_POSITION = 'STORE_SCROLL_POSITION';

export function loadRootFolder() {
  return async (dispatch) => { 
    dispatch({
      type: LOAD_ROOT_FOLDER,
      payload: {},
    });

    // Had to add this wait here otherwise the loading screen would not show
    const wait = ms => new Promise((resolve) => setTimeout(resolve, ms));
    await wait(1); // eslint-disable-line

    dispatch({
      type: LOAD_FILES_IN_FOLDER,
      payload: {},
    });
  };
}

export function changeFolderSelection(folder) {
  return async (dispatch) => {
    dispatch({
      type: CHANGE_FOLDER_SELECTION,
      payload: {
        folderPath: folder,
      },
    });

    // Had to add this wait here otherwise the loading screen would not show
    const wait = ms => new Promise((resolve) => setTimeout(resolve, ms));
    await wait(1); // eslint-disable-line

    dispatch({
      type: LOAD_FILES_IN_FOLDER,
      payload: {},
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
