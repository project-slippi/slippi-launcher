import { isMac } from "common/constants";
import { app, Menu, MenuItemConstructorOptions } from "electron";

const generateMenuTemplate = (): MenuItemConstructorOptions[] => {
  const platform = process.platform;
  const menuItems: MenuItemConstructorOptions[] = [];

  const application: MenuItemConstructorOptions = {
    label: isMac ? "Application" : "File",
    submenu: [
      {
        label: "Quit",
        accelerator: platform === "darwin" ? "Command+Q" : undefined,
        click: () => {
          app.quit();
        },
      },
    ],
  };
  menuItems.push(application);

  const edit: MenuItemConstructorOptions = {
    label: "Edit",
    submenu: [
      {
        label: "Undo",
        accelerator: "CmdOrCtrl+Z",
        role: "undo",
      },
      {
        label: "Redo",
        accelerator: "Shift+CmdOrCtrl+Z",
        role: "redo",
      },
      {
        type: "separator",
      },
      {
        label: "Cut",
        accelerator: "CmdOrCtrl+X",
        role: "cut",
      },
      {
        label: "Copy",
        accelerator: "CmdOrCtrl+C",
        role: "copy",
      },
      {
        label: "Paste",
        accelerator: "CmdOrCtrl+V",
        role: "paste",
      },
      {
        label: "Select All",
        accelerator: "CmdOrCtrl+A",
        role: "selectAll",
      },
    ],
  };
  menuItems.push(edit);

  const view: MenuItemConstructorOptions = {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forceReload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn", accelerator: "CommandOrControl+=" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  };
  menuItems.push(view);

  if (platform === "darwin") {
    menuItems.push(
      {
        type: "separator",
      },
      {
        label: "Quit",
        click: () => {
          app.quit();
        },
      },
    );
  }
  return menuItems;
};

const template = generateMenuTemplate();
export const menu = Menu.buildFromTemplate(template);
