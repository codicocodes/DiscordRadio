const { app, Tray, BrowserWindow, Menu, nativeImage } = require('electron');
const path = require('path');

require('./discord-gateway');

const WINDOW_HEIGHT = 500;
const WINDOW_WIDTH = 300;

const appUI = {
  /** @type {Tray} */ tray: null,
  /** @type {BrowserWindow} */ window: null,
};

app.on('window-all-closed', e => e.preventDefault());
app.whenReady().then(() => {
  appUI.window = createWindow();
  appUI.tray = createTray(appUI.window);
  setWindowPosition(appUI.window, appUI.tray);
});

/**
 * @param {BrowserWindow} window 
 */
function createTray(window) {
  const trayImage = nativeImage.createFromPath(path.join(app.getAppPath(), 'assets/Discord-Logo-White.png'));
  const tray = new Tray(trayImage);
  tray.setToolTip('Discord RPC Gateway');
  tray.on('click', $=> {
    window.loadFile('src/pages/index.html');
    window.show();
  });

  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show', click: $=> window.show() },
    { label: 'Quit', click: $=> app.exit() },
  ]));

  return tray;
}

function createWindow() {
  const windowImage = nativeImage.createFromPath(path.join(app.getAppPath(), 'assets/Discord-Logo-White.png'));
  const window = new BrowserWindow({
    icon: windowImage,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    show: false,
    alwaysOnTop: true,
    resizable: false,
    maximizable: false,
    webPreferences: {
      nativeWindowOpen: true,
    }
  });

  window.on('minimize', hideWindow);
  window.on('maximize', e => e.preventDefault());
  window.on('close', hideWindow);
  return window;

  function hideWindow(e) {
    e.preventDefault();
    window.hide();
  }
}

/**
 * @param {BrowserWindow} window 
 * @param {Tray} tray 
 */
function setWindowPosition(window, tray) {
  const bounds = {
    x: tray.getBounds().x - WINDOW_WIDTH / 2,
    y: tray.getBounds().y,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
  };

  if (tray.getBounds().y > 100) bounds.y -= window.getBounds().height;
  else bounds.y += tray.getBounds().height;

  window.setBounds(bounds);
}
