"use strict";

class SensorCycle {

	constructor(options) {
		//super();

		// Buffer contains raw data input
		this.buffer = []; // raw data input
		this.pattern = []; // looping array of sensor keys
		this.history = {}; // indexed by sensor keys and contains array of payloads
		this.patternExists = false;
		this.options = options = options || {};
		this.options.bufferSize = (options.size || 256) / 8;
		this.options.historySize = this.options.bufferSize / 2;
		this.options.delimiter = options.delimiter || '>';
		// Initialize
		if (options.data) {
				options.data.forEach(this.update.bind(this));
		}
	}

	update(data) {
		var options = this.options;
		var deviation = 1, surprise = 0;
		// "S7L>0" --> sensor="S7L", payload="0"
		var dataparts = data.split(options.delimiter);
		if (dataparts.length !== 2) {
			console.warn('Delimiter "%s" missing in message "%s"', options.delimiter, data);
			return this;
		}
		var source = dataparts.shift();
		var payload = dataparts.join('');
		// History is hashed by source
		// it contains payloads only (detects deviation in sensor input)
		var history = this.history[source] = this.history[source] || [];
		var expectedPayload = history[history.length - 1];
		if (expectedPayload === payload) {
			deviation = 0;
		} else if (expectedPayload === undefined){
			deviation = 1;
		} else {
			deviation = this.compare(payload, history);
			if (deviation > 0.33) surprise = 1;
		}
		// Pattern contains sources only (detects cycle changes)
		var expectedSource = this.patternExists ? this.pattern[0] : undefined;
		if (this.patternExists && expectedSource !== source) {
			// Sensor input intermittent
			surprise = 1;
			expectedPayload = this.history[expectedSource][0];
		}
		var index = this.pattern.indexOf(source);
		if (index !== -1) {
			this.patternExists = true;
			this.pattern.splice(0, index + 1);
		}
		// Append to history/pattern/buffer
		this.pattern.push(source);
		history.push(payload);
		while (history.length > options.historySize) { history.shift(); }
		this.buffer.push(data);
		while (this.buffer.length > options.bufferSize) {	this.buffer.shift(); }
		// Save update result
		this.lastUpdate = {
			data: data,
			source: source,
			payload: payload,
			expected: expectedSource ? [expectedSource, options.delimiter, expectedPayload].join('') : undefined,
			deviation: deviation,
			surprise: surprise
		};
		return this;
	}

	// Compare two strings and returns a deviation between 0 and 1
	// 'abcd' vs 'abcd' = 0;
	// 'abcd' vs 'abdd' = 0.25;
	// 'abcd' vs 'abdc' = 0.5;
	// 'abdc' vs 'bdca' = 1;
	compare(actual, expected) {
		if (!actual || !expected) return 1;
		if (actual === expected) return 0;
		var history = expected instanceof Array ? expected : [expected],
				expected = history[0],
				deviation = 0,
				lenMax = actual.length;
		history.forEach(pastValue => { if (pastValue.length > lenMax) lenMax = pastValue.length; });
		var step = 1/(lenMax*history.length);
		history.forEach(pastValue => {
			for (var i = 0; i < lenMax; i++) {
				if (pastValue.charCodeAt(i) !== actual.charCodeAt(i))
					deviation += step;
			}
		});
		return deviation;
	}

	hash(str) {
    var hash = 0;
    if (str.length == 0) return hash;
    for (var i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
	}

	clear() {
		this.buffer = [];
		this.pattern = [];
		delete this.lastUpdate;
	}

}

if (typeof module !== 'undefined') {
	module.exports = SensorCycle;
}
