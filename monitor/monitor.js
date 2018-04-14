//
// usbmon.js
//
// Monitor USB devices and restart a process when changes detected.
//
// Usage:
//
// usbmon node my/target/process.js
//

var SerialPort = require('serialport');
var child_process = require('child_process');
var target_process = process.argv[2];
var target_process_args = process.argv.slice(3);
var running_process;
var last;

if (!target_process) {

	console.error('No target process to execute.');

} else {

	console.log(`Monitoring USB changes. Target process: "${target_process}"`);

	setInterval(() => SerialPort.list(function (err, ports) {
		if (err) return;

		var latest = JSON.stringify(ports);
		if (latest !== last) {
			restart();
		}
		last = latest;
	
	}), 1000);

} 

function restart() {

	console.log(`USB Changes detected ==> usbmon.restart()`);

	// Send kill signat
	if (running_process) {
		running_process.kill('SIGINT');
	}

	// Wait 200ms and spawn new process
	setTimeout(() => {
		running_process = child_process.spawn(target_process, target_process_args);
		running_process.stdout.on('data', data => console.log(`stdout:${data}`));
		running_process.stderr.on('data', data => console.log(`stderr:${data}`));
	}, 200);
}

