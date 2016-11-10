"use strict";

const fs = require('fs');

class Pattern extends Array {

	// 32bit Hash code (ie 'b3a801a')
	get hash() {
		var str = this.filter(s => !(typeof s === 'string' && s.length === 0)).join('|');
    var char, num = 0, hash = '00000000';
    if (str.length == 0) return hash;
    for (var i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        num = ((num<<5)-num)+char;
        num = num & num; // Convert to 32bit integer
    }
		hash = Math.abs(num).toString(16);
		while(hash.length < 8) {
			hash = '0' + hash;
		}
    return hash;
	}

	// Mutates pattern (factor between 0 and 1)
	mutate(factor) {
		factor = (factor >= 0 && factor <= 1) ? factor : 0.1;
		var pattern = new Pattern();
		do {
			pattern.length = 0;
			this.forEach((item, index) => {
				var rand = Math.random(), range = Math.floor(Math.random() * factor * 20);
				// Randomize charcode
				if (rand <= factor / 2)
					pattern.push(
						String(item)
							.split('')
							.map((chr, index) => String.fromCharCode(
								String(item).charCodeAt(index) + range*2 - range
							))
							.join('')
					);
				// Swap with another item from same array
				else if (rand <= factor) pattern.push(this[index + range*2 - range] || this[index]);
				// Or just return as is
				else pattern.push(item)
			});
		} while (pattern.hash === this.hash)
		return pattern;
	}

}

if (typeof module !== 'undefined') {
	module.exports = Pattern;
}
