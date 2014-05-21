'use strict';
module.exports.rgbToHsl = function(r, g, b) {
	// bound values from 0 to 1
	r /= 255;
	g /= 255;
	b /= 255;

	var max = Math.max(r, g, b),
		min = Math.min(r, g, b);

	var h, s, l = (max+min)/2;

	if (max == min) {
		h = s = 0; // achromatic
	}
	else {
		var d = max-min;
		s = l > 0.5 ? d/(2-max-min) : d/(max+min);
		switch (max) {
			case r:
				h = (g-b)/d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b-r)/d + 2;
				break;
			case b:
				h = (r-g)/d + 4;
				break;
		}
		h /= 6;
	}
	return [h, s, l];
};

module.exports.uint8ArrayToBuffer = function (array) {
	var buf = new Buffer(array.byteLength);
	var view = new Uint8Array(array);
	for (var i = 0; i < buf.length; ++i) {
		buf[i] = view[i];
	}
	return buf;
};
