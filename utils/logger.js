// logger.js
var winston = require('winston');

function log(level, message) {
	winston.log(level, message);
}

function info(message, req, userId) {
	winston.log('info', message + '. Request' + (userId ? ' by User ID ' + userId : '') + ' from IP ' + req.connection.remoteAddress);
}

function responseError(status, error, req, res, responseError, printErrStack) {
	if (!printErrStack) printErrStack = false;

	winston.log('error', '[' + status + '] ' + responseError.getMessages('dev') + '. Request' + (responseError.getUser() != null ? ' by User ID ' + responseError.getUser() : '') + ' from IP ' + req.connection.remoteAddress + (printErrStack ? '. Stack trace: ' + responseError.getErr().stack : ''));
	res.status(status).json({error: error, messages: responseError.getMessages('client')});
}

function internalServerError(err, req, res, message, userId) {
	winston.log('error', '[500] An error has occured while processing a request to ' + message + '. Request' + (userId ? ' by User ID ' + userId : '') + ' from IP ' + req.connection.remoteAddress + '. Stack trace: ' + err.stack);
	res.status(500).json({error: 'Internal Server Error', message: 'An error has occured while ' + messages + '. Please try it again later.' });
}

exports.log = log;
exports.info = info;
exports.responseError = responseError;
exports.internalServerError = internalServerError;