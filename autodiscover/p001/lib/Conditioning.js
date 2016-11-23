"use strict";

const fs = require('fs');
const Observable = require('events');
const Association = require('./Association');
const Pattern = require('./Pattern');
const Utils = require('./Utils');
const Mind = require('../');

// 
// Manages the strengthening relationships between inputs and outputs
// (ie learning from positive and negative experiences).
// 
class Conditioning extends Observable {

	constructor(options) {
		super();
		options = options || {};
		this.delimiter = options.delimiter || Mind.delimiter;
		this.devices = options.devices || {};
		this.dataPath = options.dataPath;
		this.memory = options.memory || {};
		this.memory.actions = {};
		this.memory.reactions = this.memory.reactions || {};
		this.memory.consequences = this.memory.consequences || {};
		this.reactions = new Association(this.memory.reactions, this.delimiter);
		this.consequences = new Association(this.memory.consequences, this.delimiter);
		this.options = options;
		// Attach event listeners
		if (options.listeners) {
			for(var event in options.listeners) {
				this.on(event, options.listeners[event]);
			}
		}
		this.on('action', (cmd) => this.memory.actions[cmd] = Utils.timestamp())
	}

	// Surprise ===> Change in input cycle.
	// Did I do something recently? 
	// Was change in pattern due to own action?
	// If due to own action, is it as expected?
	// Otherwise determine if we should do something.
	surprise(update) {
		console.debug('Conditioning.prototype.surprise()', update);
		update = update || {};
		var history = update.history;
		var source = update.source;
		if (source && history) {
			var pattern = Pattern.load(history);
			if (!this.isExpected(pattern, source)) {
				var output = this.getReaction(pattern, source);
				if (output && output.cmd) {
					this.emit('action', output.cmd);
				}
				this.save();
			}
		}
	}

	isExpected(pattern, source) {
		console.debug('Conditioning.prototype.isExpected()', pattern && pattern.toString(), source);
		if (pattern && source) {
			var input = this.consequences.match(pattern, source);
			if (input && input.rels && input.rels.length) {
				// Check recent actions (last minute)
				var cutoff = Utils.timestamp() - Utils.randomLHS(60 * 1000);
				var expected = input.rels.filter(rel => rel.output && rel.lastUsed > cutoff);
				if (expected.length) {
					// As expected? Strengthen expectations and exit.
					expected.forEach(rel => {
						rel.affinity += Utils.random(0.25); 
						if (rel.affinity > 1) rel.affinity = 1;
					});
					return true;
				}
			}
			// Unexpected? Take notice.
			input = this.consequences.unrecognized(pattern, source);
			this.mapConsequences(input);
		}
		return false;
	}

	mapConsequences(input) {
		console.debug('Conditioning.prototype.mapConsequences()');
		var cutoff = Utils.timestamp() - Utils.randomLHS(60 * 1000),
			actions = this.memory.actions;
		if (!input) return;
		Object.keys(actions)
			.filter(action => actions[action] > cutoff)
			.forEach(action => {
				var output = this.consequences.output(action);
				var factor = 1 - (actions[action] - cutoff) / (60 * 1000);
				this.consequences.link(output, input, undefined, factor * 2);
			});
	}

	getReaction(pattern, source) {
		console.debug('Conditioning.prototype.getReaction()');
		var output, relationship;
		if (pattern && source) {
			// Ok... do we need to react?
			var input = this.reactions.match(pattern, source);
			if (!input) input = this.reactions.unrecognized(pattern, source);
			relationship = this.reactions.derive(input);
			output = relationship && relationship.output;
			console.log('Reaction related to input: ', output);
			// No reaction to input? 
			if (!output && Math.random() < 0.2) {
				output = this.reactions.random();
				console.log('Reaction at random: ', output);
			}
			// Process relationship
			if (output || input) {
				this.reactions.link(output, input, relationship);
			}
		}
		return output;
	}

	// Try a new output;
	experiment() {
		console.debug('Conditioning.prototype.experiment()');
		var output = this.reactions.random(this.devices);
		if (output && output.cmd) {
			this.reactions.link(output);
			this.emit('action', output.cmd);
		}
	}

	// Save to file
	save() {
		console.debug('Conditioning.prototype.save()');
		if (this.dataPath) {
			fs.writeFile(this.dataPath + '/memory.json', JSON.stringify(this.memory, null, 2));
		}
	}

}

if (typeof module !== 'undefined') {
  module.exports = Conditioning;
}
