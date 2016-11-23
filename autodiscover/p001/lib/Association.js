"use strict";

const Pattern = require('./Pattern');
const Utils = require('./Utils');
const Mind = require('../');

class Association {

	constructor(options, delimiter) {
		options = options || {};
		this.delimiter = delimiter || Mind.delimiter;
		this.inputs = options.inputs = options.inputs || {};
		this.outputs = options.outputs = options.outputs || {};
		this.rels = options.rels = options.rels || [];
	}

	// Finds similar input histories
	match(pattern, source) {
		console.debug('Association.prototype.match()', source, pattern && pattern.toString());
		if (source && pattern instanceof Pattern) {
			var history = pattern.toString();
			var id = source + this.delimiter + pattern.vectorCode;
			var match = this.inputs[id];
			if (match && match.matches) {
				// Add link to existing
				if (match.history !== history && match.matches.indexOf(history) < 0)
					match.matches.push(history);
				return match;
			}
		}
		// undefined => no match
	}

	// Creates new
	unrecognized(pattern, source) {
		console.debug('Association.prototype.unrecognized()', source, pattern && pattern.toString());
		if (source && pattern instanceof Pattern) {
			var vectorCode = pattern.vectorCode;
			var id = source + this.delimiter + vectorCode;
			return this.inputs[id] = this.inputs[id] || {
				id: id,
				source: source,
				vectorCode: vectorCode,
				history: pattern.toString(),
				matches: [],
				rels: []
			};
		}
	}

	random(devices) {
		console.debug('Association.prototype.random()', devices && devices.length);
		var output;
		if (devices && Object.keys(devices).length) {
			var device = Utils.random(devices);
			var command = device.randomCommand();
			if (device && command) {
				output = this.output(device.id + '.' + command);
			}
			return output;
		}
	}

	output(cmd) {
		return this.outputs[cmd] = this.outputs[cmd] || {
			cmd: cmd,
			rels: []
		};
	}

	derive(input) {
		console.debug('Association.prototype.derive()', input && input.id);
		if (input && input.rels) {
			var indexes = input.rels
				.reduce(function(accum, relationship, index) {
					var factor = Math.pow(Math.floor(relationship.affinity * 20), 3);
					// Affinity levels range between -1 and +1;
					// Negative ones are excluded, while positive ones 
					// are made more likely exponentially 
					// depending on how close to +1 they are.
					// ie:
					// affinity +1.0 = 8000x (weight)
					// affinity +.75 = 3375x 
					// affinity +.50 = 1000x
					// affinity +.25 = 125x
					while(factor-- > 0) {
						accum.push(index);
					}
					return accum;
				}, []);
			return input.rels[Utils.random(indexes)];
		}
	}

	link(output, input, relationship, factor) {
		console.debug('Association.prototype.link()', input, output, relationship);
		if (!relationship) {
			// No matched relationship? Try determine from available ones;
			relationship = this.rels.filter(r => {
				return (input && output) ? 
					// Both available? Match on both
					input.id === r.input && output.cmd === r.output :
					// Only one available? Match that one
					input && input.id === r.input || output && output.cmd === r.output;
			}).pop();
		}
		if (!relationship) {
			// Still no match? Then create one and add to list
			relationship = { input: input && input.id, output: output && output.cmd, affinity: 0, used: 0 };
			this.rels.push(relationship);
		}
		relationship.lastUsed = Utils.timestamp();
		relationship.affinity += Utils.random(0.25) * (factor || 1);
		relationship.used += 1;
		if (relationship.affinity > 1) relationship.affinity = 1;
		if (input && input.rels && input.rels.indexOf(relationship) < 0) {
			input.rels.push(relationship);
		}
		if (output && output.rels && output.rels.indexOf(relationship) < 0) {
			output.rels.push(relationship);
		}
	}

}

if (typeof module !== 'undefined') {
  module.exports = Association;
}
