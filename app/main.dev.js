/* eslint global-require: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 */
import { app, shell, BrowserWindow, protocol } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import path from 'path';
import MenuBuilder from './menu';

// Set up AppUpdater
log.transports.file.level = 'info';
autoUpdater.logger = log;
log.info('App starting...');

let mainWindow = null;

app.disableHardwareAcceleration();

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const slippiProtocol = "slippi";
// protocol.registerStandardSchemes([slippiProtocol]);

// Only allow a single Slippi Launcher instance
const lockObtained = app.requestSingleInstanceLock();
if (!lockObtained) {
  app.quit();
}

app.on('second-instance', (event, argv) => {
  log.info("Second instance detected...");

  // Could do a really shitty hack here because argv does contain the URI

  log.info(argv);
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()){
      mainWindow.restore();
    } 
    mainWindow.focus();
  }
});

const isProtocolHandler = app.isDefaultProtocolClient(slippiProtocol);
if (isProtocolHandler) {
  log.info("I am the default handler for slippi://");
} else {
  // Even with the setup correctly setting up the registry, the previous function would return
  // false. This next function causes it to return true, but it doesn't fix the issue with the
  // handler not being triggered
  log.info("I am NOT the default handler for slippi://");
  app.setAsDefaultProtocolClient(slippiProtocol);
}

app.on('ready', async () => {
  if (!lockObtained) {
    return;
  }

  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: path.join(__dirname, '../resources/icons/64x64.png'),
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // Handles links of the form: slippi://<something>
  protocol.registerHttpProtocol(slippiProtocol, (req) => {
    log.info("Successfully received request!!!");
    console.log(req);
    // log.info(JSON.stringify(req));
    // cb("Success");
  }, (err) => {
    if (err) {
      log.info("Error registering string protocol");
      log.info(err);
    }

    log.info("Successfully registered string protocol.");
  });

  // Was testing to see if intercept did anything different but I don't think it does
  // protocol.interceptHttpProtocol(slippiProtocol, (req) => {
  //   log.info("interceptted slippi");
  // }, (err) => {
  //   if (err) {
  //     log.info("Error intercepting slippi protocol");
  //     log.info(err);
  //   }

  //   log.info("Successfully interceptstart http protocol.");
  // });

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }

    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on('update-downloaded', () => {
      mainWindow.webContents.send('update-downloaded');
    });
  });

  // On navigation links to http urls, open in external browser
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith("http")) {
      // Do nothing if url doesn't start with http, without this
      // HMR was not working
      return;
    }

    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});
