const { app } = require('electron');
const request = require('request')
const moment = require('moment');
moment.locale('ko');
const db = require("node-localdb-modern");
const user = db(`${app.getPath('userData')}/data/user.json`);
let alertLog;
const isDev = require('electron-is-dev');

let idleTime = 0
let limitTime = isDev ? 3  : 60 * 30 // 30분
let userData = {
  adminId: null,
  token: null,
  useAlarm: false,
  alarms: null,
}
let alertStatus = {
  firstAlert: false,
  secondAlert: false,
}
let alertedList = []
let mainInterval = null;

let srDate = null
let prDate = null

function init(callBacks) {
  resetData()
  getUserData()
  mainInterval = setInterval(function () {
    monitor(callBacks)
  }, 1000)
}
function getUserData() {
  // Todo: 
  user.findOne({}).then(u => {
    if(u) userData = u
  })
}
function setUserData (_userData) {
  user.findOne({adminId: _userData._id}).then(function(u) {
    if(!u) {
      let extra = JSON.parse(_userData.admin_extra)
      let adminName = _userData.admin_name
      let useAlarm = (extra && extra.use_idle_alarm) ? true : false
      let alarms = (extra && extra.alarms) ? extra.alarms : null
      user.insert({ adminId: _userData._id, adminName: adminName, token: _userData.token, useAlarm: useAlarm, alarms: alarms })
      .then(function(u2) {
        //set UserData
        userData = u2
      });
    }else{
      let extra = JSON.parse(_userData.admin_extra)
      let adminName = _userData.admin_name
      let useAlarm = (extra && extra.use_idle_alarm) ? true : false
      let alarms = (extra && extra.alarms) ? extra.alarms : null
      user.updateById(u._id, { adminId: _userData._id, adminName: adminName, token: _userData.token, useAlarm: useAlarm, alarms: alarms })
      .then(function (u2) {
        //set UserData
        userData = u2
      })
    }
  });
}
function setUserExtra(_userExtra) { userExtra = _userExtra }
function setAlarms(_alarms) { alarms = _alarms }
function setIdleTime(value) { 
  idleTime = value
  alertLog.update({ userCheck: false }, { userCheck: true });
  alertStatus.firstAlert = false
  alertStatus.secondAlert = false
}
function resetIdleTime() { idleTime = 0 }
function resetAlertStatus(type) {
  if(type == 'first') {
    alertStatus.firstAlert = false
  }else if(type == 'second') {
    alertStatus.secondAlert = false
  }
}
function resetData() {
  srDate = moment()
  alertedList = []
  alertLog = db(`${app.getPath('userData')}/data/${moment().format('YY-MM-DD')}/alertLog.json`);
  alertLog.update({ userCheck: false }, { userCheck: true });
}
async function monitor(callBacks) {
  if(!checkRunable()) return

  /* 휴일이 아니며, 지정된 업무시간 범위내 인경우 */

  /* 
    1단계 알림은 두가지 (자리비움알림, 지정시간알림)
    두가지중 하나만 알림발생 (중복발생 x)
  */  
  /* 자리비움 확인 (1단계 팝업) */
  if(!alertStatus.firstAlert) {
    /*if(callBacks.firstAlertCallback && idleTime >= limitTime) { 
      alertLog.insert({
        alertDateTime: moment().format("YYYY-MM-DD HH:mm:ss"),
        alertTime: moment().format("HH:mm"),
        alertName: '자리비움감지알림',
        alertType: '1단계알림',
        userCheck: false,
      })
      alertStatus.firstAlert = true
      callBacks.firstAlertCallback(idleTime)
    }*/
    /* 알림 확인 (1단계 팝업) */
    if(callBacks.firstAlertCallback && userData.alarms) {
      if(checkAlarmSchedule()) {
        alertLog.insert({
          alertDateTime: moment().format("YYYY-MM-DD HH:mm:ss"),
          alertTime: moment().format("HH:mm"),
          alertName: '지정시간알림',
          alertType: '1단계알림',
          userCheck: false,
        })
        alertStatus.firstAlert = true
        callBacks.firstAlertCallback(idleTime) 
      }
    }
  }
  /* 1단계 알림 이후 10분이 경과했는지 확인 (2단계 팝업) */
  if(alertStatus.firstAlert && !alertStatus.secondAlert) {
    if(callBacks.timeOverAlarmCallback) { 
      let res = await checkTimeOverAlarm()
      if(res) {
        alertLog.update({ userCheck: false }, { userCheck: true });
        alertLog.insert({
          alertDateTime: moment().format("YYYY-MM-DD HH:mm:ss"),
          alertTime: moment().format("HH:mm"),
          alertName: '사유입력알림',
          alertType: '2단계알림',
          userCheck: false,
        })
        
        alertStatus.secondAlert = true
        try {
          let res = await createIdleAlertLog()
          callBacks.secondAlertCallback(res._id) 
        }catch(err) {
          callBacks.secondAlertCallback(null)
        }
        // 초기화 해줘야 2단계 알림후 여전히 자리비움인 경우에도 다시 지정알림을 띄울수있다.
        setIdleTime(0)
      }
    }
  }
  
  idleTime++
  /* 현재 IdleTime 전송 */
  if(callBacks.idleCallBack) callBacks.idleCallBack(idleTime)

  /* 하루 지날시 초기화 */
  if(moment(new Date()).isAfter(srDate, 'day')) {
    resetData()
  }
}
function checkRunable() {
  if(isDev) return true
  /* 09:00 ~ 12:00 AND 14:00 ~ 18:30 */
  let litAM = {
    start: moment("09:00", "HH:mm"), 
    end: moment("12:00", "HH:mm")
  }
  let litPM = {
    start: moment("13:00", "HH:mm"),
    end: moment("18:30", "HH:mm")
  }
  let now = moment(new Date(), "HH:mm")
  if(moment().day() == 0 || moment().day() == 6) return false; // 토, 일 확인
  
  if(!userData || !userData.useAlarm) return false // 알림 사용 유무 확인, userData가 없는경우도 제외

  if(!now.isBetween(litAM.start, litAM.end) && !now.isBetween(litPM.start, litPM.end)) return false
  return true
}

function checkAlarmSchedule() {
  let now = moment(new Date(), "HH:mm")
  return userData.alarms.find((item) => {
    if(item) {
      let time = moment(item, "HH:mm")
      if(alertedList.indexOf(time.format("HH:mm")) == -1) {
        if(now.format("HH:mm") == time.format("HH:mm")) {
          alertedList.push(time.format("HH:mm"))
          return true
        }else{
        }
      }else{
      }
    }else{
    }
  })
}

async function checkTimeOverAlarm() {
  if(isDev) {
    return alertLog.findOne(e => {
      return moment().isSameOrAfter(moment(e.alertDateTime).add(10, 'second')) && !e.userCheck && e.alertType == '1단계알림'
    })
  }else{
    return alertLog.findOne(e => {
      return moment().isSameOrAfter(moment(e.alertDateTime).add(10, 'minute')) && !e.userCheck && e.alertType == '1단계알림'
    })
  }
}
function createIdleAlertLog() {
  let params = {
    admin_name: userData.adminName,
    admin_id: userData.adminId,
    idle_alert_date: new Date()
  }
  const options = {
    url:'https://dev-api2.insunetfc.com/v1/crm/idle.alert/create', 
    method: 'POST',
    body: params,
    headers: { 'content-type': 'application/json', 'authorization': 'bearer ' + userData.token },
    json: true
  }
  return new Promise((resolve, reject) => {
    request(options, function(err, httpResponse, body) {
      let { data, error } = body
      if(error) {
        reject(error)
        return
      }
      resolve(data._id)
    })
  })
}

module.exports = {
  init,
  getUserData,
  setUserData,
  setIdleTime,
  setAlarms,
  setUserExtra
}