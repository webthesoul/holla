// index.js
var config = require('./Config-debug.js');
var winston = require('winston');
var moment = require('moment-timezone');
var server = require('./Server');

console.log("starting logger...");

winston.add(winston.transports.DailyRotateFile, {
	json: false,
	filename: config.logger.api,
	datePattern: '.dd-MM-yyyy',
	timestamp: function() {
		return moment().tz('Australia/Sydney').format('HH:mm:ss.SSS Z');
	}
});

winston.handleExceptions(new winston.transports.DailyRotateFile({
	json: false,
	filename: config.logger.exception,
	datePattern: '.dd-MM-yyyy',
	timestamp: function() {
		return moment().tz('Australia/Sydney').format('HH:mm:ss.SSS Z');
	}
}));

console.log("logger started.");

server.start();