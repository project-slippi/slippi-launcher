import { app, Menu, shell } from 'electron';

export default class MenuBuilder {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu() {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.openDevTools();
    this.mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.inspectElement(x, y);
          },
        },
      ]).popup(this.mainWindow);
    });
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: 'Slippi Desktop App',
      submenu: [
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuViewDev = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.toggleDevTools();
          },
        },
      ],
    };
    const subMenuHelp = {
      label: 'Help',
      submenu: [
        {
          label: 'slippi.gg',
          click: function() {
            shell.openExternal('https://slippi.gg');
          },
        },
        {
          label: 'GitHub',
          click: function() {
            shell.openExternal(
              'https://github.com/project-slippi/project-slippi'
            );
          },
        },
        {
          label: 'Discord',
          click: function() {
            shell.openExternal('https://discord.gg/pPfEaW5');
          },
        },
      ],
    };

    const menus =
      process.env.NODE_ENV === 'development' ? [subMenuAbout, subMenuViewDev, subMenuHelp] : [subMenuAbout, subMenuHelp];

    return menus;
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '&View',
        submenu:
          process.env.NODE_ENV === 'development'
            ? [
              {
                label: '&Reload',
                accelerator: 'Ctrl+R',
                click: () => {
                  this.mainWindow.webContents.reload();
                },
              },
              {
                label: 'Toggle &Full Screen',
                accelerator: 'F11',
                click: () => {
                  this.mainWindow.setFullScreen(
                    !this.mainWindow.isFullScreen()
                  );
                },
              },
              {
                label: 'Toggle &Developer Tools',
                accelerator: 'Alt+Ctrl+I',
                click: () => {
                  this.mainWindow.toggleDevTools();
                },
              },
            ]
            : [
              {
                label: 'Toggle &Full Screen',
                accelerator: 'F11',
                click: () => {
                  this.mainWindow.setFullScreen(
                    !this.mainWindow.isFullScreen()
                  );
                },
              },
            ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'slippi.gg',
            click: function() {
              shell.openExternal('http://slippi.gg');
            },
          },
          {
            label: 'GitHub',
            click: function() {
              shell.openExternal(
                'https://github.com/project-slippi/project-slippi'
              );
            },
          },
          {
            label: 'Discord',
            click: function() {
              shell.openExternal('https://discord.gg/pPfEaW5');
            },
          },
        ],
      },
    ];

    return templateDefault;
  }
}
