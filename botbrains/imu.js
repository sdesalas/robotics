const five = require('johnny-five');
const botbrains = require('botbrains');
const sound = require('./sound');


const board = new five.Board({port: process.argv[2] || '' });

board.on('ready', () => {

    const network = new botbrains.NeuralNetwork(200, {
        shape: 'sausage', 
        learningRate: .1, 
        signalSpeed: 10, 
        learningPeriod: 2000 
    });
    //network.join(network, 0.5, 0.3)
    botbrains.Toolkit.visualise(network);

    const input_accX = network.input('accX');
    const input_accY = network.input('accY');
    const input_accZ = network.input('accZ');
    
    // IMU (Innertia Measurement Unit - Accelerometer + Magnetometer)
    const sensor = new five.IMU({ controller: "LSM303C", freq: 500 });
    let direction;

    sensor.on("change", () => {

        if (sensor.accelerometer) {
    
            const x = sensor.accelerometer.x,
                y = sensor.accelerometer.y,
                z = sensor.accelerometer.z,
                acceleration = sensor.accelerometer.acceleration;

            // process.stdout.write('\033c');
            // console.log("Accelerometer");
            // console.log("  x            : ", x);
            // console.log("  y            : ", y);
            // console.log("  z            : ", z);
            // console.log("  acceleration : ", acceleration);
            // console.log("--------------------------------------");

            if (Math.abs(x) > 500) direction = 'x';
            else if (Math.abs(y) > 500) direction = 'y';
            else if (Math.abs(z) > 500) direction = 'z'; 

            console.log("  direction: " + direction);

            input_accX(Math.abs(x) / 1000);
            input_accY(Math.abs(y) / 1000);
            input_accZ(Math.abs(z) / 1000);
        }

    });
    
    const output_C1 = network.output('C1');
    const output_D1 = network.output('D1');
    const output_E1 = network.output('E1');
    const output_F1 = network.output('F1');
    const output_G1 = network.output('G1');
    const output_A1 = network.output('A1');
    const output_B1 = network.output('B1');

    output_C1.on('data', duration => sound.play(1055, duration * 1000));
    output_D1.on('data', duration => sound.play(940, duration * 1000));
    output_E1.on('data', duration => sound.play(837, duration * 1000));
    output_F1.on('data', duration => sound.play(790, duration * 1000));
    output_G1.on('data', duration => sound.play(705, duration * 1000));
    output_A1.on('data', duration => sound.play(627, duration * 1000));
    output_B1.on('data', duration => sound.play(558, duration * 1000));

    // output_C1.on('data', () => (direction === 'x') ? moreOf() : lessOf());
    // output_D1.on('data', () => (direction === 'x') ? moreOf() : lessOf());
    // output_G1.on('data', () => (direction === 'y') ? moreOf() : lessOf());
    // output_F1.on('data', () => (direction === 'z') ? moreOf() : lessOf());
    // output_A1.on('data', () => (direction === 'z') ? moreOf() : lessOf());
    // output_B1.on('data', () => (direction === 'z') ? moreOf() : lessOf());
    
    // let success = 0, fail = 0;

    // function moreOf() {
    //     network.learn();
    //     console.log('GOOD');
    //     //success++;
    //     //console.log('GOOD, success: ' + Math.floor(100 * success / (success+fail)) + '%');
    // }

    // function lessOf() {
    //     network.unlearn(.2);
    //     console.log('NOT GOOD');
    //     //fail++;
    //     //console.log('NOT GOOD, success: ' + Math.floor(100 * success / (success+fail)) + '%');
    // }

});


