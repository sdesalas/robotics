"use strict";

const fs = require('fs');
const util = require('util');
const fse = require('fs-extra');
const crypto = require('crypto');
const Observable = require('events');
const SerialPort = require('serialport');
const readline = SerialPort.parsers.readline('\n');
const Utils = require('./Utils');
const Mind = require('../');

class Device extends Observable {

	// Initializes an attached microcontroller
	constructor(options) {
		super();
		if (!options ||
			!options.port ||
			!options.dataPath ||
			!options.delimiter) {
			throw Error('Error initializing Device.');
		}
		console.debug('new Device(port)', options.port.comName);
		this.port = options.port;
		this.id = options.port.id;
		this.delimiter = options.delimiter || DEFAULT_DELIMITER;
		this.dataPath = options.dataPath + '/' + this.id;
		this.inputPath = this.dataPath + '/in';
		this.outputPath = this.dataPath + '/out';
		this.actions = {};
		// Create dirs
		[this.dataPath, this.inputPath, this.outputPath].forEach((dir) => {
			if (!fs.existsSync(dir)) {
				fse.mkdirsSync(dir);
			}
		});
		// Connect to serial
		this.connect();
		fs.writeFileSync(this.dataPath + '/device.json', JSON.stringify(this, null, 2));
	}

	connect() {
		console.debug('Device.prototype.connect()');
		var device = this;
		var connection = new SerialPort(this.port.comName, { parser: readline, baudRate: this.port.baudRate });
		connection.on('data', this.data.bind(this));
		connection.on('open', function(error) {
			if (error) {
				var msg = util.format('Failed to open connection to %s. %s', device.id, error);
				console.debug(msg);
				device.disconnect(msg);
			} else {
				device.emit('connected', device.id);
			}
		});
		connection.on('disconnect', this.disconnect.bind(this, 'Disconnected'));
		connection.on('close', this.disconnect.bind(this, 'Connection closed'));
		this.connection = connection;
	}

	disconnect(reason) {
		console.debug('Device.prototype.disconnect()', reason);
		if (this.connection && this.connection.isOpen()) {
			this.connection.close(() => { this.connection = null; });
		}
		this.emit('disconnect', this.id, reason);
	}

	write(data) {
		console.debug('Device.prototype.write()', data);
		if (this.connection.isOpen()) {
			this.connection.write(data, console.debug.bind(console, 'Data written to ' + this.port.comName));
		} else {
			this.connect(function(connection) {
				connection.write(data);
			});
		}
	}

	randomCommand() {
		var key = Utils.random(Object.keys(this.actions));
		if (key) {
			var action = Utils.random(this.actions[key]);
			if (action) {
				return key + this.delimiter + action;
			}
		}
	}

	data(data) {
		// Remove EOL
		data = data.slice(0, -1); 
		// Watch for help commands 
		// and keep available actions updated
		if (data && data.indexOf('?') === 0 && data.indexOf(this.delimiter) > 0) {
			console.debug('Device.prototype.data().help()', data);
			var help, key, action, available;
			help = data.substr(data.indexOf(this.delimiter) + 1);
			if (help.indexOf(this.delimiter) === -1) {
				// No second delimiter 
				// (action listing)
				// ie: ?>A|B|C
				console.debug('Device.prototype.data().help().listing()');
				help.split('|').forEach(action => this.actions[action] = []);
			} else {
				// Second delimiter present 
				// (Help about an action)
				// ie: ?>B>5a|*d
				key = help.split(this.delimiter).shift() || '';
				action = help.substr(key.length + 1);
				available = this.actions[key];
				console.debug('Device.prototype.data().help().action()', action);
				if (available && available.indexOf(action) === -1) {
					available.push(action);
				}
			}
			fs.writeFile(this.dataPath + '/device.json', JSON.stringify(this, null, 2));
		} else {
			this.emit('data', this.id + '.' + data);
		}
	}
}


if (typeof module !== 'undefined') {
	module.exports = Device;
}
