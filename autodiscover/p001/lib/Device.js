"use strict";

const fs = require('fs');
const util = require('util');
const fse = require('fs-extra');
const crypto = require('crypto');
const Observable = require('events');
const SerialPort = require('serialport');
const readline = SerialPort.parsers.readline('\n');
const Nala = require('../');

class Device extends Observable {

	// Initializes an attached microcontroller
	constructor(options) {
		super();
		if (!options ||
			!options.port ||
			!options.dataPath) {
			throw Error('Error initializing Device.');
		}
		console.debug('new Device(port)', options.port.comName);
		this.port = options.port;
		this.id = options.port.id;
		this.dataPath = options.dataPath + '/' + this.id;
		this.inputPath = this.dataPath + '/in';
		this.outputPath = this.dataPath + '/out';
		// Create dirs
		[this.dataPath, this.inputPath, this.outputPath].forEach((dir) => {
			if (!fs.existsSync(dir)) {
				fse.mkdirsSync(dir);
			}
		});
		this.connect();
	}

	connect() {
		console.debug('Device.prototype.connect()');
		var device = this;
		var connection = new SerialPort(this.port.comName, { parser: readline, baudRate: this.port.baudRate });
		connection.on('data', data => this.emit('data', this.id + '.' + data.slice(0,-1))); // Remove EOL
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
}


if (typeof module !== 'undefined') {
	module.exports = Device;
}
