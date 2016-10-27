"use strict";

const fs = require('fs');
const util = require('util');
const crypto = require('crypto');
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
	wakeUp() {
		console.debug('Nala.prototype.wakeUp()', this.options);
		var detectDevices = this.detect.bind(this, (ports) => {
			this.emit('awake', Object.keys(this.devices).length);
		});
		detectDevices();
		// Keep checking every few seconds if nothing is connected..
		setInterval(() => {
			if (Object.keys(this.devices).length === 0) detectDevices();
		}, 2000);
		// Go into idle mode
		this.idle();
		return this;
	}

	// Check the USB ports.. Do we have something that looks interesting?
	// If so then connect to it
	detect(callback) {
		console.debug('Nala.prototype.detect()');
		var manufacturers = this.options.manufacturers;
		SerialPort.list((function(err, ports) {
			console.debug('%d USB ports available.', ports.length, ports);
			ports
				.filter((p) => p.manufacturer && !!p.manufacturer.match(manufacturers))
				.map(this.parse.bind(this))
				.filter((p) => p && !this.devices[p.id])
				.forEach(this.connect.bind(this));
			if (callback) callback(ports);
		}).bind(this));
		return this;
	}

	// Generate some port information from what is available
	parse(port) {
		console.debug('Nala.prototype.parse()', port);
		if (!port || !port.comName) return null;
		port = {
			comName: port.comName,
			baudRate: this.options.baudRate,
			session: port.pnpId && port.pnpId.split('\\').pop(),
			pnp: port.pnpId && port.pnpId.split('\\').splice(0,2).join('://') || 'USB://unknown',
		};
		port.id = crypto.createHash('md5').update(port.pnp).digest('hex').substr(0, 4);
		port.key = crypto.createHash('md5').update(port.pnp).digest('base64').substr(0, 2);
		return port;
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
		return this;
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
		console.debug('Nala.prototype.data()', data);
		var cycle = this.cycle.update(data);
		if (cycle.lastUpdate.surprise) {
			this.interpret(cycle);
		}
		return this;
	}

	interpret(cycle) {
		console.debug('Nala.prototype.interpret()', cycle.lastUpdate);
		// Shit. Change in input cycle.
		// Was change in pattern due to own action?
		// If due to own action, is it as expected?
		var source = cycle.lastUpdate.source;
		var history = cycle.history[source];
		if (history && history.length) {
			var pattern = new Pattern(cycle.history[source]);
			pattern.source = source;
			var input = this.memory.input[pattern.hash]
			if (input && input.important) {
				react(input);
			}
		}
		/*console.log({
			source: source,
			history: history
		})*/
		return this;
	}

	react(input) {
		// Ok we should do something now to avoid pain
		return this;
	}

}

console.debug = function() {
	if (Nala.debugMode) {
		console.log.apply(console, arguments);
	}
}

module.exports = Nala;
