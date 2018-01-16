var SerialPort = require('serialport'),
	serialPort = new SerialPort('/dev/ttyUSB0', {
		baudrate: 19200
	}),
	Printer = require('../src/printer');

serialPort.on('open',function() {
	var opts = {
		maxPrintingDots: 15,
		heatingTime: 150,
		heatingInterval: 4,
		commandDelay: 5
	};
	var printer = new Printer(serialPort, opts);
	printer.on('ready', function() {
		// will print a whole line and go to the next line on paper
		printer.printLine('first line');
		var letters = 'hello world'.split('');
		var invert = false;
		letters.forEach(function(letter) {
			invert = !invert;
			printer
				.printText(letter)
				.inverse(invert);
		});
		printer
			.lineFeed(3)
			.print(function() {
				console.log('done');
				process.exit();
			});
	});
});
