//AuthenticationHandler.js
var config = require('../Config-debug.js');
var User = require('../models/user');
var UserRepository  = require('../repositories/UserRepository');
var logger = require('../utils/logger');
var ResponseError = require('../models/responseError');
var fb = require('../utils/facebook');
var jwt = require('jsonwebtoken');
var _ = require('lodash');

var AuthenticationHandler = function() {
	this.facebookMobileLogin = handleFacebookMobileLoginRequest;
	this.isAuthenticated = handleCheckAuthenticationRequest;
	this.logout = handleLogoutRequest;
};

function handleFacebookMobileLoginRequest(req, res) {
	var user = new User({
		facebookId: req.body.fbId || null,
		facebookAccessToken: req.body.fbToken || null
	});

	if (user.get('facebookAccessToken') && user.get('facebookAccessToken').length > 0 && user.get('facebookId') && user.get('facebookId').length > 0) {
		var userRepository = new UserRepository();

		fb.auth(user)
		.then(function(facebookData) {
			user.set('firstname', facebookData.first_name); 
			user.set('lastname', facebookData.last_name);
			user.set('email', facebookData.email);
			return userRepository.findByFacebookId(user.get('facebookId'));
		})
		.then(function(userData) {
			user.set('userId', userData.get('userId'));
			// Update user's detail, if they are changed since last login
			if (user.hasChanged(userData)) {
				return userRepository.updateUser(user);
			}
		})
		.then(function() {
			var apiToken = jwt.sign(_.pick(user.data,['userId']), config.api.secret, {
				expiresInMinutes: 1440 // expires in 24 hours
			});
			user.set('apiToken', apiToken);
			logger.info('[200] User[id:' + user.get('userId') + '] has been authenticated with [apiToken:' + apiToken + ']', req);
			res.status(201).json(_.pick(user.data, ['userId', 'apiToken']));
		})
		.fail(function(err) {
			var e = new ResponseError(err);
			if (err.type == 'OAuthException') {
				e.addDevMessage(err.message + ' [facebookId: ' + user.get('facebookId')+ ']');
				if (err.clientMessage) {
					e.addClientMessage('dev', err.message);
					e.addClientMessage(err.clientMessage);
				}
				logger.responseError(400, 'AuthException', req, res, e);
			} else if (err.message == 404) {
				e.addDevMessage('User not Found.. [facebookId: ' + user.get('facebookId')+ ']');
				e.addClientMessage('User not Found.');
				logger.responseError(404, 'AuthException', req, res, e);
			} else {
				logger.internalServerError(err, req, res, 'authenticate a user with facebook ID ' + user.get('facebookId'));
			}
		})
		.done();
	} else {
		var e = new ResponseError();
		e.addDevMessage('Bad login request. Facebook ID and Access Token are required.');
		logger.responseError(400, 'AuthException', req, res, e);
	}
}

function handleCheckAuthenticationRequest(req, res, next) {
	var user = new User({
		apiToken: req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer' ? req.headers.authorization.split(' ')[1] : null
	});
	var tokenFromQuery = req.query.token || null;

	if (user.get('apiToken') != null && tokenFromQuery) { 
		var e = new ResponseError();
		e.addDevMessage('No more than one method to transmit the token for authentication.');
		logger.responseError(400, 'AuthException', req, res, e);
	} else {
		if (req.header('referrer') == 'doc' && tokenFromQuery) { // API doc only
			user.set('apiToken', tokenFromQuery);
		}

		if (user.get('apiToken')) {
			jwt.verify(user.get('apiToken'), config.api.secret, function(err, decoded) {
				if (err) {
					var e = new ResponseError(err);
					e.addDevMessage('Failed to authenticate token. ' + err.message + ' [apiToken:' + user.get('apiToken') + ']');
					e.addClientMessage('dev', err.message.replace('jwt', 'Token'));
					e.addClientMessage('Failed to authenticate token.');
					logger.responseError(400, 'AuthException', req, res, e);
				} else {
					req.decoded = decoded;
					next();		
				}
			})
		} else {
			var e = new ResponseError();
			e.addDevMessage('API token is mandatory.');
			logger.responseError(400, 'AuthException', req, res, e);
		}
	}	
}

function handleLogoutRequest(req, res) {
	var user = new User({
		apiToken: req.query.token || null
	});
}

module.exports = AuthenticationHandler;