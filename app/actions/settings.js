import { displayError } from './error';

const crypto = require('crypto');
const fs = require('fs');
const { dialog } = require('electron').remote;

export const SELECT_FOLDER = 'SELECT_FOLDER';
export const SELECT_FILE = 'SELECT_FILE';
export const ISO_VALIDATION_START = 'ISO_VALIDATION_START';
export const ISO_VALIDATION_COMPLETE = 'ISO_VALIDATION_COMPLETE';

export function browseFolder(field) {
  return (dispatch) => {
    const paths = dialog.showOpenDialog({
      properties: [
        'openDirectory',
        'treatPackageAsDirectory',
        'createDirectory',
      ],
    }) || [];

    const folderPath = paths[0];
    if (!folderPath) {
      return;
    }

    dispatch(selectFolder(field, folderPath));
  };
}

export function selectFolder(field, selectedPath) {
  return {
    type: SELECT_FOLDER,
    payload: {
      field: field,
      path: selectedPath,
    },
  };
}

export function browseFile(field) {
  return (dispatch, getState) => {
    const files = dialog.showOpenDialog({
      properties: [
        'openFile',
        'createDirectory',
      ],
    }) || [];

    const filePath = files[0];
    if (!filePath) {
      return;
    }

    dispatch(selectFile(field, filePath));

    // Maybe this should be done as some kind of callback or something... but this works
    if (field === "isoPath") {
      validateISO()(dispatch, getState);
    }
  };
}

export function selectFile(field, selectedPath) {
  return {
    type: SELECT_FILE,
    payload: {
      field: field,
      path: selectedPath,
    },
  };
}

export function validateISO() {
  return async (dispatch, getState) => {
    // Indicate validation start
    dispatch({
      type: ISO_VALIDATION_START,
      payload: {},
    });

    const isoPath = getState().settings.settings.isoPath;
   
    const hash = crypto.createHash('sha1');
    const input = fs.createReadStream(isoPath);

    // Below is the sha1 hash for NTSC Melee 1.02
    const correctISOHash = "d4e70c064cc714ba8400a849cf299dbd1aa326fc";

    input.on('readable', () => {
      const data = input.read();
      if (data) {
        hash.update(data);
        return;
      } 

      // Reading complete, check hash
      const resultHash = hash.digest('hex');
      const isValidISO = resultHash === correctISOHash;
      
      dispatch({
        type: ISO_VALIDATION_COMPLETE,
        payload: { isValid: isValidISO },
      })
    });
  };
}

export function openDolphin() {
  return (dispatch, getState) => {
    const dolphinManager = getState().settings.dolphinManager;
    dolphinManager.configureDolphin().catch((err) => {
      const errorAction = displayError(
        'settings-global',
        err.message,
      );

      dispatch(errorAction);
    });
  };
}
