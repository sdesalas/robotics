

const botbrains = require('botbrains');
const sound = require('./sound');

const network = new botbrains.NeuralNetwork(220, {
    shape: 'sausage', 
    learningRate: .1,
    signalSpeed: 10,
    learningPeriod: 10000
});
botbrains.Toolkit.visualise(network);

const twinkle = 'C-C-G-G-A-A-G';

const input1 = network.input('input1');
const input2 = network.input('input2');
const input3 = network.input('input3');

const output_C1 = network.output('C1');
const output_C2 = network.output('C2');
const output_D1 = network.output('D1');
const output_E1 = network.output('E1');
const output_F1 = network.output('F1');
const output_G1 = network.output('G1');
const output_G2 = network.output('G2');
const output_A1 = network.output('A1');
const output_B1 = network.output('B1');

output_C1.on('data', duration => sound.play(1055, duration * 1000));
output_C2.on('data', duration => sound.play(1055, duration * 1000));
output_D1.on('data', duration => sound.play(940, duration * 1000));
output_E1.on('data', duration => sound.play(837, duration * 1000));
output_F1.on('data', duration => sound.play(790, duration * 1000));
output_G1.on('data', duration => sound.play(705, duration * 1000));
output_G2.on('data', duration => sound.play(705, duration * 1000));
output_A1.on('data', duration => sound.play(627, duration * 1000));
output_B1.on('data', duration => sound.play(558, duration * 1000));

output_C1.on('data', () => learn('C'));
output_C2.on('data', () => learn('C'));
output_D1.on('data', () => learn('D'));
output_E1.on('data', () => learn('E'));
output_F1.on('data', () => learn('F'));
output_G1.on('data', () => learn('G'));
output_G2.on('data', () => learn('G'));
output_A1.on('data', () => learn('A'));
output_B1.on('data', () => learn('B'));


let lastNote, history = '';
function learn(note) {

    lastNote = Date.now();
    history = history + note;
    history = history.substr(-twinkle.length);

    loop1:
    for(let chunkSize = twinkle.length; chunkSize > 2; chunkSize--) {
        const chunk = history.substr(-chunkSize);
        loop2:
        for(let offset = 0; offset < twinkle.length; offset++) {
            if (offset + chunk.length > twinkle.length) break; 
            // Check if it matches the pattern
            const pattern = twinkle.substr(offset).substr(0, chunkSize);
            if (pattern === chunk) {
                // Reward more if match is longer
                console.log(note + ' -> GOOD!');
                console.log(`"${pattern}" -> WE HAVE A MATCH!`);
                network.learn(chunkSize*(4/twinkle.length));
                break loop1;
            }
        }
        if (chunkSize === 3) {
            network.unlearn(0.5);
            console.log(note + ' -> NO MATCH!');
        }
    }
}


const interval = 500; // ms

setInterval(() => input2(1), 3000);

setInterval(() => {

    // Avoid inactivity
    if (Date.now() - lastNote > 3000) {
        network.unlearn();
    }

    // Add timing
    history = history + '-';
    history = history.substr(-twinkle.length);

}, interval);