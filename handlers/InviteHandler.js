// InviteHandler.js
var DBWrap = require('mysql-wrap');
var DBPool = require('../utils/DBPool');
var Q = require('q');
var logger = require('../utils/logger');
var ResponseError = require('../models/responseError');

var InviteHandler = function() {
	this.createTokens = handleCreateTokensRequest;
};

function handleCreateTokensRequest(req, res) {
	var auth = req.body.admin || null;
	//if (req.header('referrer') == 'doc' && auth == 'iamunique') {
	if (auth == 'iamunique') {
		var tokens = [];

		for(var i=0; i < 10; i++) {
			var token = '';
			for (var j=0; j < 5; j++) {
				token += chars.charAt(Math.floor(Math.random() * chars.length)); 
			}
			tokens.push(token);
		}

		console.log(tokens);
	} else {
		var e = new ResponseError(err);
		e.addDevMessage('Unauthorized request to create invite tokens. [admin key:' + auth + ']');
		e.addClientMessage('You are unauthorized.');
		logger.responseError(401, 'AuthException', req, res, e);
	}
}

module.exports = InviteHandler;