"use strict";

class Pattern extends Array {

	constructor(options) {
		super();
		this.options = options = options || {};
		// Complete history up to a certain length
		this.buffer = [];
		this.options.maxLength = options.maxLength || 512;
		// Level 1 = basic cycle, single loop of all sensor input
		this.sensorCycle = [];
		// Level 2 = medium rhythms, repetition within 64 bytes
		//this.level2 = [];
		// Initialize
		if (options.data) {
				options.data.forEach(this.update.bind(this));
		}
	}

	update(data) {
		var expected = 1;
		var index = this.sensorCycle.indexOf(data);
		if (index > -1) {
			this.sensorCycle.splice(0, index + 1);
			expected = 0;
		}
		this.sensorCycle.push(data);
		this.buffer.push(data);
		this.buffer.splice(this.options.maxLength);
		return expected;
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
/*
	// Updates pattern and returns
	// difference and confidence
	// where both values are between 0 and 1.
	update(data) { // string
		var difference = 1;
		var confidence = 0;
		var byte, diffByte, arr = [];
		var pt, diffPt, vector = [];
		var offset = this.buffer.slice(-1);
		var len = data.length;
		// Compare with existing
		for (var i = 0; i < len; i++) {
				byte = data.charCodeAt(i);
				pt = byte - offset;
				diffByte = (byte - this.level1_bytes[i]) / byte || 1;
				diffPt = (pt - this.level1_vector[i]) / pt || 1;
				difference -= ((0.5 * diffByte) + (0.5 * diffPt)) / len;
				confidence += ((0.5 * diffByte) + (0.5 * diffPt)) / len;
				vector.push(pt);
				arr.push(byte);
				offset = byte;
		}
		// Add data
		Array.prototype.push.apply(this.buffer, arr);
		Array.prototype.push.apply(this.level1_bytes, arr);
		Array.prototype.push.apply(this.level1_vector, vector);
		var result = {
			difference: difference < 0 ? 0 : difference,
			confidence: confidence > 1 ? 1 : confidence
		}
		this.trim(result);
		return result;
	}

	// Look for patterns and trim accordingly
	trim(result) {
		this.buffer.splice(this.maxLength);
		if(result.difference < 0.5) {

		}
	}
*/
	clear() {
		this.offset = 0;
		this.sensorCycle = [];
		//this.level2 = [];
	}

	// Compares two patterns and returns the difference
	compare(pattern) {
		var difference = 1;
		var confidence = 0;
		return {
			difference: difference,
			confidence: confidence
		}
	}

}

if (typeof module !== 'undefined') {
	module.exports = Pattern;
}
