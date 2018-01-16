var SerialPort = require('serialport'),
	serialPort = new SerialPort('/dev/ttyUSB0', {
		baudrate: 19200
	}),
	Printer = require('../src/printer');

serialPort.on('open',function() {
	var printer = new Printer(serialPort, opts);
	printer.hasPaper(function(paper) {
		console.log(paper);
		process.exit();
	});
});
