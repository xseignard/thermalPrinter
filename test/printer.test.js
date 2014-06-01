'use strict';
/*jshint expr: true*/
var should = require('chai').should(),
	Printer = require('../src/printer');

var fakeSerialPort = {
	write: function(data, callback) {
		process.nextTick(callback);
	},
	drain: function(callback) {
		process.nextTick(callback);
	}
};

var verifyCommand = function(expected, commandName, param, done) {
	var printer = new Printer(fakeSerialPort);
	printer.on('ready', function() {
		printer.commandQueue.should.be.empty;
		printer[commandName](param);
		printer.commandQueue.length.should.equal(expected.length);
		for (var i = 0; i < expected.length; i++) {
			printer.commandQueue[i].should.be.instanceOf(Buffer);
			var expectedBuffer = expected[i];
			if (!Buffer.isBuffer(expected[i])) {
				expectedBuffer = new Buffer(1);
				expectedBuffer.writeUInt8(expected[i], 0);
			}
			printer.commandQueue[i].toString().should.equal(expectedBuffer.toString());
		}
		done();
	});
};

describe('Printer', function() {

	describe('new Printer()', function() {
		it('should throw an error if serial port is not properly defined', function() {
			(function() {
				new Printer();
			}).should.throw(Error);
			(function() {
				new Printer({});
			}).should.throw(Error);
		});
		it('should be configured with default values', function() {
			var printer = new Printer(fakeSerialPort);
			printer.on('ready', function() {
				printer.serialPort.should.equal(fakeSerialPort);
				printer.maxPrintingDots.should.equal(7);
				printer.heatingTime.should.equal(80);
				printer.heatingInterval.should.equal(2);
				printer.printMode.should.equal(0);
			});
		});
		it('should be configured with given values', function() {
			var opts = {
				maxPrintingDots: 2,
				heatingTime: 220,
				heatingInterval: 1,
				commandDelay: 5
			};
			var printer = new Printer(fakeSerialPort, opts);
			printer.on('ready', function() {
				printer.serialPort.should.equal(fakeSerialPort);
				printer.maxPrintingDots.should.equal(opts.maxPrintingDots);
				printer.heatingTime.should.equal(opts.heatingTime);
				printer.heatingInterval.should.equal(opts.heatingInterval);
				printer.commandDelay.should.equal(opts.commandDelay);
			});
		});
	});

	describe('Printer.writeCommand()', function() {
		it('should push the buffer in the queue', function(done) {
			var buf = new Buffer('command');
			var printer = new Printer(fakeSerialPort);
			printer.on('ready', function() {
				printer.commandQueue.should.be.empty;
				printer.writeCommand(buf);
				printer.commandQueue.length.should.equal(1);
				printer.commandQueue[0].should.equal(buf);
				done();
			});
		});
		it('should create a buffer and push it in the queue', function(done) {
			var command = 42;
			var printer = new Printer(fakeSerialPort);
			printer.on('ready', function() {
				printer.commandQueue.should.be.empty;
				printer.writeCommand(command);
				printer.commandQueue.length.should.equal(1);
				printer.commandQueue[0].should.be.instanceOf(Buffer);
				printer.commandQueue[0][0].should.equal(command);
				done();
			});
		});
	});

	describe('Printer.writeCommands()', function() {
		it('should create buffers and push it in the queue', function(done) {
			var commands = [27, 64];
			var printer = new Printer(fakeSerialPort);
			printer.on('ready', function() {
				printer.commandQueue.should.be.empty;
				printer.writeCommands(commands);
				printer.commandQueue.length.should.equal(2);
				printer.commandQueue[0].should.be.instanceOf(Buffer);
				printer.commandQueue[0][0].should.equal(commands[0]);
				printer.commandQueue[1].should.be.instanceOf(Buffer);
				printer.commandQueue[1][0].should.equal(commands[1]);
				done();
			});
		});
	});

	describe('Printer.reset()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [27, 64];
			verifyCommand(expected, 'reset', 0, done);
		});
	});

	describe('Printer.sendPrintingParams()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [27, 55, 7, 80, 2];
			verifyCommand(expected, 'sendPrintingParams', 0, done);
		});
	});

	describe('Printer.lineFeed()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [27, 100, 10];
			verifyCommand(expected, 'lineFeed', 10, done);
		});
		it('should add the single line feed command in the queue', function(done) {
			var expected = [10];
			verifyCommand(expected, 'lineFeed', 0, done);
		});
	});

	describe('Printer.addPrintMode()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [27, 33, 8];
			verifyCommand(expected, 'addPrintMode', 8, done);
		});
	});

	describe('Printer.removePrintMode()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [27, 33, 0];
			verifyCommand(expected, 'removePrintMode', 8, done);
		});
	});

	describe('Printer.bold()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [27, 33, 8];
			verifyCommand(expected, 'bold', true, done);
		});
	});

	describe('Printer.big()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [27, 33, 56];
			verifyCommand(expected, 'big', true, done);
		});
	});

	describe('Printer.inverse()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [29, 66, 1];
			verifyCommand(expected, 'inverse', true, done);
		});
	});

	describe('Printer.left()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [27, 97, 0];
			verifyCommand(expected, 'left', 0, done);
		});
	});

	describe('Printer.right()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [27, 97, 2];
			verifyCommand(expected, 'right', 0, done);
		});
	});

	describe('Printer.center()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [27, 97, 1];
			verifyCommand(expected, 'center', 0, done);
		});
	});

	describe('Printer.indent()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [27, 66, 10];
			verifyCommand(expected, 'indent', 10, done);
		});
	});

	describe('Printer.setLineSpacing()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [27, 51, 12];
			verifyCommand(expected, 'setLineSpacing', 12, done);
		});
	});

	describe('Printer.horizontalLine()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [196, 196, 196, 10];
			verifyCommand(expected, 'horizontalLine', 3, done);
		});
	});

	describe('Printer.printLine()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [new Buffer('test'), 10];
			verifyCommand(expected, 'printLine', 'test', done);
		});
	});
});
