const CLI = require('clui');
const clc = require('cli-color');

var width = 20;
var history = {};
var blankLine = new CLI.Line().fill();

module.exports = {
    gauge: function(label, value=0, threshold=0, max=1, suffix) {
        new CLI.Line()
            .padding(2)
            .column(String(label), width, [clc.cyan])
            .column(CLI.Gauge(value, max, 20, threshold || (max * 0.8), String(suffix || value)), 40)
            .fill()
            .output();
        return this;
    },
    value: function (label, suffix, color) {
        color = clc[color] || clc.white;
        new CLI.Line()
            .padding(2)
            .column(String(label), width * 1.5, [clc.cyan])
            .column(String(suffix), width * 1.5, [color])
            .fill()
            .output();
        return this;
    },
    sparkline: function (label, value=0, suffix) {
        var series = history[label] = history[label] || [];
        series.push(item.value);
        if (series.length > width) series.shift();
        new CLI.Line()
            .padding(2)
            .column(String(label), width, [clc.cyan])
            .column(CLI.Sparkline(series, String(suffix || value)), width * 4)
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
    },
    text: function(label, color) {
        color = clc[color] || clc.white;
        new CLI.Line()
            .padding(2)
            .column(String(label), String(label).width, [color])
            .fill()
            .output();
        return this;
    }
};
