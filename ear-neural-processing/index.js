const SerialPort = require('serialport');
const NeuralNetwork = require('botbrains').NeuralNetwork;
const Toolkit = require('botbrains').Toolkit;

const port = new SerialPort(process.argv[2], { baudRate: 115200 });
let time = new Date().getTime();

const network = new NeuralNetwork(600);
Toolkit.visualise(network);

let i = 0;
port.on('data', data => {
  data.forEach((byte) => {
    if (byte === 0xff) 
    { 
      // END OF FFT BINS (AUDITIVE RANGE)
      let newtime = new Date().getTime();
      console.log('- ' + (newtime - time));
      time = newtime;
      i = 0;
    }
    else {
      //process.stdout.write(byte + ' ');
      const potential = byte / 200;
      if (potential > 1) potential = 1;
      network.input((250 + 125*i++) + 'Hz')(potential);
    }
  });

});