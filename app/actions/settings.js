import fs from 'fs-extra';
import _ from 'lodash';
import crypto from 'crypto';
import ini from 'ini';
import path from 'path';
import log from 'electron-log';
import electronSettings from 'electron-settings';

import { displayError } from './error';

const { dialog, app } = require('electron').remote;

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
      const fileDir = path.dirname(filePath);
      const platform = process.platform;
      const isDev = process.env.NODE_ENV === "development";
      const storedDolphinPath = electronSettings.get('settings.playbackDolphinPath');
      let dolphinPath = storedDolphinPath || path.join(app.getPath("appData"), "Slippi Desktop App", "dolphin");
      // Handle the dolphin INI file being in different paths per platform
      switch (platform) {
      case "darwin": // osx
        dolphinPath = isDev ? "./app/dolphin-dev/osx/Dolphin.app/Contents/Resources" : path.join(dolphinPath, "Dolphin.app/Contents/Resources");
        break;
      case "win32": // windows
        dolphinPath = isDev ? "./app/dolphin-dev/windows" : dolphinPath;
        break;
      case "linux":
        break;
      default:
        throw new Error("The current platform is not supported");
      }
      try {
        const iniPath = path.join(dolphinPath, "User", "Config", "Dolphin.ini");
        const dolphinINI = ini.parse(fs.readFileSync(iniPath, 'utf-8'));
        dolphinINI.General.ISOPath0 = fileDir;
        const numPaths = dolphinINI.General.ISOPaths;
        dolphinINI.General.ISOPaths = numPaths !== "0" ? numPaths : "1";
        const newINI = ini.encode(dolphinINI);
        fs.writeFileSync(iniPath, newINI);
      } catch (err) {
        log.warn(`Failed to update the dolphin paths\n${err}`)
      }
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
      "d4e70c064cc714ba8400a849cf299dbd1aa326fc": "success", // NTSC 1.02
      "e63d50e63a0cdd357f867342d542e7cec0c3a7c7": "success", // 1.02 Scrubbed #1
      "55109bc139b947c8b96b5fc913fbd91245104db8": "success", // 1.02 Scrubbed #2
      "2f0bed5e1d92ebb187840c6e1a2f368ce35f6816": "fail", // 20XX 3.02
      "7f6926f2f35940f5f697eb449c9f3fbd3639dd45": "fail", // 20XX 4.07++
      "49fd53b0a5eb0da9215846cd653ccc4c3548ec69": "fail", // 20XX 4.07++ UCF
      "c89cb9b694f0f26ee07a6ee0a3633ba579e5fa12": "fail", // NTSC 1.00 (scrubbed?)
      "5ecab83cd72c0ff515d750280f92713f19fa46f1": "fail", // NTSC 1.01
      "d0a925866379c546ceb739eeb780d011383cb07c": "fail", // PAL
      "fe23c91b63b0731ef727c13253b6a8c6757432ac": "fail", // JP 1.00
      "f7ff7664b231042f2c0802041736fb9396a94b83": "fail", // JP 1.01
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
