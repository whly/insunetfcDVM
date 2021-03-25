const { NsisUpdater } = require("electron-updater")
module.exports = function AppUpdater() {
  const options = {
    autoDownload: false,
    requestHeaders: {},
    provider: 'generic',
    url: 'https://insunetfc-device-manager.s3.ap-northeast-2.amazonaws.com'
  }

  const autoUpdater = new NsisUpdater(options)
  const log = require("electron-log")
  log.transports.file.level = "debug"
  autoUpdater.logger = log
  
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
  })
  autoUpdater.on('update-available', (info) => {
    log.info('Update available.');
  })
  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.');
  })
  autoUpdater.on('error', (err) => {
    log.info('Error in auto-updater. ' + err);
  })
  autoUpdater.on('download-progress', (progressObj) => {
    /*let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    sendStatusToWindow(log_message);*/
  })
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded');
  });

  autoUpdater.checkForUpdatesAndNotify()
}