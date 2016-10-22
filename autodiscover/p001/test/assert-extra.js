var util = require('util');
var assert = require('assert');

assert.between = function (val, from, to, msg) {
  from = from || 0;
  to = to || 0;
  return assert(val >= from && val <= to, msg || util.format('%s between %s and %s', val.toFixed(2), from.toFixed(2), to.toFixed(2)));
};

assert.around = function (val, estimate, msg) {
  var from, to;
  estimate = estimate || 0;
  if (estimate === 0) {
    from = -0.2;
    to = 0.2;
  }
  else if (Math.abs(estimate) < 1) {
    from = estimate - 0.1;
    to = estimate + 0.1;
  } else {
    from = estimate * 0.8;
    to = estimate * 1.2;
  }
  return assert.between(val, from, to, util.format('%s around %s', val.toFixed(2), estimate.toFixed(2)));
}

assert.compareObjectsAndIgnore = function (actual, expected, ignore, msg) {
  actual = JSON.parse(JSON.stringify(actual));
  expected = JSON.parse(JSON.stringify(expected));
  if (ignore && ignore instanceof Array) {
    ignore.forEach(field => {
      actual.forEach(obj => delete obj[field]);
      expected.forEach(obj => delete obj[field]);
    });
  }
  return assert.deepStrictEqual(actual, expected, msg);
}

module.exports = assert;
