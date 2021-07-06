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
import Select from "@material-ui/core/Select";
import { makeStyles } from "@material-ui/core/styles";
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

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`full-width-tabpanel-${index}`} {...other}>
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const useStyles = makeStyles({
  geckoDialog: {
    display: "flex",
    flexDirection: "column",
  },
});

export const DolphinSettings: React.FC<{ dolphinType: DolphinLaunchType }> = ({ dolphinType }) => {
  const classes = useStyles();

  const [dolphinPath, setDolphinPath] = useDolphinPath(dolphinType);

  const [resetModalOpen, setResetModalOpen] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const { addToast } = useToasts();

  //vars for editing gecko codes
  const [tabValue, setTabValue] = React.useState(0);
  const [geckoFormOpen, setGeckoFormOpen] = React.useState(false);
  const [newGeckoCode, setNewGeckoCode] = React.useState("");
  const [geckoCodes, setGeckoCodes] = React.useState([]);
  const [sysIniFiles, setSysIniFiles] = React.useState([]);
  const [userIniPath, setUserIniPath] = React.useState("");
  const [userIniFolder, setUserIniFolder] = React.useState("");
  const [globalIniPath, setGlobalIniPath] = React.useState("");
  const [globalIniFolder, setGlobalIniFolder] = React.useState("");

  //set the paths for the userIniFolder and sysIniFolder when dolphinPath is updated
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

  //populate the list of ini files
  React.useEffect(() => {
    if (globalIniFolder !== "" && userIniFolder !== "") {
      const sysFilesArray = fs.readdirSync(globalIniFolder);
      setSysIniFiles(sysFilesArray);
      setGlobalIniPath(path.join(globalIniFolder, sysFilesArray[0]));
      setUserIniPath(path.join(userIniFolder, getUserIni(sysFilesArray[0])));
    }
  }, [globalIniFolder, userIniFolder]);

  //reload gecko codes whenever the paths to either ini change
  React.useEffect(() => {
    async function loadCodes() {
      const sysIni = new IniFile();
      const userIni = new IniFile();

      if (globalIniPath !== "") {
        await sysIni.load(globalIniPath, false);
      }
      if (userIniPath !== "") {
        try {
          //if the user ini does not exist, create one
          if (fs.existsSync(userIniPath)) {
            await userIni.load(userIniPath, false);
          } else {
            fs.writeFile(userIniPath, "", (err) => console.log(err));
          }
        } catch (err) {
          console.log(err);
        }
      }
      if (sysIni !== new IniFile()) {
        const gcodes = loadGeckoCodes(sysIni, userIni !== new IniFile() ? userIni : undefined);
        setGeckoCodes(gcodes);
      }
    }

    void loadCodes();
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

  const writeGeckoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawGecko = newGeckoCode.split("\n");
    let newCode: GeckoCode = {
      name: "",
      creator: "",
      enabled: true,
      defaultEnabled: false,
      userDefined: true,
      notes: [],
      codeLines: [],
    };

    //fill out gecko info
    rawGecko.forEach((line) => {
      switch (line[0]) {
        // code name
        case "$": {
          if (newCode.name.length > 0) {
            geckoCodes.push(newCode);
          }
          line = line.slice(1); // cut out the $

          const creatorMatch = line.match(/\[(.*?)\]/); // searches for brackets, catches anything inside them
          const creator = creatorMatch !== null ? creatorMatch[1] : creatorMatch;
          const name = creator ? line.split("[")[0] : line;

          newCode = {
            ...newCode,
            name: name,
            creator: creator,
            notes: [],
            codeLines: [],
          };
          break;
        }
        // comments
        case "*": {
          newCode.notes.push(line.slice(1));
          break;
        }
        default: {
          newCode.codeLines.push(line);
        }
      }
    });
    if (newCode.name.length > 0) {
      geckoCodes.push(newCode);
    }
    void saveGeckos();
    document.getElementById("geckoForm").reset();
  };

  //create a blank ini file and write our user.ini file info to it
  const saveGeckos = async () => {
    const userIni = new IniFile();
    saveCodes(userIni, geckoCodes);
    userIni.save(userIniPath);
    addToast(`Updated ${userIniPath.substring(userIniPath.lastIndexOf("\\") + 1)}`);
  };

  const handleTabChange = (event: React.ChangeEvent<unknown>, newValue: number) => {
    setTabValue(newValue);
  };

  const handleIniChange = ({ target: { value } }) => {
    setGlobalIniPath(path.join(globalIniFolder, value));
    const userIniName = getUserIni(value);
    setUserIniPath(path.join(userIniFolder, userIniName));
  };

  //find out the appropriate user ini file given the sys ini file
  const getUserIni = (sysIniName: string) => {
    switch (sysIniName) {
      case "GALE01r2.ini": {
        return "GALE01.ini";
      }
      case "GALJ01r2.ini": {
        return "GALJ01.ini";
      }
      default: {
        return sysIniName;
      }
    }
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
        <Button variant="contained" color="secondary" onClick={() => setGeckoFormOpen(true)}>
          Gecko Codes
        </Button>
      </SettingItem>
      <Dialog open={geckoFormOpen} onClose={() => setGeckoFormOpen(false)}>
        <DialogContent className={classes.geckoDialog}>
          <Tabs value={tabValue} variant="fullWidth" onChange={handleTabChange}>
            <Tab label="Add" />
            <Tab label="Manage" />
          </Tabs>
          <Select labelId="ini-label" native={true} id="iniPicker" onChange={handleIniChange}>
            {!sysIniFiles ? (
              <option key="loading.ini">loading</option>
            ) : (
              sysIniFiles.map((iniName: string, i: number) => (
                <option key={`ini-${i}`} value={iniName}>
                  {iniName}
                </option>
              ))
            )}
          </Select>
          <TabPanel value={tabValue} index={0}>
            <form id="geckoForm" onSubmit={writeGeckoCode}>
              <TextField
                type="textarea"
                id="geckoCode"
                label="Paste Gecko Code Here"
                variant="outlined"
                margin="normal"
                rows="18"
                onChange={({ target: { value } }) => setNewGeckoCode(value)}
                multiline
                fullWidth
                required
              ></TextField>
              <Button type="submit" fullWidth variant="outlined" color="secondary">
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
            <Button color="secondary" variant="outlined" fullWidth onClick={saveGeckos}>
              Save
            </Button>
          </TabPanel>
        </DialogContent>
      </Dialog>
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
