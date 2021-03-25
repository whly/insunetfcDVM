const moment = require('moment');
moment.locale('ko');
let idleTime = 0
let limitTime = 3 // 3초
let idleDetected = false
let userExtra = null
let alarms = null
let alertedList = []
let mainInterval = null;
function init(callBacks) {
  mainInterval = setInterval(function () {
    monitor(callBacks)
  }, 1000)
}
function setUserExtra(_userExtra) { userExtra = _userExtra }
function setAlarms(_alarms) { alarms = _alarms }
function setIdleTime(value) { 
  idleTime = value
  idleDetected = false
}
function monitor(callBacks) {
  /* 09:00 ~ 12:00 AND 14:00 ~ 18:30 */
  let litAM = {
    start: moment("09:00", "HH:mm"), 
    //start: moment("00:00", "HH:mm"), //test
    end: moment("12:00", "HH:mm")
  }
  let litPM = {
    start: moment("13:00", "HH:mm"),
    end: moment("18:30", "HH:mm")
    //end: moment("23:59", "HH:mm") //test
  }

  let now = moment(new Date(), "HH:mm")
  if(moment().day() == 0 || moment().day() == 6) return; // 토, 일 확인
  
  if(!userExtra || !userExtra.use_idle_alarm) return // 알림 사용 유무 확인, userExtra가 없는경우도 제외

  if(!now.isBetween(litAM.start, litAM.end) && !now.isBetween(litPM.start, litPM.end)) return

  /* 자리비움 확인 */
  if(idleTime >= limitTime && !idleDetected) { 
    callBacks.idleDetectCallBack(idleTime)
    idleDetected = true
  }
  /* 알림 확인 */
  if(callBacks.alarmCallback && alarms) { 
    if(checkAlarm()) callBacks.alarmCallback(idleTime) 
  }
  idleTime++
  /* 현재 IdleTime 전송 */
  callBacks.idleCallBack(idleTime)

  /* 00:00시에 초기화: 혹시라도 24시간 PC를 켜놓는다는 가정하에. */
  if(now.format("HH:mm") == "00:00") alertedList = []
}
function checkAlarm() {
  let now = moment(new Date(), "HH:mm")
  return alarms.find((item) => {
    if(item) {
      let time = moment(item, "HH:mm")
      if(alertedList.indexOf(time.format("HH:mm")) == -1) {
        if(now.format("HH:mm") == time.format("HH:mm")) {
          //console.log("checkAlarm True Same", now.format("HH:mm"), time.format("HH:mm"), alertedList)
          alertedList.push(time.format("HH:mm"))
          return true
        }else{
          //console.log("checkAlarm False Not Same", now.format("HH:mm"), time.format("HH:mm"))
        }
      }else{
        //console.log("checkAlarm False Alreay alerted", item, alertedList)
      }
    }else{
      //console.log("checkAlarm False item Null")
    }
  })
}

module.exports = { init, setIdleTime, setAlarms, setUserExtra }