const fs = require('fs');
const five = require('johnny-five');
const botbrains = require('botbrains');
const EventEmitter = require('events');

const board = new five.Board({ port: process.argv[2] || ''});

board.on('ready', () => {

    const network = new botbrains.NeuralNetwork(200, 'sausage');

    // INPUTS - 3 photo-resistors, 2x eyes, 1x back
    const photo_l = new five.Sensor({ pin: 'A0', freq: 100 });
    const photo_r = new five.Sensor({ pin: 'A1', freq: 100 });
    const photo_b = new five.Sensor({ pin: 'A2', freq: 100 });

    photo_l.on('data', () => {
        network.input('photo_l', 2)(photo_l.fscaleTo(0, 1));
        network.input('photo_l (inverted)', 2)(1 - photo_l.fscaleTo(0, 1));
    });
    photo_r.on("data", () => {
        network.input('photo_r', 2)(photo_r.fscaleTo(0, 1));
        network.input('photo_r (inverted)', 2)(1- photo_r.fscaleTo(0, 1));
    });
    photo_b.on("data", () => {
        network.input('photo_b', 2)(photo_b.fscaleTo(0, 1));
        network.input('photo_b (inverted)', 2)(1- photo_b.fscaleTo(0, 1));
    });

    // INPUT - ultrasound range finder
    const rangefinder = new five.Proximity({ pin: 2, freq: 100, controller: "HCSR04" });
    rangefinder.on('data', () => {
        if (rangefinder.cm < 20 && rangefinder > 6) { 
            const closeness = 1 - (rangefinder.cm / 20); // 0 = very far, 1 = very close
            network.unlearn(closeness);
            network.input('rangefinder', 4)(closeness);
        } else {
            network.learn(0.01); // still far? thats a good thing, do more of it
        }
    });

    // LEARN - Is light increasing? Use this to drive learning.
    photo_l.on('change', () => {
        const diff = Math.min(1, (photo_l.value - (photo_l.lastValue || 0)) / 500);
        network.learn(1 - diff);
        photo_l.lastValue = photo_l.value;
    });
    photo_r.on('change', () => {
        const diff = Math.min(1, (photo_l.value - (photo_l.lastValue || 0)) / 500);
        network.learn(1 - diff);
        photo_l.lastValue = photo_l.value;
    });

    // OUTPUTS
    let timeout_l, speed_l;
    let timeout_r, speed_r;
    const motor_l = new five.Motor({ pins: { pwm: 6, dir: 7, }, invertPWM: true, });
    const motor_r = new five.Motor({ pins: { pwm: 9, dir: 8, }, invertPWM: true, });
    motor_l.stop();
    motor_r.stop();

    network.output('motor_l', 1).on('data', (val) => {
        speed_l = Math.floor(val * 256);
        if (speed_l < 150) {
            motor_l.stop();
        } else {
            motor_l.reverse(speed_l);
            clearTimeout(timeout_l);
            timeout_l = setTimeout(() => motor_l.stop(), 2500);
        }
    });
    network.output('motor_r', 1).on('data', (val) => {
        speed_r = Math.floor(val * 256);
        if (speed_r < 150) {
            motor_r.stop();
        } else {
            motor_r.reverse(speed_r);
            clearTimeout(timeout_r);
            timeout_r = setTimeout(() => motor_r.stop(), 2500);
        }
    });

    // DISPLAY VIA LOCAHOST
    var display = botbrains.Toolkit.visualise(network);
    var port = display.address().port;

    console.log(`Network ready for display. Please open http://localhost:${port}`);

    setInterval(() => {
        console.log(`L: ${photo_l.value}, R: ${photo_r.value}, B: ${photo_b.value}, P: ${rangefinder.cm}, ML: ${speed_l}, MR: ${speed_r}`);
    }, 200);
});


