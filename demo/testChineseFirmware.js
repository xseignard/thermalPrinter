var SerialPort = require('serialport'),
	serialPort = new SerialPort('/dev/ttyUSB0', {
		baudrate: 19200
	}),
	specialChars = require('../src/specialChars.js'),
	Printer = require('../src/printer');

var testChars = '';
for (var char in specialChars) {
	testChars += char;
}
console.log(testChars);

serialPort.on('open',function() {
	var opts = {
		maxPrintingDots: 15,
		heatingTime: 150,
		heatingInterval: 4,
		commandDelay: 5,
		chineseFirmware: true
	};
	var printer = new Printer(serialPort, opts);
	printer.on('ready', function() {
		printer
			.printLine(testChars)
			.lineFeed(2)
			.print(function() {
				console.log('done');
				process.exit();
			});
	});
});
