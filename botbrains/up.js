const five = require('johnny-five');
const botbrains = require('botbrains');
const say = require('say');

const board = new five.Board({port: process.argv[2] || '' });

board.on('ready', () => {

    const network = new botbrains.NeuralNetwork(60, {
        shape: 'drum',
        retentionRate: 0.99 // Improve long term memory
    });
    //network.join(network, 0.5, 0.3)
    botbrains.Toolkit.visualise(network);

    const input_X = network.input('X');
    const input_X_inverse = network.input('X_inverse');
    const input_Z = network.input('Z');
    const input_Z_inverse = network.input('Z_inverse');
    
    // IMU (Innertia Measurement Unit - Accelerometer + Magnetometer)
    const sensor = new five.IMU({ controller: "LSM303C" });
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

            if (z < -500) direction = 'up'; 
            else if (z > 500) direction = 'down';
            else if (x < -500) direction = 'left';
            else if (x > 500) direction = 'right';

            //console.log("  direction: " + direction);

            input_X(x / 1000);
            input_X_inverse(-1 * x / 1000);
            input_Z(z / 1000);
            input_Z_inverse(-1 * z / 1000);
        }

    });

    const output_UP = network.output('UP');
    const output_DOWN = network.output('DOWN');
    const output_LEFT = network.output('LEFT');
    const output_RIGHT = network.output('RIGHT');

    output_UP.on('data', duration => speak('up'));
    output_DOWN.on('data', duration => speak('down'));
    output_LEFT.on('data', duration => speak('left'));
    output_RIGHT.on('data', duration => speak('right'));

    let lastTime;
    function speak(word) {
        say.speak(word);
        lastTime = Date.now();
        if (word === direction) {
            console.log(word + ': GOOD!');
            network.learn();
        } else {
            console.log(word + ': NOT GOOD!');
            network.unlearn();
        }
    }

    // If quiet for 3s then somethings wrong
    setInterval(() => {
        if (Date.now() - lastTime > 3000) {
            network.unlearn();
        }
    }, 500);

});


