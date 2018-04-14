const five = require('johnny-five');
const botbrains = require('botbrains');
const scanner = require('node-wifi-scanner');

const board = new five.Board({port: process.argv[2] || '' });
const network = new botbrains.NeuralNetwork(100);
botbrains.Toolkit.visualise(network);

board.on('ready', () => {

  const sensor = new five.IMU({ controller: "LSM303C", freq: 100 });
  const light_FL = new five.Sensor({ pin: 'A0',  freq: 100, threshold: 5 });
  const light_BL = new five.Sensor({ pin: 'A1',  freq: 100, threshold: 5 });
  const light_BR = new five.Sensor({ pin: 'A2',  freq: 100, threshold: 5 });
  const light_FR = new five.Sensor({ pin: 'A3',  freq: 100, threshold: 5 });
  const rangefinder = new five.Proximity({ pin: 2, freq: 100, controller: "HCSR04" });
  const wifi = {};

  let ambientLight, averageLight, averageDistance, lastCollission, lastAction, boredom;

  setInterval(() => {

    const compass = sensor.magnetometer.raw; 
    const now = Date.now(); 

    // Average over 100 measurements (10 seconds)
    ambientLight = (ambientLight||averageLight) * 99/100 + averageLight * 1/100;
    boredom = (now - lastAction) / 30000;

    averageLight = light_FL.value/4 + light_FR.value/4 + light_BL.value/4 + light_BR.value/4;
    averageDistance = (averageDistance||100)*2/3 + rangefinder.cm/3;

    // Light/Range
    network.input('Light Front/Left')((light_FL - ambientLight) / 512);
    network.input('Light Front/Right')((light_FR - ambientLight) / 512);
    network.input('Light Back/Left')((light_BL - ambientLight) / 512);
    network.input('Light Back/Right')((light_BR - ambientLight) / 512);
    network.input('Range Proximity')((200 - averageDistance) / 200);

    // Compass
    network.input('North')(compass.x);
    network.input('South')(-1*compass.x);
    network.input('East')(compass.y);
    network.input('West')(-1*compass.y);

    // Wifi telemetry
    Object.keys(wifi).forEach(ssid => 
      (now - wifi[ssid].time < 10000) ?
      network.input(`wifi (${ssid})`)(wifi[ssid].signal) : false
    );

    // Boredom
    network.input('boredom')(boredom);
    
  }, 100);

  // Every 200ms
  setInterval(() => {
    process.stdout.write('\033c');
    console.log("Mr Happy");
    console.log("  FL            : ", light_FL.value);
    console.log("  FR            : ", light_FR.value);
    console.log("  BL            : ", light_BL.value);
    console.log("  BR            : ", light_BR.value);
    console.log("  averageLight  : ", averageLight);
    console.log("  ambientLight  : ", ambientLight);
    console.log("  averageDistance : ", averageDistance);
    console.log("  acc.x         : ", sensor.accelerometer.x);
    console.log("  acc.y         : ", sensor.accelerometer.y);
    console.log("  acc.z         : ", sensor.accelerometer.z);
    console.log("  mag.x         : ", sensor.magnetometer.raw.x);
    console.log("  mag.y         : ", sensor.magnetometer.raw.y);
    console.log("  mag.z         : ", sensor.magnetometer.raw.z);
    console.log("  boredom       : ", boredom);
    console.log("--------------------------------------");

    if (averageDistance < 20) {
      avoidCollission();
      lastCollission = Date.now();
      network.unlearn(.2);
    } 
  }, 200);

  // Every 1s
  setInterval(() => {
    const lightChange = (averageLight - ambientLight) / ambientLight;
    if (Math.abs(lightChange) > 0.05) {
      console.log('LEARN (lightChange)', lightChange);
      network.learn(lightChange > 1 ? 1 : 
        (lightChange < -1 ? -1 : lightChange));
    }
    const msSinceAction = Date.now() - lastAction;
    if (msSinceAction > 10000 && msSinceAction < 20000) {
      console.log('UNLEARN (msSinceAction)', msSinceAction);
      network.unlearn();
    }
    const msSinceCollission = Date.now() - lastCollission;
    if (msSinceCollission > 10000 && msSinceAction > 10000) {
      console.log('LEARN (msSinceCollission)', msSinceCollission);
      network.learn(msSinceCollission - 10000);
    }
    // Scan Wifi
    scanner.scan((err, networks) => {
      if (networks && networks.length) {
          networks.forEach(n => {
              const rssi = Math.abs(n.rssi);
              if (n.ssid && rssi) {
                  let signal = (-1*rssi + 100) / 70;
                  wifi[n.ssid] = signal;
                  signal = signal < 0 ? 0 : (signal > 1 ? 1 : signal); 
                  wifi[n.ssid] = { signal, time: Date.now() };
              }
          });
      }
  })
  }, 1000);

  const motors = new five.Motors([
    { pins: { dir: 7, pwm: 6 }, invertPWM: true },
    { pins: { dir: 8, pwm: 9 }, invertPWM: true }
  ]);
  const motor_L = motors[0];
  const motor_R = motors[1];
  let avoiding = false;

  network.output('motor (L)').on('data', duration => {
    if (avoiding) return;
    console.log('motor (L)', duration);
    motor_L.forward();
    clearTimeout(motor_L.timeout);
    lastAction = Date.now();
    motor_L.timeout = setTimeout(() => motor_L.stop(), duration * 2000);
    if (boredom > 0.25) {
      network.learn(boredom);
    }
  });
  network.output('motor (R)').on('data', duration => {
    if (avoding) return;
    console.log('motor (R)', duration);
    motor_R.forward();
    lastAction = Date.now();
    clearTimeout(motor_R.timeout);
    motor_R.timeout = setTimeout(() => motor_R.stop(), duration * 2000);
    if (boredom > 0.25) {
      network.learn(boredom);
    }
  });

  function avoidCollission() {
    if (avoding) return;
    console.log('avoidCollission!', averageDistance);
    avoiding = true;
    motors.reverse();
    board.wait(3000, () => {
      if (Math.random() > 0.5) motor_L.stop();
      if (Math.random() > 0.5) motor_R.stop();
      board.wait(Math.random() * 5000, () => motors.stop() && (avoiding = false));
    });
  }

  board.on('exit', () => motors.stop());

});