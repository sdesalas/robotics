var assert = require('assert');
var Pattern = require('../lib/Pattern.js');


describe('lib/Pattern.js', function() {
  it('new Pattern()', function() {
    var options = {
      maxLength: 10
    };
    var pattern = new Pattern(options);

    assert(pattern !== undefined, 'new Pattern()');
    assert(pattern instanceof Pattern, 'new Pattern()');
    assert(pattern.options === options, 'pattern.options');
    assert(pattern.update instanceof Function, 'pattern.update()');
    assert(pattern.clear instanceof Function, 'pattern.clear()');
    assert(pattern.compare instanceof Function, 'pattern.compare()');
    assert(pattern.sensorCycle instanceof Array, 'pattern.sensorCycle');
    assert(pattern.sensorCycle.length === 0, 'pattern.sensorCycle');
    assert(pattern.buffer instanceof Array, 'pattern.buffer');
    assert(pattern.buffer.length === 0, 'pattern.buffer');

  });

  describe('pattern.compare(expected, actual)', function() {
    var pattern = new Pattern();

    it('Compares two strings and returns deviation', function() {
      assert.strictEqual(pattern.compare('a', 'a'), 0);
      assert.strictEqual(pattern.compare('a', 'b'), 1);
      assert.strictEqual(pattern.compare('aa', 'ab'), 0.5);
      assert.strictEqual(pattern.compare('aaa', 'abc'), 2/3);
      assert.strictEqual(pattern.compare('abc', 'abd'), 1/3);
      assert.strictEqual(pattern.compare('abc', 'ab'), 1/3);
      assert.strictEqual(pattern.compare('abc', 'abcd'), 1/4);
      assert.strictEqual(pattern.compare('abc', 'abcde'), 2/5);
      assert.strictEqual(pattern.compare('ab', 'abcde'), 3*(1/5));
      assert.strictEqual(pattern.compare('abc', 'abcdef'), 1/2);
      assert.strictEqual(pattern.compare('', 'abc'), 1);
    });

    it('Compares two strings and uses history to return deviation', function() {
      assert.strictEqual(pattern.compare('a', 'a', ['a']), 0);
      assert.strictEqual(pattern.compare('a', 'b', ['b']), 1);
      assert.strictEqual(pattern.compare('a', 'b', ['a']), 0.5);
      assert.strictEqual(pattern.compare('a', 'b', ['a', 'b']), 2/3);
      assert.strictEqual(pattern.compare('a', 'b', ['b', 'a', 'b']), 3/4);
      assert.strictEqual(pattern.compare('ab', 'aa', ['aa', 'aa']), 0.5);
      assert.strictEqual(pattern.compare('ab', 'aa', ['ab', 'aa']), 2/6);
      assert.strictEqual(pattern.compare('aaa', 'abc', ['aba', 'aaa', '']), (1/12)+(1/12)+(1/12)+(1/12)+(1/12)+(1/12));
      assert.strictEqual(pattern.compare('aaa', 'abc', ['aba', 'aa', 'vsad']), 10/16);
    });

  });

  describe('pattern.update()', function() {

    it('Can be chained', () => {
      var pattern = new Pattern();
      assert(pattern.update('one') === pattern);
    });

    it('Tracks patterns, detects changes', () => {
      var pattern = new Pattern();
      pattern.update('one');
      assert.deepEqual(pattern.buffer, ['one']);
      assert.deepEqual(pattern.sensorCycle, ['one']);
      assert.deepEqual(pattern.lastUpdate , {data: 'one', expected: undefined, deviation: 1, surprise: 0});
      pattern.update('two');
      assert.deepEqual(pattern.buffer, ['one', 'two']);
      assert.deepEqual(pattern.sensorCycle, ['one', 'two']);
      assert.deepEqual(pattern.lastUpdate , {data: 'two', expected: undefined, deviation: 1, surprise: 0});
      pattern.update('three');
      assert.deepEqual(pattern.buffer, ['one', 'two', 'three']);
      assert.deepEqual(pattern.sensorCycle, ['one', 'two', 'three']);
      assert.deepEqual(pattern.lastUpdate , {data: 'three', expected: undefined, deviation: 1, surprise: 0});
      pattern.update('one');
      assert.deepEqual(pattern.buffer, ['one', 'two', 'three', 'one']);
      assert.deepEqual(pattern.sensorCycle, ['two', 'three', 'one']);
      assert.deepEqual(pattern.lastUpdate , {data: 'one', expected: undefined, deviation: 0, surprise: 0});
      assert.deepEqual(pattern.sensorHistory[0] , ['one']);
      pattern.update('two');
      assert.deepEqual(pattern.buffer, ['one', 'two', 'three', 'one', 'two']);
      assert.deepEqual(pattern.sensorCycle, ['three', 'one', 'two']);
      assert.deepEqual(pattern.lastUpdate , {data: 'two', expected: 'two', deviation: 0, surprise: 0});
      assert.deepEqual(pattern.sensorHistory[1] , ['two']);
      pattern.update('thr33');
      assert.deepEqual(pattern.buffer, ['one', 'two', 'three', 'one', 'two', 'thr33']);
      assert.deepEqual(pattern.sensorCycle, ['one', 'two', 'thr33']);
      assert.deepEqual(pattern.lastUpdate , {data: 'thr33', expected: 'three', deviation: 4/10, surprise: 1});
      assert.deepEqual(pattern.sensorHistory[2] , ['three']);
      pattern.update('one');
      assert.deepEqual(pattern.buffer, ['one', 'two', 'three', 'one', 'two', 'thr33', 'one']);
      assert.deepEqual(pattern.sensorCycle, ['two', 'thr33', 'one']);
      assert.deepEqual(pattern.lastUpdate, {data: 'one', expected: 'one', deviation: 0, surprise: 0});
      assert.deepEqual(pattern.sensorHistory[0] , ['one', 'one']);
      pattern.update('two');
      assert.deepEqual(pattern.buffer, ['one', 'two', 'three', 'one', 'two', 'thr33', 'one', 'two']);
      assert.deepEqual(pattern.sensorCycle, ['thr33', 'one', 'two']);
      assert.deepEqual(pattern.lastUpdate, {data: 'two', expected: 'two', deviation: 0, surprise: 0});
      assert.deepEqual(pattern.sensorHistory[1] , ['two', 'two']);
      pattern.update('three');
      assert.deepEqual(pattern.buffer, ['one', 'two', 'three', 'one', 'two', 'thr33', 'one', 'two', 'three']);
      assert.deepEqual(pattern.sensorCycle, ['one', 'two', 'three']);
      assert.deepEqual(pattern.lastUpdate, {data: 'three', expected: 'thr33', deviation: 3/15, surprise: 0});
      assert.deepEqual(pattern.sensorHistory[2] , ['thr33', 'three']);
    });

    function filterChanges(pattern, cycles) {
      return cycles.map(cycle =>
        cycle
          .map(data => pattern.update(data).lastUpdate)
          .filter(update => update.surprise)
      ).reduce((last, next) => last.concat(next));
    }

    it('Detects single DIGITAL sensor changes during repetitive cycles.', () => {
      var cycles = [
        ['C:0', 'D:0', 'X:1', 'b:0', 'R:1'],
        ['C:0', 'D:0', 'X:1', 'b:0', 'R:1'],
        ['C:0', 'D:0', 'X:1', 'b:0', 'R:1'],
        ['C:0', 'D:0', 'X:1', 'b:1', 'R:1'],
        ['C:0', 'D:0', 'X:1', 'b:1', 'R:1'],
        ['C:0', 'D:0', 'X:1', 'b:1', 'R:1'],
        ['C:0', 'D:0', 'X:1', 'b:1', 'R:1'],
        ['C:0', 'D:0', 'X:1', 'b:1', 'R:1'],
        ['C:0', 'D:0', 'X:1', 'b:1', 'R:1'],
        ['C:0', 'D:0', 'X:1', 'b:1', 'R:1'],
        ['C:0', 'D:0', 'X:1', 'b:1', 'R:1'],
        ['C:0', 'D:0', 'X:1', 'b:0', 'R:1']
      ], pattern = new Pattern();

      assert.deepStrictEqual(filterChanges(pattern, cycles), [
        {data: 'b:1', expected: 'b:0', deviation: 1/3, surprise: 1},
        {data: 'b:0', expected: 'b:1', deviation: 1/3, surprise: 1}
      ]);

    });

    it('Detects single ANALOG sensor changes during repetitive cycles', () => {
      var cycles = [
        ['C:0', 'D:0', 'X:1', 'a:0', 'b:0', 'L:121', 'R:0'],
        ['C:0', 'D:0', 'X:1', 'a:0', 'b:0', 'L:123', 'R:0'],
        ['C:0', 'D:0', 'X:1', 'a:0', 'b:0', 'L:126', 'R:0'],
        ['C:0', 'D:0', 'X:1', 'a:0', 'b:0', 'L:67', 'R:0'],
        ['C:0', 'D:0', 'X:1', 'a:0', 'b:0', 'L:120', 'R:0'],
        ['C:0', 'D:0', 'X:1', 'a:0', 'b:0', 'L:119', 'R:0'],
        ['C:0', 'D:0', 'X:1', 'a:0', 'b:0', 'L:120', 'R:0']
      ], pattern = new Pattern();

      assert.deepStrictEqual(filterChanges(pattern, cycles), [
        {data: 'L:67', expected: 'L:126', deviation: 9*(1/15), surprise: 1},
        {data: 'L:120', expected: 'L:67', deviation: 5*(1/15), surprise: 1},
        {data: 'L:119', expected: 'L:120', deviation: (1/20)+(1/20)+(1/20)+(1/20)+(1/20)+(1/20)+(1/20)+(1/20)+(1/20), surprise: 1},
        {data: 'L:120', expected: 'L:119', deviation: (1/20)+(1/20)+(1/20)+(1/20)+(1/20)+(1/20), surprise: 1}
      ]);

    });

  });

});
