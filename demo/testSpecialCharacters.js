var SerialPort = require('serialport'),
	serialPort = new SerialPort('/dev/ttyUSB0', {
		baudrate: 19200
	}),
	codePage = require('../src/codePage.js').PC437,
	Printer = require('../src/printer');

console.log(codePage);

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
			.printLine(codePage)
			.lineFeed(2)
			.print(function() {
				console.log('done');
				process.exit();
			});
	});
});
