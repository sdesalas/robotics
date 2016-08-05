/*
  nala.js
 
  Non-deterministic Artificial Learning Algorithm (NALA).

  By: Steven de Salas
  On: February 2016
  
  NALA is a javascript non-deterministic input-response algorithm
  for electronic devices.

  NALA needs to learn in order to become effective. It does this by
  having certain input-response pairs strengthened by means positive input 
  (ie voice: 'well done'), and other input-response pairs weakened by 
  negative input (ie voice: 'oh no! dont do that!').

  If NALA does not receive positive or negative input then all of its 
  output responses will be random.

  NALA is meant to be executed inside the node.js environment on linux by a 
  microcontroller command-line wrapper, so that it has 2-way access
  from microcontroller to node and vice-versa. This allows for the allocation 
  of greater computing resources available on the linux CPU to tasks such as 
  processing input and reflection, as well as the ability to act upon sensor 
  data (input) by producing an appropriate digital signal output (response) 
  via the microcontroller.
 
  Tom Igoe's Arduino Yun BridgeToNode examples provided the starting basis
  for the 2-way communication used by NALA.

  https://github.com/tigoe/BridgeExamples/tree/master/BridgeToNode

*/

// Add modules
var readline = require('readline');	
var fs = require('fs');

// Initialize
nala = {};

nala.init = function() {

  // Set working files
  nala.start = (new Date()).getTime();
  nala.inputdir = __dirname + '/input/';
  nala.outputdir = __dirname + '/output/';
  nala.logfile = __dirname + '/nala.log';

	// Initialize 
  try { fs.unlinkSync(nala.logfile); } catch (e) {}
	nala.log("Initializing NALA..");	 
	nala.log("Running on: " + __dirname);

	// Watch out we dont need to check this every time, 
	// just the first time will do.
	if (!fs.existsSync(nala.inputdir)) {
		fs.mkdirSync(nala.inputdir);
	}

	// create an interface to read lines from the Arduino:
	var lineReader = readline.createInterface({
	  input: process.stdin,
	  output: process.stdout,
	  terminal: false
	});

	// when you get a newline in the stdin (ends with \n),
	// send a reply out the stdout:
	lineReader.on('line', nala.stdin);

  // check if we should output at regular intervals (5 sec)
  setInterval(function() {
    if (nala.rand(10) == 1) {
      nala.output();
    }
  }, 1000);

};

nala.log = function(data) {
  if (typeof data === 'object') data = JSON.stringify(data);
  var ms = 10000000 + (new Date()).getTime() - nala.start;
  fs.appendFileSync(nala.logfile, ms + ': ' + data + '\n');
}

nala.rand = function(n) {
  if (n.length) 
    return n[Math.floor(Math.random() * n.length)];
  else
    return Math.floor(Math.random() * n);
}

nala.uid = function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4();
};

nala.stdin = function (data) {
  nala.log('nala.stdin()');
  switch(data) {
	default:
		//console.log('Did you say: '+ data);
		break;
  }

  fs.writeFile(nala.inputdir + nala.uid() + '.log', data); 
  data = null;

  // Respond to input
  setTimeout(function() {
    nala.output();
  }, 1000);

}

nala.output = function() {
  var files = fs.readdirSync(nala.inputdir);
  for(var i = 0; i < files.length; i++) {
    if (!(files[i].indexOf('.log') > 0)) files.splice(i, 1);
  }
  if (files.length) {
    var file = nala.rand(files);
    var data = fs.readFileSync(nala.inputdir + file, {encoding: 'ascii'});
    nala.log('nala.output() ' + file + ' :: ' + data);
    console.log(data);
    data = null;
    file = null;
  }
  files = null;
}


// Go!
nala.init();
