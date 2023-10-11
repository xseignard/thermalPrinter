var SerialPort = require('serialport'),
	serialPort = new SerialPort('/dev/ttyUSB0', {
		baudRate: 19200
	}),
	Printer = require('../src/printer');

var opts = {
    maxPrintingDots: 15,
    heatingTime: 150,
    heatingInterval: 4,
    commandDelay: 5
};

serialPort.on('open',async function() {
	var printer = new Printer(serialPort, opts);
	await printer.hasPaper();
	console.log(paper);
	process.exit();
});
