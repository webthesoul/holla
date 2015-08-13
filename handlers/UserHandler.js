// UserHandler.js
var User = require('../models/user');
var Location = require('../models/location');
var UserRepository  = require('../repositories/UserRepository');
var logger = require('../utils/logger');
var ResponseError = require('../models/responseError');
var fb = require('../utils/facebook');

var UserHandler = function() {
	this.createUser = handleCreateUserRequest;
	this.getCurrentLocation = handleGetCurrentLocationRequest;
	this.updateCurrentLocation = handleUpdateCurrentLocationRequest;
};

function handleCreateUserRequest(req, res) {
	var user = new User({
		facebookId: req.body.fbId || null,
		facebookAccessToken: req.body.fbToken || null,
		inviteToken: req.body.inviteToken || null
	});

	var userRepository = new UserRepository();

	fb.auth(user)
	.then(function(facebookData) {
		user.set('firstname', facebookData.first_name);
		user.set('lastname', facebookData.last_name);
		user.set('email', facebookData.email);
		return userRepository.validateInviteToken(user.get('inviteToken'));
	})
	.then(function(){
		return userRepository.createUser(user);		
	})
	.then(function(user){
		logger.info('[201] User[id:' + user.get('userId') + '] has been created', req);
		res.status(201).json({userId: user.get('userId')});
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
			e.addDevMessage('Invite Token is invalid. [inviteToken: ' + user.get('inviteToken')+ '] by [facebookId: ' + user.get('facebookId')+ ']');
			e.addClientMessage('Invite Token is invalid.');
			logger.responseError(400, 'AuthException', req, res, e);
		} else if (err.message == 409) {
			e.addDevMessage('User already exists. [facebookId: ' + user.get('facebookId')+ ']');
			e.addClientMessage('User already exists.');
			logger.responseError(409, 'AuthException', req, res, e);
		} else {
			logger.internalServerError(err, req, res, 'create a user with facebook ID ' + user.get('facebookId'));
		}
	})
	.done();
}

function handleGetCurrentLocationRequest(req, res) {
	var userId = parseInt(req.params.userId) || null;

	var userRepository = new UserRepository();

	userRepository.getCurrentLocation(userId)
	.then(function(location) {
		logger.info('[200] Current location of user ID ' + userId + ' has been retrieved', req);
		res.status(200).json({currentLocation: location.data});
	})
	.fail(function(err) {
		var e = new ResponseError(err);
		if (err.message == 404) {
			e.addDevMessage('Could not retrieve a current locatino of user ID ' + userId + '. No such user ID exists');
			logger.responseError(404, 'User not found', req, res, e);
		} else {
			logger.internalServerError(err, req, res, 'retrieve a current location of user ID' + userId);
		}
	})
	.done();
}

function handleUpdateCurrentLocationRequest(req, res) {
	var userId = parseInt(req.params.userId) || null;
	var location = new Location({
		location: req.body.location || null,
		lat: parseFloat(req.body.lat) || null,
		lng: parseFloat(req.body.lng) || null
	});

	var userRepository = new UserRepository();

	userRepository.updateCurrentLocation(userId, location)
	.then(function(location) {
		logger.info('[200] Current location of user ID ' + userId + ' has been updated', req);
		res.status(200).json({userId: userId, currentLocation: location.data});
	})
	.fail(function(err) {
		var e = new ResponseError(err);
		if (err.message == 404) {
			e.addDevMessage('Could not update current locatino of user ID ' + userId + '. No such user ID exists');
			logger.responseError(404, 'User not found', req, res, e);
		} else {
			logger.internalServerError(err, req, res, 'update current location of user ID' + userId);
		}
	})
	.done();
}
module.exports = UserHandler;