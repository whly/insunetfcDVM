const { dialog } = require('electron');
const { autoUpdater } = require("electron-updater")
module.exports = function AppUpdater() {
  const log = require("electron-log")
  log.transports.file.level = "debug"
  autoUpdater.logger = log
  //다운로드 완료되면 업데이트
  autoUpdater.on('update-downloaded', function(event, releaseNotes, releaseName) {
    const dialogOpts = {
        type: 'info',
        buttons: ['확인'],
        title: '업데이트 안내',
        message: '프로그램을 최신버전으로 업데이트합니다.'
    };
    dialog.showMessageBox(dialogOpts).then(res => {
      autoUpdater.quitAndInstall();
    })
  });
  autoUpdater.checkForUpdates()
}