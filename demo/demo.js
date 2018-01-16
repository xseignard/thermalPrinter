var SerialPort = require('serialport'),
	serialPort = new SerialPort('/dev/ttyUSB0', {
		baudrate: 19200
	}),
	Printer = require('../src/printer');

var nodebots = __dirname + '/../images/nodebot.png';
var logo = __dirname + '/../images/logo.png';

serialPort.on('open',function() {
	var opts = {
		maxPrintingDots: 15,
		heatingTime: 150,
		heatingInterval: 4,
		commandDelay: 5
	};
	var printer = new Printer(serialPort, opts);
	printer.on('ready', function() {
		printer
			.indent(10)
			.horizontalLine(16)
			.bold(true)
			.printLine('first line')
			.bold(false)
			.inverse(true)
			.big(true)
			.right()
			.printLine('second line')
			.printImage(logo)
			.lineFeed(3)
			.printImage(nodebots)
			.print(function() {
				console.log('done');
				process.exit();
			});
	});
});
