/** @jsx jsx */
import { GeckoCode, loadGeckoCodes, saveCodes } from "@dolphin/geckoCode";
import { IniFile } from "@dolphin/iniFile";
import {
  ipc_clearDolphinCache,
  ipc_configureDolphin,
  ipc_importDolphinSettings,
  ipc_reinstallDolphin,
} from "@dolphin/ipc";
import { DolphinLaunchType } from "@dolphin/types";
import { css, jsx } from "@emotion/react";
import { Box, Tab, Tabs } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import CircularProgress from "@material-ui/core/CircularProgress";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import { isLinux, isMac } from "common/constants";
import { app, remote, shell } from "electron";
import log from "electron-log";
import fs from "fs";
import capitalize from "lodash/capitalize";
import os from "os";
import path from "path";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { ConfirmationModal } from "@/components/ConfirmationModal";
import { DevGuard } from "@/components/DevGuard";
import { PathInput } from "@/components/PathInput";
import { useDolphinPath } from "@/lib/hooks/useSettings";

import { SettingItem } from "./SettingItem";

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return <div {...other}>{value === index && <Box p={3}>{children}</Box>}</div>;
}

/**
 * reads all the files in a directory and returns a string[] of filenames
 * @param directoryName - the name of the directory to be searched
 * @returns the filenames of all the files in the firectory as a string[]
 */
export function getFilesInDir(directoryName: string): string[] {
  const fileNames: string[] = [];

  fs.readdir(directoryName, (error: any, files: string[]) => {
    if (error) {
      return console.log("Unable to scan directory: " + error);
    }
    files.forEach((file: string) => {
      fileNames.push(file);
    });
  });
  return fileNames;
}

export const DolphinSettings: React.FC<{ dolphinType: DolphinLaunchType }> = ({ dolphinType }) => {
  const [dolphinPath, setDolphinPath] = useDolphinPath(dolphinType);

  const [tabValue, setTabValue] = React.useState(0);
  const [resetModalOpen, setResetModalOpen] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const { addToast } = useToasts();

  const [geckoFormOpen, setGeckoFormOpen] = React.useState(false);
  const [geckoCode, setGeckoCode] = React.useState("");
  const [geckoCodes, setGeckoCodes] = React.useState([]);
  const [iniFiles, setIniFiles] = React.useState([]);
  const [userIniPath, setUserIniPath] = React.useState("");
  const [userIniFolder, setUserIniFolder] = React.useState("");
  const [globalIniPath, setGlobalIniPath] = React.useState("");
  const [globalIniFolder, setGlobalIniFolder] = React.useState("");

  React.useEffect(() => {
    switch (process.platform) {
      case "win32": {
        setUserIniFolder(path.join(dolphinPath, "User", "GameSettings"));
        setGlobalIniFolder(path.join(dolphinPath, "Sys", "GameSettings"));
        break;
      }
      case "darwin": {
        setUserIniFolder(path.join(dolphinPath, "Slippi Dolphin.app", "Contents", "Resources", "User", "GameSettings"));
        setGlobalIniFolder(
          path.join(dolphinPath, "Slippi Dolphin.app", "Contents", "Resources", "Sys", "GameSettings"),
        );
        break;
      }
      case "linux": {
        const configPath = path.join(os.homedir(), ".config");
        const userFolderName = dolphinType === DolphinLaunchType.NETPLAY ? "SlippiOnline" : "SlippiPlayback";
        setUserIniFolder(path.join(configPath, userFolderName));
        setGlobalIniFolder(path.join(app.getPath("userData"), dolphinType, "Sys"));
        break;
      }
      default:
        break;
    }
  }, [dolphinPath, dolphinType]);

  // React.useEffect(() => {
  //   const setIniPaths = async () => {
  //     const userFolder = await findUserFolder(dolphinType);
  //     console.log(userFolder);
  //     const sysFolder = await findSysFolder(dolphinType);
  //   };

  //   setIniPaths();
  // }, [dolphinPath, dolphinType]);

  React.useEffect(() => {
    if (globalIniFolder !== "") {
      //testfunc();
      console.log(globalIniFolder);
      const filesArray = getFilesInDir(globalIniFolder);
      console.log(filesArray);
      setIniFiles(filesArray);
      setGlobalIniPath(`${globalIniFolder}/GALE01r2.ini`);
    }
    if (userIniFolder !== "") {
      setUserIniPath(`${userIniFolder}/GALE01r2.ini`);
    }
  }, [globalIniFolder, userIniFolder]);

  React.useEffect(async () => {
    if (globalIniPath !== "") {
      const sysIni = new IniFile();
      await sysIni.load(globalIniPath, false);
      const userIni = new IniFile();
      await userIni.load(userIniPath, false);

      const gcodes = loadGeckoCodes(sysIni, userIni);
      console.log(gcodes);
      setGeckoCodes(gcodes);
    }
  }, [globalIniPath, userIniPath]);

  const openDolphinDirectoryHandler = async () => {
    shell.openItem(dolphinPath);
  };

  const configureDolphinHandler = async () => {
    if (process.platform === "darwin") {
      addToast("Dolphin may open in the background, please check the app bar", {
        appearance: "info",
        autoDismiss: true,
      });
    }
    await ipc_configureDolphin.renderer!.trigger({ dolphinType });
  };

  const reinstallDolphinHandler = async () => {
    setIsResetting(true);
    await ipc_reinstallDolphin.renderer!.trigger({ dolphinType });
    setIsResetting(false);
  };

  const clearDolphinCacheHandler = async () => {
    await ipc_clearDolphinCache.renderer!.trigger({ dolphinType });
  };

  const writeGeckoCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("writing to gecko ini");
    const rawGecko = geckoCode.split("\n");

    let gCode: GeckoCode = {
      name: "",
      creator: "",
      enabled: true,
      defaultEnabled: false,
      userDefined: true,
      notes: [],
      codeLines: [],
    };

    rawGecko.forEach((line) => {
      switch (line[0]) {
        // code name
        case "$": {
          if (gCode.name.length > 0) {
            geckoCodes.push(gCode);
          }
          line = line.slice(1); // cut out the $

          const creatorMatch = line.match(/\[(.*?)\]/); // searches for brackets, catches anything inside them
          const creator = creatorMatch !== null ? creatorMatch[1] : creatorMatch;
          const name = creator ? line.split("[")[0] : line;

          gCode = {
            ...gCode,
            name: name,
            creator: creator,
            notes: [],
            codeLines: [],
          };
          break;
        }
        // comments
        case "*": {
          gCode.notes.push(line.slice(1));
          break;
        }
        default: {
          gCode.codeLines.push(line);
        }
      }
    });
    if (gCode.name.length > 0) {
      geckoCodes.push(gCode);
    }
    saveGeckos();
    document.getElementById("geckoForm").reset();
  };

  const saveGeckos = async () => {
    const userIni = new IniFile();
    saveCodes(userIni, geckoCodes);
    userIni.save(userIniPath);
  };

  const handleTabChange = (e: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  const handleIniChange = ({ target: { value } }) => {
    setUserIniPath(`${userIniFolder}/${value}`);
  };

  const dolphinTypeName = capitalize(dolphinType);
  return (
    <div>
      <Typography variant="h5">{dolphinTypeName} Dolphin Settings</Typography>
      <SettingItem name={`Configure ${dolphinType} Dolphin`}>
        <div
          css={css`
            display: flex;
            & > button {
              margin-right: 10px;
            }
          `}
        >
          <Button variant="contained" color="primary" onClick={configureDolphinHandler} disabled={isResetting}>
            Configure Dolphin
          </Button>
          <Button variant="outlined" color="primary" onClick={openDolphinDirectoryHandler} disabled={isResetting}>
            Open containing folder
          </Button>
        </div>
      </SettingItem>
      <DevGuard show={isLinux}>
        <SettingItem
          name={`${dolphinType} Dolphin Directory`}
          description={`The path containing the ${dolphinTypeName} Dolphin executable.`}
        >
          <PathInput
            value={dolphinPath ?? ""}
            onSelect={setDolphinPath}
            placeholder="No folder set"
            options={{ properties: ["openDirectory"] }}
          />
        </SettingItem>
      </DevGuard>
      {!isLinux && <ImportDolphinConfigForm dolphinType={dolphinType} />}
      <SettingItem name={`Reset ${dolphinType} Dolphin`}>
        <ConfirmationModal
          open={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          onSubmit={reinstallDolphinHandler}
          title="Are you sure?"
        >
          This will remove all your {dolphinType} dolphin settings.
        </ConfirmationModal>
        <div
          css={css`
            display: flex;
            & > button {
              margin-right: 10px;
            }
          `}
        >
          <Button variant="contained" color="secondary" onClick={clearDolphinCacheHandler} disabled={isResetting}>
            Clear cache
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => setResetModalOpen(true)} disabled={isResetting}>
            Reset everything
            {isResetting && (
              <CircularProgress
                css={css`
                  margin-left: 10px;
                `}
                size={16}
                thickness={6}
                color="inherit"
              />
            )}
          </Button>
        </div>
      </SettingItem>
      <SettingItem name={"Gecko Codes"}>
        <Button variant="outlined" color="primary" onClick={() => setGeckoFormOpen(true)}>
          Gecko Codes
        </Button>
        <Dialog open={geckoFormOpen} onClose={() => setGeckoFormOpen(false)}>
          <DialogContent>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Add" />
              <Tab label="Manage" />
            </Tabs>
            <select id="iniPicker" onChange={handleIniChange}>
              {!iniFiles ? (
                <option key="GALE01.ini">GALE01.ini</option>
              ) : (
                iniFiles.map((iniName: string, i: number) => (
                  <option key={`ini-${i}`} value={iniName}>
                    {iniName}
                  </option>
                ))
              )}
            </select>
            <TabPanel value={tabValue} index={0}>
              <form id="geckoForm" onSubmit={writeGeckoCodes}>
                <TextField
                  type="textarea"
                  id="geckoCode"
                  label="Insert Gecko Code Here"
                  variant="outlined"
                  margin="normal"
                  rows="15"
                  onChange={({ target: { value } }) => setGeckoCode(value)}
                  multiline
                  fullWidth
                  required
                ></TextField>
                <Button type="submit" fullWidth variant="contained" color="primary">
                  Add
                </Button>
              </form>
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <List>
                {!geckoCodes || geckoCodes.length === 0 ? (
                  <ListItem>No Codes Found</ListItem>
                ) : (
                  geckoCodes.map((gecko: GeckoCode, i: number) => (
                    <ListItem key={gecko.name} id={`checkbox-item-${i}`} dense>
                      <Checkbox
                        id={`checkbox-${i}`}
                        checked={gecko.enabled}
                        disableRipple
                        onChange={() => {
                          gecko.enabled = !gecko.enabled;
                          setGeckoCodes([...geckoCodes]);
                        }}
                      />
                      <ListItemText primary={gecko.name} />
                    </ListItem>
                  ))
                )}
              </List>
              <Button fullWidth onClick={() => console.log(geckoCodes)} color="primary" variant="contained">
                Refresh
              </Button>
              <Button fullWidth onClick={saveGeckos} color="primary" variant="contained">
                Save
              </Button>
            </TabPanel>
          </DialogContent>
        </Dialog>
      </SettingItem>
    </div>
  );
};

const ImportDolphinConfigForm: React.FC<{
  dolphinType: DolphinLaunchType;
}> = ({ dolphinType }) => {
  const { addToast } = useToasts();
  const dolphinTypeName = capitalize(dolphinType);
  const extension = isMac ? "app" : "exe";
  const importDolphinHandler = async (importPath: string) => {
    log.info(`importing dolphin from ${importPath}`);
    await ipc_importDolphinSettings.renderer!.trigger({ toImportDolphinPath: importPath, type: dolphinType });
  };

  const onImportClick = async () => {
    const result = await remote.dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Slippi Dolphin", extensions: [isMac ? "app" : "exe"] }],
    });
    const res = result.filePaths;
    if (result.canceled || res.length === 0) {
      return;
    }
    importDolphinHandler(res[0])
      .then(() => {
        addToast(`${dolphinTypeName} Dolphin settings successfully imported`, { appearance: "success" });
      })
      .catch((err) => {
        addToast(err.message ?? JSON.stringify(err), { appearance: "error" });
      });
  };

  return (
    <SettingItem
      name={`Import ${dolphinTypeName} Dolphin Settings`}
      description={`Replace the ${dolphinTypeName} Dolphin settings with those from a different Dolphin application. To do this, select the Dolphin.${extension} with the desired ${dolphinType} settings.`}
    >
      <Button variant="contained" color="secondary" onClick={onImportClick}>
        Import Dolphin settings
      </Button>
    </SettingItem>
  );
};
