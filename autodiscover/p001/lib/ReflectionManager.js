"use strict";

const fs = require('fs');
const Observable = require('events');
const Pattern = require('./Pattern');
const Utils = require('./Utils');
const Mind = require('../');

// 
// Queries devices and revises memory.
// 
class ReflectionManager extends Observable {

	constructor(options) {
		console.log('new ReflectionManager()');
		super();
		options = options || {};
		this.memory = options.memory || {};
		this.devices = options.devices || {};
		this.delimiter = options.delimiter || DEFAULT_DELIMITER;
	}

	reflect() {
		console.debug('ReflectionManager.prototype.reflect()');
		// Match input to known patterns
		// Query options for a device
		// Query option for a device (if options known)
		var random = Utils.random(100);
		var noOutputs = this.memory.outputs && Object.keys(this.memory.outputs).length === 0;
		if (random < 10 || noOutputs) {
			// No known outputs for attached devices?
			// This should be a priority, find some
			// Query action examples for random device
			return this.queryActions();
		}
	}

	queryActions(device, action) {
		console.debug('ReflectionManager.prototype.queryActions()', device && device.id, action);
		if (device && device.write) { 
			if (action) {
				return device.write('?' + this.delimiter + action);
			}
			return device.write('?')
		} else {
			// If no device requested
			// then pick one at random
			device = Utils.random(this.devices);
			if (device) {
				// If device is available try
				// check one of its actions at random.
				action = Utils.random(Object.keys(device.actions));
				this.queryActions(device, action);
			}
		}
	}

	fulfill() {
		console.debug('ReflectionManager.prototype.fulfill()');
		// Curiosity: Trial option for a device
		// Seek positive patterns / feedback.
		// Needs: Charge battery, gain knowledge, approval
		var random = Utils.random(100);
		if (random < 5) {
			// Lets just try something new..
			this.emit('react');
		}
	}

}


if (typeof module !== 'undefined') {
  module.exports = ReflectionManager;
}
