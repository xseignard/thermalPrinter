'use strict';
var should = require('chai').should(),
	Printer = require('../src/printer'),
	printer;

var fakeSerialPort = {
	write: function(data, callback) {
		process.nextTick(callback);
	},
	drain: function(callback) {
		process.nextTick(callback);
	}
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
			printer = new Printer(fakeSerialPort);
			printer.on('ready', function() {
				printer.serialPort.should.equal(fakeSerialPort);
				printer.maxPrintingDots.should.equal(7);
				printer.heatingTime.should.equal(80);
				printer.heatingInterval.should.equal(2);
				printer.printMode.should.equal(0);
			});
		});
		it('should be configured with given values', function() {
			printer = new Printer(fakeSerialPort, 2, 220, 1);
			printer.on('ready', function() {
				printer.serialPort.should.equal(fakeSerialPort);
				printer.maxPrintingDots.should.equal(2);
				printer.heatingTime.should.equal(220);
				printer.heatingInterval.should.equal(1);
			});
		});
	});

	describe('Printer.writeCommand()', function() {
		it('should push the buffer in the queue', function(done) {
			var buf = new Buffer('command');
			printer = new Printer(fakeSerialPort);
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
			printer = new Printer(fakeSerialPort);
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
			printer = new Printer(fakeSerialPort);
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
});
