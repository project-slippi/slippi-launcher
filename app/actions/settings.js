import fs from 'fs-extra';
import _ from 'lodash';
import crypto from 'crypto';
import electronSettings from 'electron-settings';
import log from 'electron-log';

import { displayError } from './error';

const { dialog } = require('electron').remote;

export const SELECT_FOLDER = 'SELECT_FOLDER';
export const SELECT_FILE = 'SELECT_FILE';
export const ISO_VALIDATION_START = 'ISO_VALIDATION_START';
export const ISO_VALIDATION_COMPLETE = 'ISO_VALIDATION_COMPLETE';
export const SET_RESET_CONFIRM = 'SET_RESET_CONFIRM';
export const RESETTING_DOLPHIN = 'RESETTING_DOLPHIN';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
      getState().dolphinManager.setGamePath(filePath);
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

const isoStateLocalCache = {};
export function validateISO() {
  return async (dispatch, getState) => {
    const isoPath = getState().settings.settings.isoPath;
    if (!isoPath) {
      return;
    }

    // Indicate validation start
    dispatch({
      type: ISO_VALIDATION_START,
      payload: {},
    });

    let fileStats = null;
    try {
      fileStats = fs.statSync(isoPath);
    } catch (err) {
      // Do nothing
    }

    if (!fileStats) {
      dispatch({
        type: ISO_VALIDATION_COMPLETE,
        payload: { isValid: false },
      });
      return;
    }

    const cacheKey = `${isoPath}-${fileStats.ctimeMs}`;
    const cachedState = _.get(isoStateLocalCache, cacheKey);
    if (cachedState !== undefined) {
      dispatch({
        type: ISO_VALIDATION_COMPLETE,
        payload: { isValid: cachedState },
      });
      return;
    }

    const hash = crypto.createHash('sha1');
    const input = fs.createReadStream(isoPath);

    // Below are the sha1 hashes for the ISOs we know about
    const ISOHashes = {
      "d4e70c064cc714ba8400a849cf299dbd1aa326fc": "success", // NTSC-U 1.02
      "6e83240872d47cd080a28dea7b8907140c44bef5": "success", // NTSC-U 1.02 NKIT
      "e63d50e63a0cdd357f867342d542e7cec0c3a7c7": "success", // NTSC-U 1.02 Scrubbed #1
      "55109bc139b947c8b96b5fc913fbd91245104db8": "success", // NTSC-U 1.02 Scrubbed #2
      "2ce0ccfc8c31eafe2ff354fe03ac2dd94c20b937": "success", // NTSC-U 1.02 Scrubbed #3
      "49a04772e0a5d1974a4b1c8a7c0d1d71184f3978": "success", // NTSC-U 1.02 Scrubbed #4
      "71255a30a47b4c6aabb90308d7a514d09d93a7b5": "success", // NTSC-J 1.02
      "2f0bed5e1d92ebb187840c6e1a2f368ce35f6816": "fail", // 20XX 3.02
      "7f6926f2f35940f5f697eb449c9f3fbd3639dd45": "fail", // 20XX 4.07++
      "49fd53b0a5eb0da9215846cd653ccc4c3548ec69": "fail", // 20XX 4.07++ UCF
      "4521c1753b0c9d5c747264fce63e84b832bd80a1": "fail", // Training Mode v1.1
      "c89cb9b694f0f26ee07a6ee0a3633ba579e5fa12": "fail", // NTSC-U 1.00 Scrubbed # 1
      "5ab1553a941307bb949020fd582b68aabebecb30": "fail", // NTSC-U 1.00
      "5ecab83cd72c0ff515d750280f92713f19fa46f1": "fail", // NTSC-U 1.01
      "d0a925866379c546ceb739eeb780d011383cb07c": "fail", // PAL
      "fe23c91b63b0731ef727c13253b6a8c6757432ac": "fail", // NTSC-J 1.00
      "f7ff7664b231042f2c0802041736fb9396a94b83": "fail", // NTSC-J 1.01
      "c7c0866fbe6d7ebf3b9c4236f4f32f4c8f65b578": "fail", // Taikenban (demo)
    };

    input.on('readable', () => {
      const data = input.read();
      if (data) {
        hash.update(data);
        return;
      }

      // Reading complete, check hash
      const resultHash = hash.digest('hex');
      const isValidISO = _.get(ISOHashes, resultHash) || "unknown";

      isoStateLocalCache[cacheKey] = isValidISO;

      dispatch({
        type: ISO_VALIDATION_COMPLETE,
        payload: { isValid: isValidISO },
      });
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

export function resetDolphin() {
  return async (dispatch, getState) => {
    dispatch({
      type: RESETTING_DOLPHIN,
      payload: { isResetting: true },
    });
    await wait(10);
    try {
      const dolphinManager = getState().settings.dolphinManager;
      await dolphinManager.resetDolphin();
      const meleeFile = electronSettings.get('settings.isoPath');
      dolphinManager.setGamePath(meleeFile);
      log.info("Dolphin was reset");
    } catch (err) {
      log.info("Dolphin could not be reset");
      log.warn(err.message);
      const errorAction = displayError(
        'settings-global',
        `Dolphin could not be reset. ${err.message}`,
      );

      dispatch(errorAction);
    }
    dispatch({
      type: RESETTING_DOLPHIN,
      payload: { isResetting: false },
    });
  };
}

export function setResetConfirm(value) {
  return {
    type: SET_RESET_CONFIRM,
    payload: { show: value },
  };
}
