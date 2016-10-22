var os = require('os');
var util = require('util');
var assert = require('./assert-extra');
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
      assert.equal(pattern.compare('a', 'a'), 0);
      assert.around(pattern.compare('a', 'b'), 0.67);
      assert.around(pattern.compare('a', 'z'), 0.98);
      assert.around(pattern.compare('aa', 'ab'), 0.3);
      assert.around(pattern.compare('aaa', 'abc'), 0.5);
      assert.around(pattern.compare('abc', 'abd'), 0.25);
      assert.around(pattern.compare('abc', 'ab'), 0.4);
      assert.around(pattern.compare('abc', 'abcd'), 0.3);
      assert.around(pattern.compare('abc', 'abcde'), 0.5);
      assert.around(pattern.compare('ab', 'abcde'), 0.65);
      assert.around(pattern.compare('abc', 'abcdef'), 0.55);
      assert.around(pattern.compare('abc', 'azxp'), 0.8);
      assert.equal(pattern.compare('', 'abc'), 1, 1);
    });

    it('Compares two strings and uses history to return deviation', function() {
      assert.equal(pattern.compare('a', 'a', ['a']), 0);
      assert.around(pattern.compare('a', 'b', ['b']), 0.67);
      assert.around(pattern.compare('a', 'b', ['a']), 0.3);
      assert.around(pattern.compare('a', 'b', ['a', 'x']), 0.55);
      assert.around(pattern.compare('a', 'b', ['b', 'a', 'b']), 0.5);
      assert.around(pattern.compare('ab', 'aa', ['aa', 'aa']), 0.33);
      assert.around(pattern.compare('ab', 'aa', ['ab', 'aa']), 0.2);
      assert.around(pattern.compare('aaa', 'abc', ['aba', 'aaa', '']), 0.5);
      assert.around(pattern.compare('aaa', 'abc', ['aba', 'aa', 'vsad']), 0.6);
      assert.around(pattern.compare('aaa', 'xzr', ['aba', 'aa', 'xif']), 0.7);
      assert.around(pattern.compare('aaa', 'xzr', ['xAg', '', 'xif']), 0.99);
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
      assert.equal(pattern.lastUpdate.surprise, 1);
      assert.around(pattern.lastUpdate.deviation, 0.4);
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
      assert.equal(pattern.lastUpdate.surprise, 1);
      assert.around(pattern.lastUpdate.deviation, 0.2);
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
        ['0C:0', '0D:0', '0X:1', '0b:0', '0R:1'],
        ['0C:0', '0D:0', '0X:1', '0b:0', '0R:1'],
        ['0C:0', '0D:0', '0X:1', '0b:0', '0R:1'],
        ['0C:0', '0D:0', '0X:1', '0b:1', '0R:1'],
        ['0C:0', '0D:0', '0X:1', '0b:1', '0R:1'],
        ['0C:0', '0D:0', '0X:1', '0b:1', '0R:1'],
        ['0C:0', '0D:0', '0X:1', '0b:1', '0R:1'],
        ['0C:0', '0D:0', '0X:1', '0b:1', '0R:1'],
        ['0C:0', '0D:0', '0X:1', '0b:1', '0R:1'],
        ['0C:0', '0D:0', '0X:1', '0b:1', '0R:1'],
        ['0C:0', '0D:0', '0X:1', '0b:1', '0R:1'],
        ['0C:0', '0D:0', '0X:1', '0b:1', '0R:1'],
        ['0C:0', '0D:0', '0X:1', '0b:0', '0R:1'],
        ['0C:0', '0D:0', '0X:1', '0b:0', '0R:1'],
        ['0C:0', '0D:0', '0X:1', '0b:0', '0R:1']
      ], pattern = new Pattern({ history: 3 });

      var result = filterChanges(pattern, cycles);

      assert.compareObjectsAndIgnore(result, [
        {data: '0b:1', expected: '0b:0', deviation: 0.2, surprise: 1},
        {data: '0b:0', expected: '0b:1', deviation: 0.2, surprise: 1}
      ], ['deviation']);
      assert.around(result[0].deviation, 0.2);
      assert.around(result[1].deviation, 0.2);

    });

    it('Detects single ANALOG sensor changes during repetitive cycles', () => {
      var cycles = [
        ['0C:0', '0D:0', '0X:1', '0a:0', '0b:0', '0L:123', '0R:0'],
        ['0C:0', '0D:0', '0X:1', '0a:0', '0b:0', '0L:120', '0R:0'],
        ['0C:0', '0D:0', '0X:1', '0a:0', '0b:0', '0L:121', '0R:0'],
        ['0C:0', '0D:0', '0X:1', '0a:0', '0b:0', '0L:123', '0R:0'],
        ['0C:0', '0D:0', '0X:1', '0a:0', '0b:0', '0L:126', '0R:0'],
        ['0C:0', '0D:0', '0X:1', '0a:0', '0b:0', '0L:67',  '0R:0'],
        ['0C:0', '0D:0', '0X:1', '0a:0', '0b:0', '0L:120', '0R:0'],
        ['0C:0', '0D:0', '0X:1', '0a:0', '0b:0', '0L:119', '0R:0'],
        ['0C:0', '0D:0', '0X:1', '0a:0', '0b:0', '0L:120', '0R:0']
      ], pattern = new Pattern({ history: 10 });

      var result = filterChanges(pattern, cycles);

      assert.compareObjectsAndIgnore(result, [
        {data: '0L:67', expected: '0L:126', deviation: 0.5, surprise: 1},
        {data: '0L:120', expected: '0L:67', deviation: 0.2, surprise: 1},
        {data: '0L:119', expected: '0L:120', deviation: 0.3, surprise: 1},
        {data: '0L:120', expected: '0L:119', deviation: 0.2, surprise: 1}
      ], ['deviation']);
      assert.around(result[0].deviation, 0.5);
      assert.around(result[1].deviation, 0.2);
      assert.around(result[2].deviation, 0.3);

    });

    describe('Performance', () => {
      var cycle = [ 'C:0', 'D:0', 'X:1', 'a:0', 'b:0', 'L:121', 'R:0', 'G:0'],
          pattern,
          limitMB = 30,
          startRAM = os.freemem() / os.totalmem();

      beforeEach(() => {
        pattern = new Pattern({ history: 5 });
      });

      function executeUpdates(pattern, cycle, runs, showlog) {
        if (showlog) console.log('executeUpdates() x %d', runs);
        for(var i = 0; i < runs; i++) {
          cycle.forEach(item => {
            if (Math.random() > 0.9) item = item + '2';
            pattern.update(item);
          });
          if (showlog && i % (runs /10) === 0) {
            console.log("free:%s%, rss:%d", (os.freemem() / os.totalmem() * 100).toFixed(2), process.memoryUsage().rss / 1024 / 1024);
          }
        }
        return process.memoryUsage().rss / 1024 / 1024;
      }

      it('1,000 updates in 5s and uses <30MB of RAM', function() {
        this.timeout(5000);
        var rss = executeUpdates(pattern, cycle, 1 * 1000);
        assert(rss < limitMB, util.format('Uses less than %dMB of RAM (actual %sMB)', limitMB, rss.toFixed()));
      });

      it('5,000 updates in 10s and uses <30MB of RAM', function() {
        this.timeout(10000);
        var rss = executeUpdates(pattern, cycle, 5 * 1000);
        assert(rss < limitMB, util.format('Uses less than %dMB of RAM (actual %sMB)', limitMB, rss.toFixed()));
      });

      it('10,000 updates in 15s and uses <30MB of RAM', function() {
        this.timeout(15000);
        var rss = executeUpdates(pattern, cycle, 10 * 1000);
        assert(rss < limitMB, util.format('Uses less than %dMB of RAM (actual %sMB)', limitMB, rss.toFixed()));
      });

      it('50,000 updates in 60s and uses <30MB of RAM', function() {
        this.timeout(60000);
        var rss = executeUpdates(pattern, cycle, 50 * 1000);
        assert(rss < limitMB, util.format('Uses less than %dMB of RAM (actual %sMB)', limitMB, rss.toFixed()));
      });

    });

  });

});
