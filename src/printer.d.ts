export = Printer;
import type SerialPort from 'serialport'

interface ThermalPrinterOptions{
  maxPrintingDots: number
  heatingTime: number
  heatingInterval: number
  commandDelay: number
  chineseFirmware: boolean
  charset: number
}

declare class Printer {
  constructor(serialPort: SerialPort, opts?: ThermalPrinterOptions);
  // for some reason TS doesnt like us exporting EventEmitter so we define EventEmitter.on() explicitly here, this is bad practice
  on(name: string, cb: ()=>void)


  writeCommand(command: number): Printer;
  writeCommands(commands: number[]): Printer;
  sendPrintingParams(): Printer;

  print(callback?: (err:any)=>void): Printer;
  reset(): Printer;
  setCharset(code: number): Printer;
  setCharCodeTable(code: number): Printer;
  testPage(): Printer;
  hasPaper(callback?: (hasPaper: boolean)=>any): void;
  lineFeed(linesToFeed: number): Printer;
  addPrintMode(mode: number): Printer;
  removePrintMode(mode: number): Printer;
  bold(onOff: boolean): Printer;
  big(onOff: boolean): Printer;
  underline(dots: boolean|0|1|2): Printer;
  small(onOff: boolean): Printer;
  upsideDown(onOff: boolean): Printer;
  inverse(onOff: boolean): Printer;
  left(): Printer;
  right(): Printer;
  center(): Printer;
  indent(columns: number): Printer;
  setLineSpacing(lineSpacing: number): Printer;
  horizontalLine(length: number): Printer;
  printText(text: string): Printer;
  addText(text: string): Printer;
  printLine(text: string): Printer;
  printImage(path: Buffer | string, type?: string): Printer;

  barcodeTextPosition(pos: 0|1|2|3): Printer;
  barcodeHeight(h: number): Printer;
  barcode(type: any, data: any): Printer; // UNKNOWN
}
