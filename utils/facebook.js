// facebook.js
var graph = require('fbgraph');
var Q = require('q');
var ResponseError = require('../models/responseError');

function auth(user) {
	var deferred = Q.defer();

	graph.setAccessToken(user.get('facebookAccessToken'));

	var fbGet = Q.nbind(graph.get, graph);
	fbGet("me?fields=id,first_name,last_name,email")
	.then(function(data) {
		if (data.id == user.get('facebookId')) {
			deferred.resolve(data);
		} else {
			throw {code: 400, type: 'OAuthException', message: 'Facebook ID is not mine.'};
		}
	})
	.fail(function(err) {
		var e = new ResponseError(err);
		if (err.code == 190) {
			err['clientMessage'] = 'Facebook access token is invalid.';
		} else if (err.code == 2500) {
			err['clientMessage'] = 'Valid facebook access token is required.';
		} else if (err.code == 400) {
			err['clientMessage'] = 'Facebook access token is invalid with given Facebook ID.';
		}
		deferred.reject(err);
	})
	.done();

	return deferred.promise;
}

exports.auth = auth;