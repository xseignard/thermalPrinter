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

var verifyCommand = function(expected, commandName, param, done, chineseFirmware) {
	var opts = {
		chineseFirmware: chineseFirmware || false
	};
	var printer = new Printer(fakeSerialPort, opts);
	printer.on('ready', function() {
		printer.commandQueue.should.be.empty;
		if(param instanceof Array){
			printer[commandName].apply(printer, param);
		} else {
			printer[commandName](param);
		}

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

var verifyBarcodeError = function(type, data, error_name, done){
	var printer = new Printer(fakeSerialPort);
	printer.on('ready', function() {
		(function() {
			printer.barcode(type, data);
		}).should.throw(Error);

		try{
			printer.barcode(type, data);
		} catch(error){
			error.name.should.equal(error_name);
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

	describe('Printer.setCharset()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [27, 82, 0];
			verifyCommand(expected, 'setCharset', 0, done);
		});
	});

	describe('Printer.setCharCodeTable()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [27, 116, 0];
			verifyCommand(expected, 'setCharCodeTable', 0, done);
		});
	});

	describe('Printer.testPage()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [18, 84];
			verifyCommand(expected, 'testPage', 0, done);
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

	describe('Printer.underline()', function () {
		it('should add the right commands in the queue when setting underline to 0', function(done) {
			var expected = [27, 45, 0];
			verifyCommand(expected, 'underline', 0, done);
		});

		it('should add the right commands in the queue when setting underline to 5', function(done) {
			var expected = [27, 45, 5];
			verifyCommand(expected, 'underline', 5, done);
		});
	});

	describe('Printer.inverse()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [29, 66, 1];
			verifyCommand(expected, 'inverse', true, done);
		});
	});

	describe('Printer.small()', function() {
		it('should add the right commands in the queue when turning on', function(done) {
			var expected = [27, 33, 1];
			verifyCommand(expected, 'small', true, done);
		});
		it('should add the right commands in the queue when turning off', function(done) {
			var expected = [27, 33, 0];
			verifyCommand(expected, 'small', false, done);
		});
	});

	describe('Printer.upsideDown()', function() {
		it('should add the right commands in the queue when turning on', function(done) {
			var expected = [27, 123, 1];
			verifyCommand(expected, 'upsideDown', true, done);
		});
		it('should add the right commands in the queue when turning off', function(done) {
			var expected = [27, 123, 0];
			verifyCommand(expected, 'upsideDown', false, done);
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
		it('should not indent since the number of indent is out of bounds', function(done) {
			var expected = [27, 66, 0];
			verifyCommand(expected, 'indent', -1, done);
		});
		it('should not indent since the number of indent is out of bounds', function(done) {
			var expected = [27, 66, 0];
			verifyCommand(expected, 'indent', 32, done);
		});
	});

	describe('Printer.setLineSpacing()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [27, 51, 12];
			verifyCommand(expected, 'setLineSpacing', 12, done);
		});
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
		it('should add the right commands in the queue', function(done) {
			var expected = [];
			verifyCommand(expected, 'horizontalLine', -1, done);
		});
		it('should add the right commands in the queue', function(done) {
			var expected = [196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 196, 10];
			verifyCommand(expected, 'horizontalLine', 45, done);
		});
	});

	describe('Printer.printText() // Printer.addText()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [new Buffer('t'), new Buffer('e'), new Buffer('s'), new Buffer('t')];
			verifyCommand(expected, 'printText', 'test', done);
		});
		it('should add the right commands in the queue for the PC437 char', function(done) {
			var expected = [0x80, 0x88, 0x83, 0x9c];
			verifyCommand(expected, 'addText', 'Çêâ£', done);
		});
		it('should add the hex code in queue for special characters', function(done) {
			var expected = [0x40, 0x41];
			verifyCommand(expected, 'printText', '@A', done, true);
		});
		it('should switch the charset for special characters not in the current charset', function(done) {
			var expected = [27, 82, 1, 0x40, 27, 82, 0];
			verifyCommand(expected, 'addText', 'à', done, true);
		});
	});

	describe('Printer.printLine()', function() {
		it('should add the right commands in the queue', function(done) {
			var expected = [new Buffer('t'), new Buffer('e'), new Buffer('s'), new Buffer('t'), 10];
			verifyCommand(expected, 'printLine', 'test', done);
		});
	});

	describe('Printer.printImage()', function() {
	// 	it('should throw an error because the image is larger than 384px', function(done) {
	// 		this.timeout(5000);
	// 		var imgPath = __dirname + '/../images/schema.png';
	// 		var printer = new Printer(fakeSerialPort);
	// 		printer.on('ready', function() {
	// 			(function() {
	// 				printer.printImage(imgPath);
	// 			}).should.throw(Error);
	// 			done();
	// 		});
	// 	});
	// 	it('should not throw an error because the image is larger than 384px', function(done) {
	// 		this.timeout(5000);
	// 		var imgPath = __dirname + '/../images/testImg.png';
	// 		var printer = new Printer(fakeSerialPort);
	// 		printer.on('ready', function() {
	// 			printer.printImage(imgPath);
	// 			printer.commandQueue.length.should.equal(100);
	// 			done();
	// 		});
	// 	});
	});

	describe('Printer.barcodeTextPosition()', function() {
		it('should add the right commands in the queue on position 0', function(done) {
			var expected = [29, 72, 0];
			verifyCommand(expected, 'barcodeTextPosition', 0, done);
		});
		it('should add the right commands in the queue on position 1', function(done) {
			var expected = [29, 72, 1];
			verifyCommand(expected, 'barcodeTextPosition', 1, done);
		});
		it('should add the right commands in the queue on position 2', function(done) {
			var expected = [29, 72, 2];
			verifyCommand(expected, 'barcodeTextPosition', 2, done);
		});
		it('should add the right commands in the queue on position 3', function(done) {
			var expected = [29, 72, 3];
			verifyCommand(expected, 'barcodeTextPosition', 3, done);
		});
		it('should throw an error on invalid positions', function(done) {
			var printer = new Printer(fakeSerialPort);
			printer.on('ready', function() {
				(function() {
					printer.barcodeTextPosition(4);
				}).should.throw(Error);
				done();
			});
		});
		it('should throw an error on invalid positions', function(done) {
			var printer = new Printer(fakeSerialPort);
			printer.on('ready', function() {
				(function() {
					printer.barcodeTextPosition(-1);
				}).should.throw(Error);
				done();
			});
		});
	});

	describe('Printer.barcodeHeight()', function() {
		it('should add the right commands in the queue on height 10', function(done) {
			var expected = [29, 104, 10];
			verifyCommand(expected, 'barcodeHeight', 10, done);
		});
		it('should add the right commands in the queue on height 100', function(done) {
			var expected = [29, 104, 100];
			verifyCommand(expected, 'barcodeHeight', 100, done);
		});
		it('should throw an error on height > 255', function(done) {
			var printer = new Printer(fakeSerialPort);
			printer.on('ready', function() {
				(function() {
					printer.barcodeHeight(256);
				}).should.throw(Error);
				done();
			});
		});
		it('should throw an error on height < 0', function(done) {
			var printer = new Printer(fakeSerialPort);
			printer.on('ready', function() {
				(function() {
					printer.barcodeHeight(-1);
				}).should.throw(Error);
				done();
			});
		});
	});

	describe('Printer.barcode()', function(){
		describe('type UPC-A', function(){
			beforeEach(function(){
				this.type = Printer.BARCODE_TYPES.UPCA;
			});

			it('should add the right commands in the queue', function(done) {
				var data = '012345678901';
				var expected = [29, 107, 65, data.length];
				expected = expected.concat(data.split('').map(function(c){ return c.charCodeAt(0); }));
				verifyCommand(expected, 'barcode', [this.type, data], done);
			});
			it('should throw an "invalid_data_size" error if data length is  > 12', function(done){
				var data = '0123456789011';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			it('should throw an "invalid_data_size" error if data length is  < 11', function(done){
				var data = '0123456789';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			['a','A','+'].forEach(function(v){
				it('should throw an "invalid_character" error if data characters are not numbers', function(done){
					var data = '0123456789' + v;
					verifyBarcodeError(this.type, data, 'invalid_character', done);
				});
			});
		});

		describe('type UPC-E', function(){
			beforeEach(function(){
				this.type = Printer.BARCODE_TYPES.UPCE;
			});

			it('should add the right commands in the queue', function(done) {
				var data = '012345678901';
				var expected = [29, 107, 66, data.length];
				expected = expected.concat(data.split('').map(function(c){ return c.charCodeAt(0); }));
				verifyCommand(expected, 'barcode', [this.type, data], done);
			});
			it('should throw an "invalid_data_size" error if data length is  > 12', function(done){
				var data = '0123456789011';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			it('should throw an "invalid_data_size" error if data length is  < 11', function(done){
				var data = '0123456789';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			['a','A','+'].forEach(function(v){
				it('should throw an "invalid_character" error if data characters are not numbers', function(done){
					var data = '0123456789' + v;
					verifyBarcodeError(this.type, data, 'invalid_character', done);
				});
			});
		});

		describe('type EAN13', function(){
			beforeEach(function(){
				this.type = Printer.BARCODE_TYPES.EAN13;
			});

			it('should add the right commands in the queue', function(done) {
				var data = '0123456789012';
				var expected = [29, 107, 67, data.length];
				expected = expected.concat(data.split('').map(function(c){ return c.charCodeAt(0); }));
				verifyCommand(expected, 'barcode', [this.type, data], done);
			});
			it('should throw an "invalid_data_size" error if data length is  > 13', function(done){
				var data = '01234567890123';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			it('should throw an "invalid_data_size" error if data length is  < 12', function(done){
				var data = '01234567890';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			['a','A','+'].forEach(function(v){
				it('should throw an "invalid_character" error if data characters are not numbers', function(done){
					var data = '01234567890' + v;
					verifyBarcodeError(this.type, data, 'invalid_character', done);
				});
			});
		});

		describe('type EAN8', function(){
			beforeEach(function(){
				this.type = Printer.BARCODE_TYPES.EAN8;
			});

			it('should add the right commands in the queue', function(done) {
				var data = '01234567';
				var expected = [29, 107, 68, data.length];
				expected = expected.concat(data.split('').map(function(c){ return c.charCodeAt(0); }));
				verifyCommand(expected, 'barcode', [this.type, data], done);
			});
			it('should throw an "invalid_data_size" error if data length is  > 8', function(done){
				var data = '012345678';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			it('should throw an "invalid_data_size" error if data length is  < 7', function(done){
				var data = '012345';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			['a','A','+'].forEach(function(v){
				it('should throw an "invalid_character" error if data characters are not numbers', function(done){
					var data = '012345' + v;
					verifyBarcodeError(this.type, data, 'invalid_character', done);
				});
			});
		});

		describe('type CODE39', function(){
			beforeEach(function(){
				this.type = Printer.BARCODE_TYPES.CODE39;
			});

			it('should add the right commands in the queue', function(done) {
				var data = ' $%+-./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
				var expected = [29, 107, 69, data.length];
				expected = expected.concat(data.split('').map(function(c){ return c.charCodeAt(0); }));

				verifyCommand(expected, 'barcode', [this.type, data], done);
			});
			it('should throw an "invalid_data_size" error if data length is  < 1', function(done){
				var data = '0';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			['a','!','é'].forEach(function(v){
				it('should throw an "invalid_character" error if data characters are invalid', function(done){
					var data = '0' + v;
					verifyBarcodeError(this.type, data, 'invalid_character', done);
				});
			});
		});

		describe('type I25', function(){
			beforeEach(function(){
				this.type = Printer.BARCODE_TYPES.I25;
			});

			it('should add the right commands in the queue', function(done) {
				var data = '01';
				var expected = [29, 107, 70, data.length];
				expected = expected.concat(data.split('').map(function(c){ return c.charCodeAt(0); }));
				verifyCommand(expected, 'barcode', [this.type, data], done);
			});
			it('should throw an "invalid_data_size" error if data length is  < 1', function(done){
				var data = '0';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			it('should throw an "invalid_data_size" error if data length is  not even', function(done){
				var data = '012';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			['a','A','+'].forEach(function(v){
				it('should throw an "invalid_character" error if data characters are not numbers', function(done){
					var data = '0' + v;
					verifyBarcodeError(this.type, data, 'invalid_character', done);
				});
			});
		});

		describe('type CODEBAR', function(){
			beforeEach(function(){
				this.type = Printer.BARCODE_TYPES.CODEBAR;
			});

			it('should add the right commands in the queue', function(done) {
				var data = '$+-./0123456789:ABCD';
				var expected = [29, 107, 71, data.length];
				expected = expected.concat(data.split('').map(function(c){ return c.charCodeAt(0); }));
				verifyCommand(expected, 'barcode', [this.type, data], done);
			});
			it('should throw an "invalid_data_size" error if data length is  < 1', function(done){
				var data = '0';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			['?','Z'].forEach(function(v){
				it('should throw an "invalid_character" error if data characters are not valid', function(done){
					var data = '0' + v;
					verifyBarcodeError(this.type, data, 'invalid_character', done);
				});
			});
		});

		describe('type CODE93', function(){
			beforeEach(function(){
				this.type = Printer.BARCODE_TYPES.CODE93;
			});

			it('should add the right commands in the queue', function(done) {
				var data = ' $+-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ~';
				var expected = [29, 107, 72, data.length];
				expected = expected.concat(data.split('').map(function(c){ return c.charCodeAt(0); }));
				verifyCommand(expected, 'barcode', [this.type, data], done);
			});
			it('should throw an "invalid_data_size" error if data length is  < 1', function(done){
				var data = '0';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			['€','™'].forEach(function(v){
				it('should throw an "invalid_character" error if data characters are not ASCII', function(done){
					var data = '0' + v;
					verifyBarcodeError(this.type, data, 'invalid_character', done);
				});
			});
		});

		describe('type CODE128', function(){
			beforeEach(function(){
				this.type = Printer.BARCODE_TYPES.CODE128;
			});

			it('should add the right commands in the queue', function(done) {
				var data = ' $+-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ~';
				var expected = [29, 107, 73, data.length];
				expected = expected.concat(data.split('').map(function(c){ return c.charCodeAt(0); }));
				verifyCommand(expected, 'barcode', [this.type, data], done);
			});
			it('should throw an "invalid_data_size" error if data length is  < 1', function(done){
				var data = '0';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			['€','™'].forEach(function(v){
				it('should throw an "invalid_character" error if data characters are not ASCII', function(done){
					var data = '0' + v;
					verifyBarcodeError(this.type, data, 'invalid_character', done);
				});
			});
		});

		describe('type CODE11', function(){
			beforeEach(function(){
				this.type = Printer.BARCODE_TYPES.CODE11;
			});

			it('should add the right commands in the queue', function(done) {
				var data = '01234567890123456789';
				var expected = [29, 107, 74, data.length];
				expected = expected.concat(data.split('').map(function(c){ return c.charCodeAt(0); }));
				verifyCommand(expected, 'barcode', [this.type, data], done);
			});
			it('should throw an "invalid_data_size" error if data length is  < 1', function(done){
				var data = '0';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			['a','A','+'].forEach(function(v){
				it('should throw an "invalid_character" error if data characters are not numbers', function(done){
					var data = '0' + v;
					verifyBarcodeError(this.type, data, 'invalid_character', done);
				});
			});
		});

		describe('type MSI', function(){
			beforeEach(function(){
				this.type = Printer.BARCODE_TYPES.MSI;
			});

			it('should add the right commands in the queue', function(done) {
				var data = '01234567890123456789';
				var expected = [29, 107, 75, data.length];
				expected = expected.concat(data.split('').map(function(c){ return c.charCodeAt(0); }));
				verifyCommand(expected, 'barcode', [this.type, data], done);
			});
			it('should throw an "invalid_data_size" error if data length is  < 1', function(done){
				var data = '0';
				verifyBarcodeError(this.type, data, 'invalid_data_size', done);
			});
			['a','A','+'].forEach(function(v){
				it('should throw an "invalid_character" error if data characters are not numbers', function(done){
					var data = '0' + v;
					verifyBarcodeError(this.type, data, 'invalid_character', done);
				});
			});
		});
	});
});
