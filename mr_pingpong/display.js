const CLI = require('clui');
const clc = require('cli-color');

var width = 20;
var history = {};
var blankLine = new CLI.Line().fill();

module.exports = {
    gauge: function(label, value, threshold, max, suffix) {
        new CLI.Line()
            .padding(2)
            .column(label, width, [clc.cyan])
            .column(CLI.Gauge(value, max, 20, threshold || (max * 0.8), suffix || value), 40)
            .fill()
            .output();
        return this;
    },
    value: function (label, suffix) {
        return new CLI.Line()
            .padding(2)
            .column(label, width, [clc.cyan])
            .column(suffix, width * 2)
            .fill()
            .output();
        return this;
    },
    sparkline: function (label, value, suffix) {
        var series = history[label] = history[label] || [];
        series.push(item.value);
        if (series.length > width) series.shift();
        new CLI.Line()
            .padding(2)
            .column(label, width, [clc.cyan])
            .column(CLI.Sparkline(series, suffix || value), width * 4)
            .fill()
            .output();
        return this;
    },
    clear: function() {
        CLI.Clear();
        return this;
    },
    blank: function() {
        blankLine.output();
        return this;
    }
};

    /*
    var total = os.totalmem();
    var free = os.freemem();
    var used = total - free;
    var human = Math.ceil(used / 1000000) + ' MB';

    var memoryLine = new Line()
        .padding(2)
        .column('Memory In Use', 20, [clc.cyan])
        .column(Gauge(used, total, 20, total * 0.8, human), 40)
        .fill()
        .output();

    var load = os.loadavg()[0];
    var maxLoad = os.cpus().length * 2;
    var danger = os.cpus().length;
*/
