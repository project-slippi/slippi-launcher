import { isMac } from "common/constants";
import { app, dialog, Menu, MenuItemConstructorOptions, shell } from "electron";
import defaultMenu from "electron-default-menu";
import { ipc_openSettingsModalEvent } from "settings/ipc";

/**
 * Is the passed object a constructor for an Electron Menu?
 *
 * @param {(Array<Electron.MenuItemConstructorOptions> | Electron.Menu)} [submenu]
 * @returns {submenu is Array<Electron.MenuItemConstructorOptions>}
 */
function isSubmenu(submenu?: Array<MenuItemConstructorOptions> | Menu): submenu is Array<MenuItemConstructorOptions> {
  return !!submenu && Array.isArray(submenu);
}

/**
 * Depending on the OS, the `Preferences` either go into the `Slippi Launcher`
 * menu (macOS) or under `File` (Linux, Windows).
 *
 * @returns {Array<Electron.MenuItemConstructorOptions>}
 */
function getPreferencesItems(createRootWindow: () => void): Array<MenuItemConstructorOptions> {
  return [
    {
      type: "separator",
    },
    {
      label: "Preferences",
      accelerator: "CmdOrCtrl+,",
      click() {
        // This should effectively noop if the root window is already open,
        // but is here for the cases where the user closed the window but hits preferences
        // or the key command and we need to reopen it.
        createRootWindow();
        void ipc_openSettingsModalEvent.main!.trigger({}); //.then(() => {});
      },
    },
    {
      type: "separator",
    },
  ];
}

/**
 * Depending on the OS, the `Quit` item either goes into the `Slippi Launcher`
 * menu (macOS) or under `File` (Linux, Windows).
 *
 * @returns {Array<Electron.MenuItemConstructorOptions>}
 */
function getQuitItems(): Array<MenuItemConstructorOptions> {
  return [
    {
      type: "separator",
    },
    {
      role: "quit",
    },
  ];
}

/**
 * Returns the top-level "File" menu.
 *
 * @returns {Array<Electron.MenuItemConstructorOptions>}
 */
function getFileMenu(
  createRootWindow: () => void,
  handleSlippiURI: (filePath: string) => void,
): MenuItemConstructorOptions {
  const fileMenu: Array<MenuItemConstructorOptions> = [
    {
      label: "Open Slippi Replay",
      click: () => {
        void dialog.showOpenDialog({ properties: ["openFile"] }).then(function (response) {
          if (!response.canceled) {
            handleSlippiURI(response.filePaths[0]);
          }
        });
      },
      accelerator: "CmdOrCtrl+O",
    },
    {
      type: "separator",
    },
  ];

  // macOS has these items in the "Application" menu
  if (!isMac) {
    fileMenu.splice(fileMenu.length, 0, ...getPreferencesItems(createRootWindow), ...getQuitItems());
  }

  return {
    label: "File",
    submenu: fileMenu,
  };
}

/**
 * Returns additional items for the help menu
 *
 * @returns {Array<Electron.MenuItemConstructorOptions>}
 */
function getHelpItems(): Array<MenuItemConstructorOptions> {
  const items: MenuItemConstructorOptions[] = [];

  items.push(
    { type: "separator" },
    {
      label: "Open Slippi Discord Server",
      click() {
        void shell.openExternal("http://discord.gg/pPfEaW5");
      },
    },
  );

  // on macOS, there's already the About Slippi Launcher menu item
  // under the first submenu set by the electron-default-menu package
  if (!isMac) {
    items.push(
      { type: "separator" },
      {
        label: "About Slippi Launcher",
        click() {
          app.showAboutPanel();
        },
      },
    );
  }

  return items;
}

const generateMenuTemplate = (
  createRootWindow: () => void,
  handleSlippiURI: (filePath: string) => void,
): MenuItemConstructorOptions[] => {
  const menu = (defaultMenu(app, shell) as Array<MenuItemConstructorOptions>).map((item) => {
    const { label } = item;

    // Append the "Settings" item
    if (isMac && label === app.name && isSubmenu(item.submenu)) {
      item.submenu.splice(2, 0, ...getPreferencesItems(createRootWindow));
    }

    // Tweak "View" menu
    if (label === "View" && isSubmenu(item.submenu)) {
      item.submenu.push({ type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" });
    }

    if (isMac && label === "Window" && isSubmenu(item.submenu)) {
      item.submenu.push({
        id: "macos-window-toggle",
        label: "Slippi Launcher",
        accelerator: "Cmd+0",
        visible: false,
        enabled: false,
        click(menuItem) {
          menuItem.enabled = false;
          menuItem.visible = false;
          createRootWindow();
        },
      });
    }

    // Append items to "Help"
    if (label === "Help" && isSubmenu(item.submenu)) {
      item.submenu = getHelpItems();
    }

    return item;
  });

  menu.splice(isMac ? 1 : 0, 0, getFileMenu(createRootWindow, handleSlippiURI));

  return menu;
};

export const generateMenu = (createRootWindow: () => void, handleSlippiURI: (filePath: string) => void) => {
  const template = generateMenuTemplate(createRootWindow, handleSlippiURI);
  const menu = Menu.buildFromTemplate(template);
  return menu;
};
