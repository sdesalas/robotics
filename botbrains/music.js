const five = require('johnny-five');
const botbrains = require('botbrains');
const sound = require('./sound');


const network = new botbrains.NeuralNetwork(120, {
    shape: 'drum', 
    learningRate: .1,
    signalSpeed: 10
});
botbrains.Toolkit.visualise(network);

// const random1 = network.input('random1');
// const random2 = network.input('random2');
// const random3 = network.input('random3');

// const output_C1 = network.output('C1');
// const output_D1 = network.output('D1');
// const output_E1 = network.output('E1');
// const output_F1 = network.output('F1');
// const output_G1 = network.output('G1');
// const output_A1 = network.output('A1');
// const output_B1 = network.output('B1');

// output_C1.on('data', duration => sound.play(1055, duration * 1000));
// output_D1.on('data', duration => sound.play(940, duration * 1000));
// output_E1.on('data', duration => sound.play(837, duration * 1000));
// output_F1.on('data', duration => sound.play(790, duration * 1000));
// output_G1.on('data', duration => sound.play(705, duration * 1000));
// output_A1.on('data', duration => sound.play(627, duration * 1000));
// output_B1.on('data', duration => sound.play(558, duration * 1000));

// output_C1.on('data', () => network.learn() && console.log('C1 -> Good!'));
// output_D1.on('data', () => network.learn() && console.log('D1 -> Good!'));
// output_E1.on('data', () => network.unlearn() && console.log('E1 -> Not Good!'));
// output_F1.on('data', () => network.learn() && console.log('F1 -> Good!'));
// output_G1.on('data', () => network.learn() && console.log('G1 -> Good!'));
// output_A1.on('data', () => network.unlearn() && console.log('A1 -> Not Good!'));
// output_B1.on('data', () => network.unlearn() && console.log('A1 -> Not Good!'));

// const interval = 500; // ms

// setInterval(() => {

//     //process.stdout.write('\033c');

//     if (true) {
//         random1(Math.random());
//         random2(Math.random());
//         random3(Math.random());
//     }


// }, interval);


