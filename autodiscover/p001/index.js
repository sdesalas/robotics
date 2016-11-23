"use strict";

const fs = require('fs');
const util = require('util');
const Observable = require('events');
const SensorCycle = require('./lib/SensorCycle');
const Conditioning = require('./lib/Conditioning');
const ReflectionManager = require('./lib/ReflectionManager');
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
		this.memory = {};
		this.options = options;
	}

	static get delimiter() {
		return DEFAULT_DELIMITER;
	}

	// YAWN! Time to wake up!
	wakeUp() {
		console.debug('Mind.prototype.wakeUp()', this.options);
		var options = this.options;
		this.cycle = new SensorCycle({ 
			size: options.memSize,
			delimiter: options.delimiter,
			listeners: {
				'surprise': this.emit.bind(this, 'surprise')
			}
		});
		this.deviceManager = new DeviceManager({
			manufacturers: options.manufacturers,
			baudRate: options.baudRate,
			delimiter: options.delimiter,
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
		this.conditioning = new Conditioning({
			memory: this.memory,
			devices: this.devices,
			dataPath: options.dataPath,
			delimiter: options.delimiter,
			listeners: {
				'action': this.emit.bind(this, 'action')
			}
		});
		this.reflectionManager = new ReflectionManager({
			memory: this.memory,
			devices: this.devices,
			delimiter: options.delimiter,
			listeners: {
				'experiment': this.conditioning.experiment.bind(this.conditioning)
			}
		});
		this.on('data', this.data.bind(this));
		this.on('surprise', this.conditioning.surprise.bind(this.conditioning));
		this.on('action', this.action.bind(this));
		this.idle();
		return this;
	}

	// Reflection loop
	idle() {
		this.reflectionManager.reflect();
		this.reflectionManager.fulfill();
		setTimeout(this.idle.bind(this), 500);
	}

	// Aggregated incoming data pipeline for all the sensors.
	// This gets called pretty frequently so should be optimised!
	data(data) {
		console.debug('Mind.prototype.data()', data);
		var update = this.cycle.update(data).lastUpdate;
		if (update && update.surprise) { 
			this.emit('surprise', update);
		}
		return this;
	}

	// An action is a string that contains information about
	// the device, virtual pin (actuator), and data to send to it
	// for example:
	// this.action("mf.r>1"); 		//--> {device: "mf", vpin: "r", data: "1" } // Turns on Red LED
	// this.action("yA.b>&a|63"); 	//--> {device: "yA", vpin: "b", data: "&a|63" } // Runs 2 tones on buzzer
	action(action) {
		console.warn('Mind.prototype.action()', action);
		var delimiter = this.options.delimiter;
		if (action && action.indexOf(delimiter)) {
			// Find device & write to it
			var deviceId = Object.keys(this.devices).filter(id => action.indexOf(id) === 0).pop();
			if (deviceId) {
				this.devices[deviceId].write(action.substr(3));
				//console.log('device.write()', action.substr(3));
			}
		}
	}
}


console.debug = function() {
	if (Mind.debugMode) {
		console.log.apply(console, arguments);
	}
}


if (typeof module !== 'undefined') {
	module.exports = Mind;
}

