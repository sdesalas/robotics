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
    let avg_range = 200, range = 200;
    rangefinder.on('data', () => {
        range = (range * 4 + rangefinder.cm) / 5; // moving avg of 5 measurements
        avg_range = (avg_range * 499 + range) / 500; // moving avg of 500 measurements
        if (range < 1200 && range >= 10) {
            const remoteness = range / 1200;
            network.input('rangefinder', 2)(remoteness);
            network.input('rangefinder (inverted)', 2)(1 - remoteness)
            if (Math.random() < .2) {
                let learning_rate = 1 - Math.abs(1 - (range / avg_range));
                learning_rate = learning_rate > 1 ? 1 : learning_rate;
                console.log('LEARN (DISTANCE):' + learning_rate.toFixed(2));
                network.learn(learning_rate / 50);
            }
        } else {
            // Too close, kick off avoidance reflex and unlearn recent actions
            avoidObstacle();
            network.unlearn();
        }
    });

    // LEARN - Is light increasing? Use this to drive learning.
    let light = 512, avg_light = 512;
    photo_b.on('data', () => {
        light = (light * 4 + (photo_l.value + photo_r.value) / 2) / 5; // moving avg of 5 measurements
        avg_light = (avg_light * 99 + light) / 500; // moving avg of 500 measurements
        if (Math.random() < .2) {
            let learning_rate = (light - avg_light) / avg_light;
            learning_rate = learning_rate > 1 ? 1 : learning_rate;
            console.log('LEARN (LIGHT):' + learning_rate.toFixed(2));
            network.learn(learning_rate / 50);
        }
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
        if (val < 0.4) {
            motor_l.stop();
        } else {
            motor_l.reverse();
            clearTimeout(timeout_l);
            timeout_l = setTimeout(() => motor_l.stop(), val * 2500);
        }
    });
    network.output('motor_r', 1).on('data', (val) => {
        speed_r = Math.floor(val * 256);
        if (val < 0.4) {
            motor_r.stop();
        } else {
            motor_r.reverse();
            clearTimeout(timeout_r);
            timeout_r = setTimeout(() => motor_r.stop(), val * 2500);
        }
    });

    // AVOIDANCE REFLEX (back out from obstacle)
    function avoidObstacle() {
        motor_r.forward(255);
        setTimeout(() => {
            motor_l.forward(200);
            motor_r.stop();
            setTimeout(() => motor_l.stop(), 1000);
        }, 1500);
    }

    // DISPLAY VIA LOCAHOST
    var display = botbrains.Toolkit.visualise(network);
    var port = display.address().port;

    console.log(`Network ready for display. Please open http://localhost:${port}`);

    setInterval(() => {
        console.log(`L: ${photo_l.value}, R: ${photo_r.value}, B: ${photo_b.value}, LIGHT:${Math.round(light)}/${Math.round(avg_light)} RNG: ${Math.round(range)}/${Math.round(avg_range)} => ML: ${speed_l}, MR: ${speed_r}`);
    }, 200);
});


