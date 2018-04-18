const five = require('johnny-five');
const botbrains = require('botbrains');
const sound = require('./sound');
const say = require('say');


const network = new botbrains.NeuralNetwork(120, { shape: 'sausage', learningPeriod: 6000, signalSpeed: 10 });
botbrains.Toolkit.visualise(network);

const input1 = network.input('input1');

const output_whats = network.output('whats');
const output_up = network.output('up');
const output_doc = network.output('doc');
const output_you = network.output('you');
const output_are = network.output('are');
const output_awesome = network.output('awesome');

let words = [], lastWord;

setInterval(() => {
    input1(1);
    words = [];
    console.log('----------------');
    if (Date.now() - lastWord > 5000) {
        network.unlearn();
    }
}, 1000);

output_whats.on('data', () => speak('whats'));
output_up.on('data', () => speak('up'));
output_doc.on('data', () => speak('doc'));
output_you.on('data', () => speak('you'));
output_are.on('data', () => speak('are'));
output_awesome.on('data', () => speak('awesome'));

function speak(word) {
    lastWord = Date.now();
    say.speak(word);
    words.push(word);
    // Reward it for speaking
    network.learn(.1); 
    const last2 = words.slice(-2).join(' ');
    const last3 = words.slice(-3).join(' ');
    const last4 = words.slice(-4).join(' ');
    const last6 = words.slice(-6).join(' ');
    // Reinforce particular patterns
    console.log(words.join(' '));
    if (last2 === 'you are' || last2 == 'whats up' || last2 == 'awesome doc') {
        network.learn(0.5);
        console.log('----> GOOD!');
    }
    if (last3 === 'whats up doc' || last3 === 'you are awesome') {
        network.learn();
        console.log('-----------> BONUS!');
    } else {
        network.unlearn(.01);
    }
    if (last4 === 'doc you are awesome' || last4 === 'whats up doc you') {
        network.learn();
        console.log('------------------> DOUBLE BONUS!');
        if (last6 === 'whats up doc you are awesome') {
            network.learn();
            console.log('----------------------------> TRIPLE BONUS!');
        }
    }
}
