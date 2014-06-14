'use strict';
var util = require('util'),
	EventEmitter = require('events').EventEmitter,
	fs = require('fs'),
	Canvas = require('canvas'),
	Image = Canvas.Image,
	async = require('async'),
	sleep = require('sleep'),
	helpers = require('./helpers');

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
 *       commandDelay: 0
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
	// command queue
	this.commandQueue = [];
	// printmode bytes (normal by default)
	this.printMode = 0;

	var _self = this;
	this.reset().sendPrintingParams().print(function() {
		_self.emit('ready');
	});
};
util.inherits(Printer, EventEmitter);

Printer.prototype.print = function(callback) {
	var _self = this;
	async.eachSeries(
		_self.commandQueue,
		function(command, callback) {
			if (_self.commandDelay !== 0) {
				sleep.usleep(_self.commandDelay);
			}
			_self.serialPort.write(command, function() {
				_self.serialPort.drain(callback);
			});
		},
		function(err) {
			_self.commandQueue = [];
			callback();
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

Printer.prototype.printLine = function (text) {
	var commands = [new Buffer(text), 10];
	return this.writeCommands(commands);
};

Printer.prototype.printImage = function(path) {
	// put the image in the canvas
	var file = fs.readFileSync(path);
	var img = new Image();
	img.src = file;
	if (img.width != 384 || img.height > 65635) {
		throw new Error('Image width must be 384px, height cannot exceed 65635px.');
	}
	var canvas = new Canvas(img.width, img.height);
	var ctx = canvas.getContext('2d');
	ctx.drawImage(img, 0, 0, img.width, img.height);
	var pixels = ctx.getImageData(0, 0, img.width, img.height).data;

	// contruct an array of Uint8Array,
	// each Uint8Array contains 384/8 pixel samples, corresponding to a whole line
	var imgData = [];
	for (var y = 0; y < img.height; y++) {
		imgData[y] = new Uint8Array(img.width/8);
		for (var x = 0; x < (img.width/8); x++) {
			imgData[y][x] = 0;
			for (var n = 0; n < 8; n++) {
				var pixel = ctx.getImageData(x*8+n, y, 1, 1).data;
				var brightness = helpers.rgbToHsl(pixel[0], pixel[1], pixel[2])[2];
				// only print dark stuff
				if (brightness < 0.6) {
					imgData[y][x] += (1 << n);
				}
			}
		}
	}

	// send the commands and buffers to the printer
	var commands = [18, 118, img.height & 255, img.height >> 8];
	for (y = 0; y < imgData.length; y++) {
		var buf = helpers.uint8ArrayToBuffer(imgData[y]);
		commands.push.apply(commands, buf);
	}
	this.writeCommands(commands);
	return this;
};

module.exports = Printer;
