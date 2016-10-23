"use strict";

const fs = require('fs');
const path = require('path');
const util = require('util');
const fse = require('fs-extra');
const Observable = require('events');
const SerialPort = require('serialport');
const readline = SerialPort.parsers.readline('\n');
const Device = require('./lib/Device');
const SensorCycle = require('./lib/SensorCycle');

class Nala extends Observable {

	constructor(options) {
		super();
		options = options || {};
		options.baudRate = options.baudRate || 115200;
		options.memSize = options.memSize || 512;
		options.manufacturers = options.manufacturers || /(wch)|(arduino)|(1a86)/i;
		// Attach event listeners
		if (options.listeners) {
			for(var eventName in options.listeners) {
				this.on(eventName, options.listeners[eventName]);
			}
		}
		// Internal fields
		Nala.debugMode = options.debug;
		this.devices = {};
		this.memory = {
			input: {},
			output: {},
			rel: {}
		};
		this.cycle = new SensorCycle({ size: 256 });
		this.options = options;
	}

	// YAWN! Time to wake up!
	// Check the USB ports.. Do we have something that looks interesting?
	// If so then connect to it
	wakeUp() {
		console.debug('Nala.prototype.wakeUp()', this.options);
		var manufacturers = this.options.manufacturers;
		SerialPort.list((function(err, ports) {
			console.debug('%d USB ports available.', ports.length, ports);
			ports
				.filter((p) => p.manufacturer && !!p.manufacturer.match(manufacturers))
				.map(this.parse.bind(this))
				.filter((p) => !!p)
				.forEach(this.connect.bind(this));
			this.emit('awake', Object.keys(this.devices).length);
			// Go into idle mode
			this.idle();
		}).bind(this));
		return this;
	}

	// Generate some port information from what is available
	parse(port) {
		console.debug('Nala.prototype.parse()', port);
		if (!port || !port.comName) return null;
		return {
			id: port.comName,
			baudRate: this.options.baudRate,
			session: port.pnpId && port.pnpId.split('\\').pop(),
			pnp: port.pnpId && port.pnpId.split('\\').splice(0,2).join('://') || 'USB://unknown',
		};
	}

	// Initialize device connected to port
	connect(port) {
		console.debug('Nala.prototype.connect()', port);
		if (!port) return;
		// Add to list of known devices
		var device = new Device(port, Object.keys(this.devices).length);
		this.devices[device.id] = device;
		fs.writeFileSync(device.dataPath + '/device.json', JSON.stringify(device, null, 2));
		device.on('connected', this.emit.bind(this, 'deviceready', device.id, device.dataPath));
		device.on('disconnect', this.remove.bind(this, device.id));
		device.on('data', this.data.bind(this));
	}

	// Controller device no longer needed
	remove(deviceId, reason) {
		console.debug('Nala.prototype.remove()', deviceId, reason);
		var device = this.devices[deviceId];
		if (device) {
			delete this.devices[deviceId];
			this.emit('deviceremoved', deviceId, reason);
		}
	}

	// Event loop
	idle() {
		this.reflect();
		this.fulfill();
		setTimeout(this.idle.bind(this), 100);
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
		console.debug('Nala.prototype.data()', data);
		var cycle = this.cycle.update(data);
		if (cycle.lastUpdate.surprise) {
			this.interpret(cycle);
		}
	}

	interpret(cycle) {
		console.debug('Nala.prototype.interpret()', cycle.lastUpdate);
		// Shit. Change in input cycle.
		// Was change in pattern due to own action?
		// If due to own action, is it as expected?
		var source = cycle.lastUpdate.source;
		var history = cycle.history[source];
		console.log({
			source: source,
			history: history
		})
	}

	react() {
		// Ok we should do something now to avoid pain
	}

}

console.debug = function() {
	if (Nala.debugMode) {
		console.log.apply(console, arguments);
	}
}

module.exports = Nala;
