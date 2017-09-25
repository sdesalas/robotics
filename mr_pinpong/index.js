const fs = require('fs');
const five = require('johnny-five');
const botbrains = require('botbrains');
const EventEmitter = require('events');

const board = new five.Board({ port: process.argv[2] || ''});

board.on('ready', () => {

    const network = new botbrains.NeuralNetwork(200);

    // INPUTS - two photo-resistors for eyes
    const photo_l = new five.Sensor({ pin: 'A0', freq: 100 });
    const photo_r = new five.Sensor({ pin: 'A1', freq: 100 });

    photo_l.on('data', () => {
        network.input('photo_l', 2)(photo_l.fscaleTo(0, 1));
        network.input('photo_l (inverted)', 2)(1 - photo_l.fscaleTo(0, 1));
    });
    photo_r.on("data", () => {
        network.input('photo_r', 2)(photo_r.fscaleTo(0, 1));
        network.input('photo_r (inverted)', 2)(1- photo_r.fscaleTo(0, 1));
    });

    // INPUT - ultrasound range finder
    const rangefinder = new five.Proximity({ pin: 14, freq: 100, controller: "HCSR04" });
    rangefinder.on('data', () => {
        if (rangefinder.cm < 20) {
            const closeness = 1 - (rangefinder.cm / 20); // 0 = very far, 1 = very close
            network.unlearn(closeness);
            network.input('rangefinder', 4)(closeness);
        } else {
            network.learn(0.05); // still far? thats a good thing, do more of it
        }
    });

    // LEARN - Is light increasing? Use this to drive learning.
    photo_l.on('change', () => {
        const diff = Math.min(1, (photo_l.value - (photo_l.lastValue || 0)) / 200);
        network.learn(1 - diff);
        photo_l.lastValue = photo_l.value;
    });
    photo_r.on('change', () => {
        const diff = Math.min(1, (photo_l.value - (photo_l.lastValue || 0)) / 200);
        network.learn(1 - diff);
        photo_l.lastValue = photo_l.value;
    });

    // OUTPUTS
    const motor_l = new five.Motor({ pins: { pwm: 6, dir: 7, }, invertPWM: true, });
    const motor_r = new five.Motor({ pins: { pwm: 9, dir: 8, }, invertPWM: true, });

    network.output('motor_l', 4).on('data', (val) => {
        motor_l.speed_val = Math.floor(val * 256);
        motor_l.reverse(motor_l.speed_val);
    });
    network.output('motor_r', 4).on('data', (val) => {
        motor_r.speed_val = Math.floor(val * 256);
        motor_r.reverse(motor_r.speed_val);
    });

    // DISPLAY VIA LOCAHOST
    var display = botbrains.Toolkit.visualise(network);
    var port = display.address().port;

    console.log(`Network ready for display. Please open http://localhost:${port}`);

    setInterval(() => {
        console.log(`photo_l: ${photo_l.value}, photo_r: ${photo_r.value}, range: ${rangefinder.cm}, motor_l: ${motor_l.speed_val}, motor_r: ${motor_r.speed_val}`);
    }, 200);
});


