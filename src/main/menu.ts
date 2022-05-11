/* eslint-disable import/no-default-export */
import type { BrowserWindow, MenuItemConstructorOptions } from "electron";
import { app, dialog, Menu, shell } from "electron";

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export class MenuBuilder {
  private mainWindow: BrowserWindow;
  private onOpenPreferences: () => void;
  private onOpenReplayFile: (filePath: string) => void;
  private createWindow: () => Promise<void>;
  private enableDevTools?: boolean;

  constructor(options: {
    mainWindow: BrowserWindow;
    onOpenPreferences: () => void;
    onOpenReplayFile: (filePath: string) => void;
    createWindow: () => Promise<void>;
    enableDevTools?: boolean;
  }) {
    this.mainWindow = options.mainWindow;
    this.enableDevTools = options.enableDevTools;
    this.onOpenPreferences = options.onOpenPreferences;
    this.onOpenReplayFile = options.onOpenReplayFile;
    this.createWindow = options.createWindow;
  }

  public buildMenu(): Menu {
    if (this.enableDevTools) {
      this.setupDevelopmentEnvironment();
    }

    const template = process.platform === "darwin" ? this.buildDarwinTemplate() : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  private setupDevelopmentEnvironment(): void {
    this.mainWindow.webContents.on("context-menu", (_, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: "Inspect element",
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  private buildDarwinTemplate(): MenuItemConstructorOptions[] {
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: "Slippi Launcher",
      submenu: [
        {
          label: "About Slippi Launcher",
          selector: "orderFrontStandardAboutPanel:",
        },
        { type: "separator" },
        {
          label: "Preferences",
          accelerator: "Cmd+,",
          click: () => {
            this.onOpenPreferences();
          },
        },
        {
          type: "separator",
        },
        { label: "Services", submenu: [] },
        { type: "separator" },
        {
          label: "Hide Slippi Launcher",
          accelerator: "Command+H",
          selector: "hide:",
        },
        {
          label: "Hide Others",
          accelerator: "Command+Shift+H",
          selector: "hideOtherApplications:",
        },
        { label: "Show All", selector: "unhideAllApplications:" },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: "Command+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuFile: DarwinMenuItemConstructorOptions = {
      label: "File",
      submenu: [
        {
          label: "Open Replay",
          accelerator: "Command+O",
          click: () => {
            void dialog.showOpenDialog({ properties: ["openFile"] }).then((response) => {
              if (!response.canceled) {
                this.onOpenReplayFile(response.filePaths[0]);
              }
            });
          },
        },
      ],
    };
    const subMenuEdit: DarwinMenuItemConstructorOptions = {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "Command+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+Command+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "Command+X", selector: "cut:" },
        { label: "Copy", accelerator: "Command+C", selector: "copy:" },
        { label: "Paste", accelerator: "Command+V", selector: "paste:" },
        {
          label: "Select All",
          accelerator: "Command+A",
          selector: "selectAll:",
        },
      ],
    };
    const subMenuViewDev: DarwinMenuItemConstructorOptions[] = [
      {
        label: "Reload",
        accelerator: "Command+R",
        click: () => {
          this.mainWindow.webContents.reload();
        },
      },
      {
        label: "Toggle Developer Tools",
        accelerator: "Alt+Command+I",
        click: () => {
          this.mainWindow.webContents.toggleDevTools();
        },
      },
      { type: "separator" },
    ];
    const subMenuViewItems = this.enableDevTools ? subMenuViewDev : [];

    const subMenuView: DarwinMenuItemConstructorOptions = {
      label: "View",
      submenu: [
        ...subMenuViewItems,
        {
          label: "Toggle Full Screen",
          accelerator: "Ctrl+Command+F",
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
      ],
    };
    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: "Window",
      submenu: [
        {
          label: "Minimize",
          accelerator: "Command+M",
          selector: "performMiniaturize:",
        },
        { label: "Close", accelerator: "Command+W", selector: "performClose:" },
        { type: "separator" },
        { label: "Bring All to Front", selector: "arrangeInFront:" },
        {
          id: "macos-window-toggle",
          label: "Slippi Launcher",
          accelerator: "Cmd+0",
          visible: false,
          enabled: false,
          click: (menuItem) => {
            menuItem.enabled = false;
            menuItem.visible = false;
            void this.createWindow();
          },
        },
      ],
    };
    const subMenuHelp: MenuItemConstructorOptions = {
      label: "Help",
      submenu: [
        {
          label: "Open Slippi Discord Server",
          click() {
            void shell.openExternal("http://discord.gg/pPfEaW5");
          },
        },
      ],
    };

    return [subMenuAbout, subMenuFile, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
  }

  private buildDefaultTemplate() {
    const templateDefault = [
      {
        label: "&File",
        submenu: [
          {
            label: "&Open",
            accelerator: "Ctrl+O",
            click: () => {
              void dialog.showOpenDialog({ properties: ["openFile"] }).then((response) => {
                if (!response.canceled) {
                  this.onOpenReplayFile(response.filePaths[0]);
                }
              });
            },
          },
          {
            label: "&Close",
            accelerator: "Ctrl+W",
            click: () => {
              this.mainWindow.close();
            },
          },
        ],
      },
      {
        label: "&View",
        submenu:
          process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true"
            ? [
                {
                  label: "&Reload",
                  accelerator: "Ctrl+R",
                  click: () => {
                    this.mainWindow.webContents.reload();
                  },
                },
                {
                  label: "Toggle &Full Screen",
                  accelerator: "F11",
                  click: () => {
                    this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                  },
                },
                {
                  label: "Toggle &Developer Tools",
                  accelerator: "Alt+Ctrl+I",
                  click: () => {
                    this.mainWindow.webContents.toggleDevTools();
                  },
                },
              ]
            : [
                {
                  label: "Toggle &Full Screen",
                  accelerator: "F11",
                  click: () => {
                    this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                  },
                },
              ],
      },
      {
        label: "Help",
        submenu: [
          {
            label: "Open Slippi Discord Server",
            click() {
              void shell.openExternal("http://discord.gg/pPfEaW5");
            },
          },
        ],
      },
    ];

    return templateDefault;
  }
}
