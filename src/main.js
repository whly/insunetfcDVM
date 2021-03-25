const moment = require('moment');
moment.locale('ko');

const { init, setIdleTime, setAlarms, setUserExtra } = require('./idleDetector.js');
init({
  idleCallBack: (idleTime) => {
    subRoom.emit('idleTime', idleTime)
  },
  idleDetectCallBack: (idleTime) => {
    subRoom.emit('idleDetect', idleTime)
  },
  alarmCallback: (idleTime) => {
    subRoom.emit('alarm', idleTime)
  }
})
const hddserial = require('hddserial');

function macOSModern(callback) {
  var exec = require('child_process').exec;
  exec(`ioreg -l | grep IOPlatformSerialNumber | awk '{print $4}' | sed 's/"//g'`, function (err, out) {
      if (err) {
          callback(err, false);
          return;
      } 
      if(out.length > 0) {
        console.log("Modern", out)
        callback(null, out);
      }else {
        callback("no hdd serial found !!", false);
      }
  });
}

function openSock(serial) {
  const io = require('socket.io')(6055, {
    path: '/auth',
    cors: {
      origin: ["https://dev2-admin.insunetfc.com", "http://localhost:8080", "http://localhost:8081","https://dev-admin.insunetfc.com","https://new-admin.insunetfc.com"],
      credentials: true
    }
  });
  io.on('connection', (socket) => {
    console.log("conn")
    socket.emit('serial', serial);
  });
}

async function getHddSerial() {
  return await new Promise((resolve, reject) => {
    hddserial.first(function (err, serial) {
      if(process.platform == 'darwin' && serial == false) {
        macOSModern(function (err2, serial2) {
          if(err2) {
            reject("err")
            return;
          }
          if(serial2) {
            resolve(serial2)
          }
          
        })
      }else{
        if(err) {
          reject("err")
          return;
        }
        resolve(serial)
      }
    });
  }) 
}

const ioOptions = { 
  cors: {
    origin: ["https://dev2-admin.insunetfc.com", "http://localhost:8080", "http://localhost:8081","https://dev-admin.insunetfc.com","https://new-admin.insunetfc.com"],
    credentials: true
  }
};
const io = require('socket.io')(ioOptions);
const mainRoom = io.of('/dvm');
const subRoom = io.of('/idle');
mainRoom.on('connection', socket => {
  socket.emit('version', require('electron').app.getVersion())
  socket.on("serial", () => {
    getHddSerial().then(res => {
      socket.emit('serial', res)
    })
  })
})
subRoom.on('connection', socket => {
  socket.on("event", (data) => {
    if(data.type == "resetIdleTime") {
      setIdleTime(0)
      if(data.value == "closeDialog") {
        subRoom.emit('closeDialog')
      }
    }else if(data.type == "userData") {
      let userData = data.value
      let extra = JSON.parse(userData.admin_extra)
      setUserExtra(extra)
      if(extra && extra.alarms)
        setAlarms(extra.alarms)
    }
  })
  socket.on("disconnect", (reason) => {
  })
})

io.listen(6056);

