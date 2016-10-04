"use strict";

const fs = require('fs');
const path = require('path');
const util = require('util');
const fse = require('fs-extra');
const crypto = require('crypto');
const md5 = crypto.createHash('md5');
const Observable = require('events');
const SerialPort = require('serialport');
const readline = SerialPort.parsers.readline('\n');

class Nala extends Observable {

	// Define some parameters
	constructor(options) {
		super();
		options = options || {};
		options.baudRate = options.baudRate || 115200;
		options.manufacturers = options.manufacturers || /(wch)|(arduino)/i;
		Nala.debugMode = options.debug;
		this.devices = [];
		this.devices.find = function(id) { return this[this.indexOf(id)]; };
		this.devices.remove = function(id) { this.splice(this.indexOf(id), 1); }
		this.options = options;
		// Attach event listeners
		if (options.listeners) {
			for(var eventName in options.listeners) {
				this.on(eventName, options.listeners[eventName]);
			}
		}
	}

	// YAWN! Time to wake up!
	// Check the USB ports.. Do we have something that looks interesting?
	// If so then connect to it
	wakeUp() {
		Nala.debug('Nala.prototype.wakeUp()', this.options);
		var manufacturers = this.options.manufacturers;
		SerialPort.list((function(err, ports) {
			Nala.debug('%d USB ports available.', ports.length, ports);
			ports
				.filter((p) => p.manufacturer && !!p.manufacturer.match(manufacturers))
				.map(this.parse.bind(this))
				.filter((p) => !!p)
				.forEach(this.connect.bind(this));
			this.emit('awake', this.devices.length);
			// Go into idle mode
			this.idle();
		}).bind(this));
		return this;
	}

	// Generate some port information from what is available
	parse(port) {
		Nala.debug('Nala.prototype.parse(port)', port);
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
		Nala.debug('Nala.prototype.connect(port)', port);
		if (!port) return;
		// Add to list of known devices
		var device = new Device(port);
		this.devices.push(device);
		fs.writeFileSync(device.dataPath + '/device.json', JSON.stringify(device, null, 2));
		//this.emit('deviceready', device.id, device.dataPath);
		// Remove it if there is an error
		device.on('error', (function(msg) {
			this.devices.remove(device.id);
			this.emit('deviceremoved', device.id, msg);
		}).bind(this));
		device.on('connected', this.emit.bind(this, 'deviceready', device.id, device.dataPath));
	}

	disconnnect(deviceId) {
		Nala.debug('Nala.prototype.disconnect(deviceId)', deviceId);
		var device = this.devices.find(deviceId);
	}

	// Also known as the event loop
	idle() {
		//this.devices.forEach((d) => d.processInput());
		this.reflect();
		this.react();
		setTimeout(this.idle.bind(this), 100);
	}

	reflect() {
		// Read input and match to known patterns
		// Query options for a device
		// Query option for a device (if options known)
	}

	react() {
		// Trial option for a device
		// React to output
	}

}

Nala.debug = function() {
	if (this.debugMode) {
		console.log.apply(console, arguments);
	}
}

class Device extends Observable {

	// Initializes an attached microcontroller
	constructor(port) {
		super();
		Nala.debug('new Device(port)');
		this.id = md5.update(port.pnp).digest('hex').substr(0, 8);
		this.port = port;
		this.dataPath = './data/' + this.id;
		this.inputPath = this.dataPath + '/in';
		this.outputPath = this.dataPath + '/out'
		this.channels = {};
		this.input = [];
		// Create dirs
		[this.dataPath, this.inputPath, this.outputPath].forEach((dir) => {
			if (!fs.existsSync(dir)) {
				fse.mkdirsSync(dir);
			}
		});
		// Connect and query
		this.connect(setTimeout.bind(global, this.write.bind(this, '?'), 1500));
	}

	// Connects the device and executes callback
	connect(callback) {
		Nala.debug('Device.prototype.connect()');
		var device = this;
		var connection = new SerialPort(this.port.id, { parser: readline, baudRate: this.port.baudRate });
		//var readline = connection.pipe(new ReadLine());
		connection.on('data', this.data.bind(this));
		connection.on('open', function(error) {
			if (error) device.emit('error', util.format('Error connecting to %s. %s', device.id, error));
			if (callback) callback(connection);
			device.emit('connected', device.id);
		});
		connection.on('disconnect', device.emit.bind(device, 'disconnect', device.id));
		connection.on('close', device.emit.bind(device, 'close', device.id));
		this.connection = connection;
	}

	data(data) {
		Nala.debug('Device.prototype.data()', data);
		var key = data[0];
		/*if (key) {
			data = data.substr(1);
			if (key === '?') {
				data.split('|').forEach((function(key) {
					if (!this.channels[key]) {
						this.channels[key] = new Channel(this, key, 'in');
					}
				}).bind(this));
			} else {
				var channel = this.channels[key];
				if (!channel) {
					channel = this.channels[key] = new Channel(this, key, 'in');
				}
				channel.data.push(data);
			}
		}*/
	}

	write(data) {
		Nala.debug('Device.prototype.write()', data);
		if (this.connection.isOpen()) {
			this.connection.write(data, Nala.debug.bind(Nala, 'Data written to ' + this.port.id));
		} else {
			this.connect(function(connection) {
				connection.write(data);
			});
		}
	}


}

class Channel extends Observable {

	constructor(device, key, type) {
		Nala.debug('new Channel(device, key, type)', device, key, type)
		super();
		this.key = key;
		this.type = type;
		this.path = (type === 'in' ? device.inputPath : device.outputPath) + '/' + key;
		if (!fs.existsSync(this.path)) {
			fse.mkdirsSync(this.path);
		}
		// Data buffer
		this.data = [];
	}

}


module.exports = Nala;
