
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
// Set up SerialPort so we can communicate with the printer via serial
const SerialPort = require('serialport'),
// tell SerialPort where the printer is located and what its communication speed is.
// if you are having trouble finding the printer device name try reading `sudo dmesg` after plugging the printer in 
const serialPort = new SerialPort('/dev/ttyUSB0', {
		baudrate: 19200
	}),
const Printer = require('thermalprinter');

// wait for the SerialPort to open
serialPort.on('open',function() {
	var printer = new Printer(serialPort);
	// once the printer is ready
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
				console.log('done printing');
				process.exit();
			});
	});
});
```

If you want to print multiple different kinds of text in one line (eg: bold and underlined) you can use .addText().

```js
// ... after initializing both SerialPort and Printer
printer
	.bold(true).addText('bold text ').bold(false)
	.underline(true).addText('underlined text').underline(false)
	.print(function() {
		console.log('done printing');
		process.exit();
	});
```

# API
This API uses chained functions, meaning that each method returns `Printer`. Each call adds commands to the internal command queue and .print() sends those commands to the printer.

### Meta Commands 
-----

#### new Printer (SerialPort, Opts)
	Opts: {
		// maxPrintingDots = 0-255. Max heat dots, Unit (8dots), Default: 7 (64 dots)
		maxPrintingDots: 7
		// heatingTime = 3-255. Heating time, Unit (10us), Default: 80 (800us)
		heatingTime: 80
		// heatingInterval = 0-255. Heating interval, Unit (10µs), Default: 2 (20µs)
		heatingInterval: 2
		commandDelay: 0
		charset: 0
		chineseFirmware: false
	}
	
The more max heating dots, the more peak current will cost when printing, the faster printing speed. The max heating dots is 8*(n+1).

The more heating time, the more density, but the slower printing speed. If heating time is too short, blank page may occur.

The more heating interval, the more clear, but the slower printing speed.

#### Printer.print() 
Sends queued commands to the printer.

#### Printer.reset()
Hardware reset

#### Printer.setCharset(number)
Sets character set.

| code | character set |
|--|--|
| 0 | USA |
| 1 | France |
| 2 | Germany |
| 3 | UK |
| 4 | Denmark I|
| 5 | Sweden |
| 6 | Italy |
| 7 | Spain I|
| 8 | Japan |
| 9 | Norway |
| 10 | Denmark II|
| 11 | Spain II|
| 12 | Latin America|
| 13 | Korea |
| 14 | Slovenia/Croatia |
| 15 | China |


These were taken from the [CSN-A2 Micro User Manual](https://cdn-shop.adafruit.com/datasheets/CSN-A2+User+Manual.pdf). Values may change based on your specific hardware.

#### Printer.setCharCodeTable(number)
Sets character code table. See [User Manual Page 28](https://cdn-shop.adafruit.com/datasheets/CSN-A2+User+Manual.pdf) (or the manual for your hardware) for exact codes.

#### Printer.testPage()
Prints out the test page.

#### Printer.hasPaper(cb)
Returns a boolean representing if the printer has paper or not.


### Printing Commands 
---

#### Printer.printText(string) / Printer.addText(string)
Writes the specified text to the paper. Unlike Printer.printLine() this does not end with a newline

#### Printer.printLine(string)
Writes the specified line to the paper. If you want multiple different text modes in one line (eg. bold and italic in the same line) use .printText() / .addText()

#### Printer.lineFeed(number?)
Writes specified number of lines to the printer, default is 1.

#### Printer.bold(boolean)
Enables or disables bold mode.

#### Printer.big(boolean)
Enables or disables large text mode.

#### Printer.underline(boolean | number)
Enables or disables underlined text mode. If passed a number, the number represents the thickness of the underline. 

#### Printer.small(boolean)
Enables or disables small text mode.

#### Printer.upsideDown(boolean)
Enables or disables upside down text mode.

#### Printer.inverse(boolean)
Enables or disables inverted text mode. This causes the text to have a black background and white text.

#### Printer.left()
Left justifies the text that follows.

#### Printer.right()
Right justifies the text that follows.

#### Printer.center()
Center justifies the text that follows

#### Printer.indent(number)
Sets text indentation. Number must be between 0-31.

#### Printer.setLineSpacing(number)
Sets vertical line spacing.

#### Printer.horizontalLine(number)
Draws a horizontal line of the specified length. Number must be between 0-32. Some printer hardware is known to not support this properly. As a workaround you can call .printLine('_____')

#### Printer.printImage(image: string, type?: string)
Print an image from a path:
	.printImage('/path/to/image.png')
Print an image from a buffer
	.printImage(Buffer, 'image/png')

#### Printer.barcode(type: string, data: array)
Prints a barcode.

### Advanced Commands 
-----
If you want more fine control over your printer, you can directly write commands to the printer using these functions.

#### Printer.writeCommand(number)
Writes the specified command (in decimal) to command queue. 

#### Printer.writeCommands(number[])
Writes the specified commands (in decimal) to command queue. 

## Demo

![demo](/images/demo.gif)
