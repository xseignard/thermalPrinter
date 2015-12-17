# Control the Adafruit/Sparkfun thermal printer from node.js

[![npm](https://img.shields.io/npm/v/thermalprinter.svg?style=flat-square)](https://www.npmjs.com/package/thermalprinter) [![Travis](https://img.shields.io/travis/xseignard/thermalPrinter.svg?style=flat-square)](https://travis-ci.org/xseignard/thermalPrinter) [![Code Climate](https://img.shields.io/codeclimate/coverage/github/xseignard/thermalPrinter.svg?style=flat-square)](https://codeclimate.com/github/xseignard/thermalPrinter/coverage)

Largely inspired by http://electronicfields.wordpress.com/2011/09/29/thermal-printer-dot-net/

You can print images, but they need to be 384px wide.

It's a fluent API, so you can chain functions, but don't forget to call `print` at the end to actually print something!

## Crappy schematics

You'll need an USB/Serial converter.

![schematics](/images/schema.png)


## Usage
- install with `npm install thermalprinter --save` 
- check the demo sample:

```js
var SerialPort = require('serialport').SerialPort,
	serialPort = new SerialPort('/dev/ttyUSB0', {
		baudrate: 19200
	}),
	Printer = require('thermalprinter');

var path = __dirname + '/images/nodebot.png';

serialPort.on('open',function() {
	var printer = new Printer(serialPort);
	printer.on('ready', function() {
		printer
			.indent(10)
			.horizontalLine(16)
			.bold(true)
			.indent(10)
			.printLine('first line')
			.bold(false)
			.inverse(true)
			.big(true)
			.right()
			.printLine('second line')
			.printImage(path)
			.print(function() {
				console.log('done');
				process.exit();
			});
	});
});
```

## Demo

![demo](/images/demo.gif)
