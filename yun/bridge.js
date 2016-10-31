var stdin = process.openStdin();
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;

var serial = new SerialPort("/dev/ttyATH0", {
  baudrate: 115200,
  parser: serialport.parsers.readline("\n")
});

serial.on("open", function () {
  console.log('Connected to microcontroller!')
  console.log('Use the direction arrows ← → ↑ ↓')
  console.log('And Ctr+C to exit');
  serial.on('data', function(data) {
    console.log('data: ' + data);
  });
});

stdin.setRawMode(true);
stdin.addListener('data', function(data) {
  var chr0 = String(data).charCodeAt(0);
  var chr1 = String(data).charCodeAt(1);
  var chr2 = String(data).charCodeAt(2);  
  console.log('data(%d):', data.length, chr0, chr1, chr2);
  switch(chr0) {
    case 3: // Ctrl+C
      return process.exit(0);
    case 98:
      return serial.write('!-\n');
    case 27: // Arrow
      switch(chr2) {
        case 65: // fwd
          return serial.write('F8\n');
        case 66: // back
          return serial.write('B8\n');
        case 67: // right
          return serial.write('R8\n');
        case 68: // left
          return serial.write('L8\n');
      }
      break;
  }
});
