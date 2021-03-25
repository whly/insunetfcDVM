const { app, BrowserWindow, Tray, Menu ,nativeImage, dialog } = require('electron');
const isDev = require('electron-is-dev');
const AppUpdater = require("./appUpdater.js");
if (!isDev) AppUpdater();
require('./main.js');


const path = require('path');
let tray = null
let isQuit = false
const image = nativeImage.createFromPath(path.join(__dirname, '/assets/icon.png'))
//log.info('App starting...');
const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    //minimizable : false,
    //maximizable : false,
    show: false,
    icon: image,
    //fullscreenable : false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  /*mainWindow.on('close', (e) => {
    if(!isQuit) {
      mainWindow.hide()
      e.preventDefault();
      return false;
    }
  })*/
  tray = new Tray(path.join(__dirname, '/assets/insunetfc_favicon.png'))
  const contextMenu = Menu.buildFromTemplate([
    //{ label: '열기', type: 'normal', click () { mainWindow.show() } },
    { label: '종료', type: 'normal', click () {
      isQuit = true
      app.quit(); 
    } },
  ])
  let version = app.getVersion()
  tray.setToolTip(`인슈넷FC 인증 프로그램(버전:${process.platform}:${version})`)
  tray.setContextMenu(contextMenu)
};
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  tray.destroy();
})

if (!isDev) {
	app.setLoginItemSettings({
    openAtLogin: true,
  })
}
