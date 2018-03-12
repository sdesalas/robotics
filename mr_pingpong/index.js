const fs = require('fs');
const five = require('johnny-five');
const botbrains = require('botbrains');
const EventEmitter = require('events');
const display = require('./display');

const board = new five.Board({ port: process.argv[2] || ''});

board.on('ready', () => {

    const network = new botbrains.NeuralNetwork(220, { signalSpeed: 10, shape: 'tube' });

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
    const rangefinder = new five.Proximity({ pin: 2, controller: "HCSR04" });
    let avg_range = 200, range = 200;
    rangefinder.on('data', () => {
        range = (range * 2 + rangefinder.cm) / 3; // moving avg of 3 measurements
        avg_range = (avg_range * 499 + range) / 500; // moving avg of 500 measurements
        if (range < 20) {
            // Too close, kick off avoidance reflex and unlearn recent actions
            avoidObstacle();
        }
        else {
            // Use ranges up to 6m, higher ones are unreliable
            range = range > 600 ? 600 : range;
            const remoteness = range / 600;
            network.input('rangefinder', 2)(remoteness);
            network.input('rangefinder (inverted)', 2)(1 - remoteness)
            if (Math.random() < .1) {
                let learning_rate = 1 - Math.abs(1 - (range / avg_range));
                learning_rate = learning_rate > 1 ? 1 : learning_rate;
                learning_rate = learning_rate < -1 ? -1 : learning_rate;
                learn(learning_rate / 10, 'maintain distance');
            }
        }
    });

    // LEARN - Is light increasing? Use this to drive learning.
    let light = 512, avg_light = 512;
    photo_b.on('data', () => {
        light = (light * 2 + (photo_l.value + photo_r.value) / 2) / 3; // moving avg of 2 measurements
        avg_light = (avg_light * 499 + light) / 500; // moving avg of 500 measurements
        if (Math.random() < .2) {
            let learning_rate = -1 * ((light - avg_light) / avg_light);
            learning_rate = learning_rate < -1 ? -1 : learning_rate;
            learn(learning_rate / 5, 'seek light');
        }
    });

    // OUTPUTS
    let timeout_l, speed_l = 0;
    let timeout_r, speed_r = 0;
    const motor_l = new five.Motor({ pins: { pwm: 6, dir: 7, }, invertPWM: true, });
    const motor_r = new five.Motor({ pins: { pwm: 9, dir: 8, }, invertPWM: true, });
    let boredom, last_action = new Date().getTime();
    motor_l.on('stop', () => setTimeout(() => speed_l = 0, 500));
    motor_r.on('stop', () => setTimeout(() => speed_r = 0, 500));

    motor_l.stop();
    motor_r.stop();

    network.output('motor_l', 1).on('data', (val) => {
        speed_l = Math.floor(val * 256);
        last_action = new Date().getTime();
        motor_l.reverse(220);
        clearTimeout(timeout_l);
        timeout_l = setTimeout(() => motor_l.stop(), val * 2500);
        if (boredom > 0.2) learn(boredom, 'act when bored'); // reward movement when bored
    });
    network.output('motor_r', 1).on('data', (val) => {
        speed_r = Math.floor(val * 256);
        last_action = new Date().getTime();
        motor_r.reverse(220);
        clearTimeout(timeout_r);
        timeout_r = setTimeout(() => motor_r.stop(), val * 2500);
        if (boredom > 0.2) learn(boredom, 'act when bored'); // reward movement when bored
    });

    // LEARN + DISPLAY
    function learn(rate, reason) {
        let stars = Math.ceil(Math.abs(rate * 50));
        if (stars > 20) stars = 20;
        const color = rate > 0 ? 'green' : 'red';
        display.value(`LEARN (${reason})`, Array(stars).fill().join('*'), color);
        network.learn(rate);
    }

    // AVOIDANCE REFLEX (back out from obstacle)
    let bravery = 0, stress = 0, last_avoidance = 0;
    function avoidObstacle() {
        speed_r = 255;
        motor_r.forward(speed_r);
        last_action = last_avoidance = new Date().getTime();
        setTimeout(() => {
            speed_l = 200;
            motor_l.forward(speed_l);
            motor_r.stop();
            setTimeout(() => motor_l.stop(), 1000);
        }, 1500);
    }

    // FEELINGS
    // 1. boredom gets higher if there is no recent action
    // 2. No problems means things are good so learn from boredom
    setInterval(() => {
        const now = new Date().getTime();
        boredom = (now - last_action) / 30000;
        boredom = boredom > 1 ? 1 : boredom;
        stress = 1 - ((now - last_avoidance) / 30000);
        stress = stress < 0 ? 0 : stress;
        bravery = 1 - stress;
        network.input('boredom')(boredom);
        network.input('stress')(stress);
        network.input('bravery')(bravery)
        if (stress > 0.5) {
            learn((-1 * stress) / 5, 'stress');
        } else {
            learn(bravery / 5, 'bravery')
        }
    }, 1000);

    // DISPLAY VIA LOCAHOST
    const visualization = botbrains.Toolkit.visualise(network);

    //console.log(`Network ready for display. Please open http://localhost:${visualization.address().port}`);

    const synapses = network.synapses.length;

    setInterval(() => {
        botbrains.Toolkit.getStats(stats => {
            const now = new Date().getTime();
            const strength = network.strength;
            const cpu = stats.cpu;
            const mem = stats.mem;
            display
                .clear()
                .blank()
                .value('PHOTO (L)', photo_l.value || 0)
                .value('PHOTO (R)', photo_r.value || 0)
                .value('PHOTO (B)', photo_b.value || 0)
                .gauge('DARKNESS', light, avg_light, avg_light*2, `${Math.round(light)}/${Math.round(avg_light)}`)            
                .blank()
                .gauge('RANGE', range, avg_range*2, avg_range*2, `${Math.round(range)}/${Math.round(avg_range)} cm`)
                .blank()
                .gauge('BOREDOM', boredom, 0.8, 1, `${Math.round(boredom * 100)}%`)
                .gauge('STRESS', stress, 0.8, 1, `${Math.round((stress) * 100)}%`)
                .gauge('BRAVERY', bravery, 0.8, 1, `${Math.round((bravery) * 100)}%`)
                .blank()
                .gauge('CPU', cpu, 0.8, 1, `${Math.round(cpu * 100)}%`)
                .gauge('RAM', mem, 0.8, 1, `${Math.round(mem * 100)}%`)
                .blank()
                .gauge('MOTOR (L)', speed_l, 140, 256, speed_l)
                .gauge('MOTOR (R)', speed_r, 140, 256, speed_r)
                .blank()
                .gauge('NETWORK STRENGTH', strength, 0.8, 1, `${Math.round(strength * 100)}% active synapses`)
                .blank()
                .text('-------------------------------')
                .blank();
        });

    }, 200);

    process.stdin.resume();
    process.on('SIGINT', () => {
        // cleanup
        motor_l.stop();
        motor_r.stop();
        process.exit();
    });
});


