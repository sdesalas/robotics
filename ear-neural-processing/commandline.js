const SerialPort = require('serialport');

const port = new SerialPort(process.argv[2], { baudRate: 115200 });
let time = new Date().getTime();
port.on('data', data => {
  data.forEach(byte => {
    if (byte === 0xff) 
    {
      let newtime = new Date().getTime();
      console.log('- ' + (newtime - time));
      time = newtime;
    }
    else process.stdout.write(byte + ' ');
  });

});