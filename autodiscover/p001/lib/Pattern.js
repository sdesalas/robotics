"use strict";

class Pattern extends Array {

	constructor(options) {
		super();
		this.options = options = options || {};
		// Complete history up to a certain length
		this.buffer = [];
		this.options.bufferLength = options.bufferLength || 512;
		// Level 1 = basic cycle, single loop of all sensor input
		this.sensorCycle = [];
		this.sensorHistory = {};
		this.options.history = options.history || 10;
		// Initialize
		if (options.data) {
				options.data.forEach(this.update.bind(this));
		}
	}

	update(data) {
		var deviation = 1, surprise = 0;
		var bufferLength = this.buffer.length;
		var cycleLength = this.sensorCycle.length;
		var cyclePos = bufferLength % cycleLength;
		var patternExists = cycleLength < bufferLength;
		var history = this.sensorHistory[cyclePos] = this.sensorHistory[cyclePos] || [];
		var expected = patternExists ? this.sensorCycle[0] : undefined;
		var index = this.sensorCycle.indexOf(data);
		if (index > -1) {
			// Exact match ...
			history.unshift(this.sensorCycle.splice(0, index + 1).pop());
			history.splice(this.options.history);
			deviation = 0;
		} else {
			// No match? Is there a pattern yet?
			if (patternExists) {
				deviation = this.compare(data, expected, history);
				surprise = (deviation > 0.16) ? 1 : 0;
				if (deviation < 0.4) {
					// Looks like a match ...
					history.unshift(this.sensorCycle.shift());
					history.splice(this.options.history);
				}
			}
		}
		this.sensorCycle.push(data);
		this.buffer.push(data);
		if (this.buffer.length > this.options.bufferLength) {
			this.buffer.splice(this.options.bufferLength * 0.8);
		}
		this.lastUpdate = {
			data: data,
			expected: expected,
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
	compare(actual, expected, history) {
		if (!actual || !expected) return 1;
		if (actual === expected) return 0;
		var deviation = 0,
				lenMax = actual.length;
		history = [expected].concat(history || []);
		history.forEach(pastValue => { if (pastValue.length > lenMax) lenMax = pastValue.length; });
		var step = 1/(lenMax*history.length);
		history.forEach(pastValue => {
			var diff;
			for (var i = 0; i < lenMax; i++) {
				diff = Math.abs(pastValue.charCodeAt(i) - actual.charCodeAt(i));
				if (isNaN(diff)) deviation += step;
				else if (diff > 0) deviation += step * (1 - (1 / ((diff + 2) * diff)));
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
		this.sensorCycle = [];
		delete this.lastUpdate;
	}

}

if (typeof module !== 'undefined') {
	module.exports = Pattern;
}
