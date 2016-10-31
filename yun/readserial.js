var serialport = require('serialport');
var SerialPort = serialport.SerialPort;

var tty = new SerialPort("/dev/ttyATH0", {
  baudrate: 115200,
  parser: serialport.parsers.readline("\n")
});

tty.on("open", function () {
  console.log('open');
  tty.on('data', function(data) {
    console.log('data received: ' + data);
  });
  tty.write("ls\n", function(err, results) {
    console.log('err ' + err);
    console.log('results ' + results);
  });
});

