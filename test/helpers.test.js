'use strict';
/*jshint expr: true*/
var should = require('chai').should(),
	Helpers = require('../src/helpers');

describe('Helpers', function() {

	describe('Helpers.rgbToHsl', function() {
		it('should convert black rgb color to black hsl', function() {
			var hsl = Helpers.rgbToHsl(0,0,0);
			hsl[0].should.equal(0);
			hsl[1].should.equal(0);
			hsl[2].should.equal(0);
		});
		it('should convert rgb color to hsl', function() {
			var hsl = Helpers.rgbToHsl(122,152,17);
			hsl[0].should.equal(0.20370370370370372);
			hsl[1].should.equal(0.7988165680473374);
			hsl[2].should.equal(0.33137254901960783);
		});
		it('should convert rgb color to hsl', function() {
			var hsl = Helpers.rgbToHsl(152,122,17);
			hsl[0].should.equal(0.12962962962962962);
			hsl[1].should.equal(0.7988165680473374);
			hsl[2].should.equal(0.33137254901960783);
		});
		it('should convert rgb color to hsl', function() {
			var hsl = Helpers.rgbToHsl(152,122,170);
			hsl[0].should.equal(0.7708333333333334);
			hsl[1].should.equal(0.220183486238532);
			hsl[2].should.equal(0.5725490196078431);
		});
	});

	describe('Helpers.uint8ArrayToBuffer', function() {
		it('should convert a uint8Array to a buffer', function() {
			var uint8Array = new Uint8Array(3);
			uint8Array[0] = 1;
			uint8Array[1] = 1;
			uint8Array[2] = 1;
			var buffer = Helpers.uint8ArrayToBuffer(uint8Array);
			buffer[0].should.equal(1);
			buffer[1].should.equal(1);
			buffer[2].should.equal(1);
		});
	});
});
