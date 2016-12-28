"use strict";

var fs = require('fs');
var fsr = require('fs-reverse');
var http = require('http');
var HttpDispatcher = require('httpdispatcher');
const Observable = require('events');

class Api extends Observable {

    constructor(options) {
        super();
        options = options || {};
        this.port = options.port || 8199;
        this.state = options.state || {};
        this.router = new HttpDispatcher();
        this.router.setStatic('/static');
        this.router.setStaticDirname('static');
        this.router.onGet('/', this.getRoot.bind(this));
        this.router.onGet('/memory', this.getMemory.bind(this));
        this.router.onGet('/log', this.getLog.bind(this));
        this.router.onError(this.onError);
        this.server = http.createServer((req, res) => {
            this.router.dispatch(req, res);
        }).listen(this.port, '127.0.0.1');
    }

    getRoot(req, res) {
        res.writeHead(302, {'Location': 'static/index.html'});
        res.end();
    }

    getMemory(req, res) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(this.state.memory, null, 2));
    }

    getLog(req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        fsr('mind.log', {matcher: /(\r?\n)/}).pipe(res);
    }

    onError(req, res) {
        res.writeHead(404);
        res.end('Not Found');
    }

}

if (typeof module !== 'undefined') {
  module.exports = Api;
}