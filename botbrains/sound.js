const createSpeaker = require('audio-speaker/direct');
const createGenerator = require('audio-generator/direct');

module.exports = {
    play(frequency, duration = 1000) {
        if (this.playing) {
            this.output(null);
        } 
        this.output = createSpeaker();
        this.generate = createGenerator(time => Math.sin(time * Math.PI * 2 * frequency), (duration / 1000) + 0.1);
        if (!this.playing) {
            this.loop();
            this.playing = true;
        }
    },

    loop(err, buf) {
        const chunk = this.generate && this.generate();
        if (chunk) {
            this.output(chunk, this.loop.bind(this)); 
        } else {
            this.playing = false;
        }
    },

    stop() {
        this.output && this.output.end();
        this.generate = undefined;
    }
}