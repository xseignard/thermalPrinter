'use strict';
var util = require('util'),
	EventEmitter = require('events').EventEmitter,
	fs = require('fs'),
	getPixels = require('get-pixels'),
	deasync = require('deasync'),
	async = require('async'),
	helpers = require('./helpers'),
	specialChars = require('./specialChars.js'),
	codePage = require('./codePage').PC437;

/*
 * Printer opts.
 *
 * maxPrintingDots = 0-255. Max heat dots, Unit (8dots), Default: 7 (64 dots)
 * heatingTime = 3-255. Heating time, Unit (10us), Default: 80 (800us)
 * heatingInterval = 0-255. Heating interval, Unit (10µs), Default: 2 (20µs)
 *
 * The more max heating dots, the more peak current will cost when printing,
 * the faster printing speed. The max heating dots is 8*(n+1).
 *
 * The more heating time, the more density, but the slower printing speed.
 * If heating time is too short, blank page may occur.
 *
 * The more heating interval, the more clear, but the slower printing speed.
 *
 * Example with default values.
 *
 * var Printer = require('thermalprinter'),
 *     opts = {
 *       maxPrintingDots : 7,
 *       heatingTime : 80,
 *       heatingInterval : 2,
 *       commandDelay: 0,
 *       charset: 0
 *     };
 * var printer = new Printer(mySerialPort, opts);
 */
var Printer = function(serialPort, opts) {
	EventEmitter.call(this);
	// Serial port used by printer
	if (!serialPort.write || !serialPort.drain) throw new Error('The serial port object must have write and drain functions');
	this.serialPort = serialPort;
	opts = opts || {};
	// Max printing dots (0-255), unit: (n+1)*8 dots, default: 7 ((7+1)*8 = 64 dots)
	this.maxPrintingDots = opts.maxPrintingDots || 7;
	// Heating time (3-255), unit: 10µs, default: 80 (800µs)
	this.heatingTime = opts.heatingTime || 80;
	// Heating interval (0-255), unit: 10µs, default: 2 (20µs)
	this.heatingInterval = opts.heatingInterval || 2;
	// delay between 2 commands (in µs)
	this.commandDelay = opts.commandDelay || 0;
	// chinese firmware, for some reasons some thermal printers come with a firmware that don't handle all latin chars
	// but we can do some hacky stuff to have almost every chars
	this.chineseFirmware = opts.chineseFirmware || false;
	// charset (USA: 0, by default, will switch to print special chars)
	this.charset = 0;
	// command queue
	this.commandQueue = [];
	// printmode bytes (normal by default)
	this.printMode = 0;

	var _self = this;
	this.reset().sendPrintingParams().setCharset(this.charset).print(function() {
		_self.emit('ready');
	});
};
util.inherits(Printer, EventEmitter);

Printer.prototype.print = function(callback) {
	var _self = this;
	async.eachSeries(
		_self.commandQueue,
		function(command, callback) {
			function write() {
				_self.serialPort.write(command, function() {
					_self.serialPort.drain(callback);
				});
			}

			if (_self.commandDelay === 0) {
				write();
			}
			else {
				setTimeout(write, Math.ceil(_self.commandDelay / 1000));
			}
		},
		function(err) {
			_self.commandQueue = [];
			if(callback) callback(err);
		}
	);
};

Printer.prototype.writeCommand = function(command) {
	var buf;
	if (!Buffer.isBuffer(command)) {
		buf = new Buffer(1);
		buf.writeUInt8(command, 0);
	}
	else {
		buf = command;
	}
	this.commandQueue.push(buf);
	return this;
};

Printer.prototype.writeCommands = function(commands) {
	commands.forEach(function(command) {
		this.writeCommand(command);
	}, this);
	return this;
};

Printer.prototype.reset = function() {
	var commands = [27, 64];
	return this.writeCommands(commands);
};

Printer.prototype.setCharset = function(code) {
	this.charset = code;
	var commands = [27, 82, this.charset];
	return this.writeCommands(commands);
};

Printer.prototype.setCharCodeTable = function(code) {
	var commands = [27, 116, code];
	return this.writeCommands(commands);
};

Printer.prototype.testPage = function() {
	var commands = [18, 84];
	return this.writeCommands(commands);
};

Printer.prototype.hasPaper = function(callback) {
	var command = new Buffer([27, 118, 0]);
	var _self = this;
	// waits for the printer answer
	_self.serialPort.once('data', function(data) {
		if (data) {
			var returnCode = data.toString('utf-8');
			// the return code $ means no paper
			if (returnCode === '$') {
				callback(false);
			}
			else {
				callback(true);
			}
		}
	});
	_self.serialPort.write(command, function() {
		_self.serialPort.drain();
	});
};

Printer.prototype.sendPrintingParams = function() {
	var commands = [27,55,this.maxPrintingDots, this.heatingTime, this.heatingInterval];
	return this.writeCommands(commands);
};

Printer.prototype.lineFeed = function (linesToFeed) {
	var commands = linesToFeed ? [27, 100, linesToFeed] : [10];
	return this.writeCommands(commands);
};

Printer.prototype.addPrintMode = function(mode) {
	this.printMode |= mode;
	return this.writeCommands([27, 33, this.printMode]);
};

Printer.prototype.removePrintMode = function(mode) {
	this.printMode &= ~mode;
	return this.writeCommands([27, 33, this.printMode]);
};

Printer.prototype.bold = function (onOff) {
	return onOff ? this.addPrintMode(8) : this.removePrintMode(8);
};

Printer.prototype.big = function (onOff) {
	return onOff ? this.addPrintMode(56) : this.removePrintMode(56);
};

Printer.prototype.underline = function(dots){
	var commands = [27, 45, dots];
	return this.writeCommands(commands);
};

Printer.prototype.small = function(onOff){
	var commands = [27, 33, (onOff === true ? 1 : 0)];
	return this.writeCommands(commands);
};

Printer.prototype.upsideDown = function(onOff){
	var commands = [27, 123, (onOff === true ? 1 : 0)];
	return this.writeCommands(commands);
};

Printer.prototype.inverse = function (onOff) {
	var commands = onOff ? [29, 66, 1] : [29, 66, 0];
	return this.writeCommands(commands);
};

Printer.prototype.left = function () {
	var commands = [27, 97, 0];
	return this.writeCommands(commands);
};

Printer.prototype.right = function () {
	var commands = [27, 97, 2];
	return this.writeCommands(commands);
};

Printer.prototype.center = function () {
	var commands = [27, 97, 1];
	return this.writeCommands(commands);
};

Printer.prototype.indent = function(columns) {
	if (columns < 0 || columns > 31) {
		columns = 0;
	}
	var commands = [27, 66, columns];
	return this.writeCommands(commands);
};

Printer.prototype.setLineSpacing = function(lineSpacing) {
	var commands = [27, 51, lineSpacing];
	return this.writeCommands(commands);
};

Printer.prototype.horizontalLine = function(length) {
	var commands = [];
	if (length > 0) {
		if (length > 32) {
			length = 32;
		}
		for (var i = 0; i < length; i++) {
			commands.push(196);
		}
		commands.push(10);
	}
	return this.writeCommands(commands);
};

Printer.prototype.printText = Printer.prototype.addText = function (text) {
	var _self = this;
	var chars = text.split('');
	var commands = [];

	chars.forEach(function(char, index) {
			// handle chinese firmaware
			if (_self.chineseFirmware) {
				var currentChar = specialChars[char];
				// if this is a special character
				if (currentChar) {
					// if the current charset is the same as the one of the special character
					if (currentChar.charset === _self.charset) {
						commands.push(specialChars[char].code);
					}
					// if the current charset is different of the one of the special character
					else {
						var oldCharset = _self.charset;
						// set the charset to the one where the special character exists
						commands.push.apply(commands, [27, 82, currentChar.charset]);
						// push the special character in the command queue
						commands.push(specialChars[char].code);
						// reset the old charset
						commands.push.apply(commands, [27, 82, oldCharset]);
					}
				}
				// we guess it is not a special character and push it to the command queue
				else {
					commands.push(new Buffer(char));
				}
			}
			// handle normal firmware
			else {
				var charPos = codePage.indexOf(char);
				// if the char is in the code table
				if(charPos != -1){
					// get the hex value and push it into new commands list
					commands.push(charPos + 128);
				}
				else {
					// otherwise it's probably normal text
					commands.push(new Buffer(char));
				}
			}
	});
	return this.writeCommands(commands);
};

Printer.prototype.printLine = function (text) {
	return this.printText(text).writeCommand(10);
};

Printer.prototype.printImage = function(path){
	var done = false;

	var _self = this;
	getPixels(path, function(err, pixels){
		if(!err){
			var width = pixels.shape[0];
			var height = pixels.shape[1];

			if (width != 384 || height > 65635) {
				throw new Error('Image width must be 384px, height cannot exceed 65635px.');
			}

			// contruct an array of Uint8Array,
			// each Uint8Array contains 384/8 pixel samples, corresponding to a whole line
			var imgData = [];
			for (var y = 0; y < height; y++) {
				imgData[y] = new Uint8Array(width/8);
				for (var x = 0; x < (width/8); x++) {
					imgData[y][x] = 0;
					for (var n = 0; n < 8; n++) {
						var r = pixels.get(x*8+n, y, 0);
						var g = pixels.get(x*8+n, y, 1);
						var b = pixels.get(x*8+n, y, 2);

						var brightness = helpers.rgbToHsl(r, g, b)[2];
						// only print dark stuff
						if (brightness < 0.6) {
							imgData[y][x] += (1 << n);
						}
					}
				}
			}

			// send the commands and buffers to the printer
			_self.printImageData(width, height, imgData);
			// tell deasync getPixels is done
			done = true;
		}
		else {
			throw new Error(err);
		}
	});
	// deasync getPixels
	while(!done) {
		deasync.runLoopOnce();
	}
	return this;
};

Printer.prototype.printImageData =function(width, height, imgData){
	if (width != 384 || height > 65635) {
		throw new Error('Image width must be 384px, height cannot exceed 65635px.');
	}

	// send the commands and buffers to the printer
	var commands = [18, 118, height & 255, height >> 8];
	for (var y = 0; y < imgData.length; y++) {
		var buf = helpers.uint8ArrayToBuffer(imgData[y]);
		commands.push(buf);
	}
	this.writeCommands(commands);
	return this;
};

// Barcodes

// Set barcodeTextPosition
//
// Position can be:
// 0: Not printed
// 1: Above the barcode
// 2: Below the barcode
// 3: Both above and below the barcode
Printer.prototype.barcodeTextPosition = function(pos) {
	if(pos > 3 || pos < 0) {
		throw new Error('Position must be 0, 1, 2 or 3');
	}
	var commands = [29, 72, pos];
	return this.writeCommands(commands);
};

// Set barcode height
// 0 < h < 255 (default = 50)
Printer.prototype.barcodeHeight = function(h) {
	if(h > 255 || h < 0) {
		throw new Error('Height must be 0 < height > 255');
	}
	var commands = [29, 104, h];
	return this.writeCommands(commands);
};

Printer.BARCODE_CHARSETS = {
	NUMS: function(n) { return n >= 48 && n <= 57; },
	ASCII: function(n) { return n >= 0 && n <= 127; }
};

// These are all valid barcode types.
// Pass this object to printer.barcode() as type:
// printer.barcode(Printer.BARCODE_TYPES.UPCA, 'data');
Printer.BARCODE_TYPES = {
	UPCA : {
		code: 65,
		size: function(n) { return n === 11 || n === 12; },
		chars: Printer.BARCODE_CHARSETS.NUMS
	},
	UPCE : {
		code: 66,
		size: function(n) { return n === 11 || n === 12; },
		chars: Printer.BARCODE_CHARSETS.NUMS
	},
	EAN13 : {
		code: 67,
		size: function(n) { return n === 12 || n === 13; },
		chars: Printer.BARCODE_CHARSETS.NUMS
	},
	EAN8 : {
		code: 68,
		size: function(n) { return n === 7 || n === 8; },
		chars: Printer.BARCODE_CHARSETS.NUMS
	},
	CODE39 : {
		code: 69,
		size: function(n) { return n > 1; },
		chars: function(n) {
			// " $%+-./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
			return (
				n === 32 ||
				n === 36 ||
				n === 37 ||
				n === 43 ||
				(n >= 45 && n <= 57) ||
				(n >= 65 && n <= 90)
			);
		}
	},
	I25 : {
		code: 70,
		size: function(n) { return n > 1 && n % 2 === 0; },
		chars: Printer.BARCODE_CHARSETS.NUMS
	},
	CODEBAR : {
		code: 71,
		size: function(n) { return n > 1; },
		chars: function(n) {
		// "$+-./0123456789:ABCD"
		return (
			n === 36 ||
			n === 43 ||
			(n >= 45 && n <= 58) ||
			(n >= 65 && n <= 68)
		);
		}
	},
	CODE93 : {
		code: 72,
		size: function(n) { return n > 1; },
		chars: Printer.BARCODE_CHARSETS.ASCII
	},
	CODE128 : {
		code: 73,
		size: function(n) { return n > 1; },
		chars: Printer.BARCODE_CHARSETS.ASCII
	},
	CODE11 : {
		code: 74,
		size: function(n) { return n > 1; },
		chars: Printer.BARCODE_CHARSETS.NUMS
	},
	MSI : {
		code: 75,
		size: function(n) { return n > 1; },
		chars: Printer.BARCODE_CHARSETS.NUMS
	}
};

Printer.prototype.barcode = function(type, data) {
	var error;
	var commands = [29, 107];
	commands.push(type.code);
	commands.push(data.length);

	// Validate size
	if(!type.size(data.length)) {
		error = new Error('Data length does not match specification for this type of barcode');
		error.name = "invalid_data_size";
		throw error;
	}
	// validate that the chars to be printed are supported for this type of barcode
	for(var i=0; i < data.length; i++) {
		var code = data.charCodeAt(i);
		if(!type.chars(code)) {
			error = new Error('Character ' + code + ' is not valid for this type of barcode');
			error.name = "invalid_character";
			error.char = code;
			throw error;
		}
		commands.push(code);
	}
	return this.writeCommands(commands);
};

module.exports = Printer;
