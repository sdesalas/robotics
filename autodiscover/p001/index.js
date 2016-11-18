"use strict";

const fs = require('fs');
const util = require('util');
const Observable = require('events');
const SensorCycle = require('./lib/SensorCycle');
const ReactionManager = require('./lib/ReactionManager');
const DeviceManager = require('./lib/DeviceManager');

const DEFAULT_DATAPATH = './data';
const DEFAULT_DELIMITER = '>';
const DEFAULT_MEMSIZE = 256;

class Mind extends Observable {

	constructor(options) {
		console.debug('new Mind()', options);
		super();
		options = options || {};
		options.dataPath = options.dataPath || DEFAULT_DATAPATH;
		options.delimiter = options.delimiter || DEFAULT_DELIMITER;
		options.memSize = options.memSize || DEFAULT_MEMSIZE;
		// Attach event listeners
		if (options.listeners) {
			for(var event in options.listeners) {
				this.on(event, options.listeners[event]);
			}
		}
		// Internal fields
		Mind.debugMode = options.debug;
		this.devices = {};
		this.options = options;
	}

	// YAWN! Time to wake up!
	wakeUp() {
		console.debug('Mind.prototype.wakeUp()', this.options);
		var options = this.options;
		this.cycle = new SensorCycle({ 
			size: options.memSize,
			delimiter: options.delimiter
		});
		this.deviceManager = new DeviceManager({
			manufacturers: options.manufacturers,
			baudRate: options.baudRate,
			devices: this.devices,
			dataPath: './data',
			listeners: {
				'ready': this.emit.bind(this, 'ready'),
				'deviceready': this.emit.bind(this, 'deviceready'),
				'deviceremoved': this.emit.bind(this, 'deviceremoved'),
				'offline': this.emit.bind(this, 'offline'),
				'data': this.emit.bind(this, 'data'),
			}
		});
		this.reactionManager = new ReactionManager({
			dataPath: options.dataPath,
			delimiter: options.delimiter
		});
		this.on('data', this.data.bind(this));
		this.idle();
		return this;
	}

	// Reflection loop
	idle() {
		this.reflect();
		this.fulfill();
		setTimeout(this.idle.bind(this), 500);
	}

	reflect() {
		// Match input to known patterns
		// Query options for a device
		// Query option for a device (if options known)
	}

	fulfill() {
		// Curiosity: Trial option for a device
		// Seek positive patterns / feedback.
		// Needs: Charge battery, gain knowledge, approval
	}

	// Aggregated incoming data pipeline for all the sensors.
	// This gets called pretty frequently so should be optimised!
	data(data) {
		console.debug('Mind.prototype.data()', data);
		var update = this.cycle.update(data).lastUpdate;
		if (update && update.surprise) { 
			// Surprise ===> Change in input cycle.
			// Do we have history to match on?
			// Let the reaction manager determine if we should do something.
			var action = this.reactionManager.interpret(update.history, update.source);
			if (action) {
				this.perform(action);
			}
		}
		return this;
	}

	// An action is a string that contains information about
	// the device, virtual pin (actuator), and data to send to it
	// for example:
	// this.perform("mf.r>1"); 		//--> {device: "mf", vpin: "r", data: "1" } // Turns on Red LED
	// this.perform("yA.b>&a|63"); 	//--> {device: "yA", vpin: "b", data: "&a|63" } // Runs 2 tones on buzzer
	perform(action) {
		console.debug('Mind.prototype.perform()', action);
		var delimiter = this.options.delimiter;
		if (action && action.indexOf(delimiter)) {
			// Find device & write to it
			var device = Object.keys(this.devices).filter(id => action.indexOf(id) === 0).pop();
			if (device) {
				//device.write(action.substr(3));
				console.log('device.write()', action.substr(3));
			}
		}
	}
}


console.debug = function() {
	if (Mind.debugMode) {
		console.log.apply(console, arguments);
	}
}

module.exports = Mind;
