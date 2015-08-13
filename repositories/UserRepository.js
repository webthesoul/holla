// UserRepository.js
var DBWrap = require('mysql-wrap');
var DBPool = require('../utils/DBPool');
var logger = require('../utils/logger');
var Q = require('q');
var User = require('../models/user');
var Location = require('../models/location');

function UserRepository() {
	this.createUser = createUser;
	this.validateInviteToken = validateInviteToken;
	this.findById = findById;
	this.findByFacebookId = findByFacebookId;
	this.getCurrentLocation = getCurrentLocation;
	this.updateCurrentLocation = updateCurrentLocation;
	this.updateUser = updateUser;
}

function createUser(user) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);
			sql.beginTransaction()
			.then(function(){
				// 1. check if facebookId already exists (throw 409)
				return sql.selectOne('User', {FacebookId: user.get('facebookId')});
			})
			.then(function(row){
				if(row) {
					throw 409;
				} else{
					// 2. insert User
					return sql.insert("User", {Firstname: user.get('firstname'), Lastname: user.get('lastname'), FacebookId: user.get('facebookId'), Email: user.get('email')});
				}
			})
			.then(function(result){
				user.set('userId', result.insertId);
				// 3. initiate user location
				return sql.insert("UserLocation", {UserId: result.insertId});
			})
			.then(function(result){
				// 4. update invite token be used
				return sql.query('UPDATE InviteToken SET Used = ?, DateUsed = CURRENT_TIMESTAMP, UserId = ? WHERE Token = ?', [1, user.get('userId'), user.get('inviteToken')]);
			})
			.then(function(result) {
				if (result.affectedRows <= 0) {
					throw 404;
				} else {
					return sql.commit();
				}
			})
			.then(function() {
				deferred.resolve(user);
			})
			.fail(function(err) {
				sql.rollback(function() {
					deferred.reject(new Error(err));
				});	
			})
			.finally(function() {
				DBPool.release(sql);
			})
			.done();
		}
	});
	return deferred.promise;
}

function validateInviteToken(inviteToken) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);

			sql.selectOne('InviteToken', {Token: inviteToken, Used: 0})
			.then(function(row) {
				if (!row) {
					throw 404;
				} else {
					deferred.resolve();
				}
			})
			.fail(function(err) {
				deferred.reject(new Error(err));		
			})
			.finally(function() {
				DBPool.release(sql);
			})
			.done();
		}
	});
	return deferred.promise;
}

function findById(userId) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);

			sql.one('SELECT UserId AS userId, Firstname AS firstname, Lastname AS lastname, FacebookId AS facebookId, Email AS email, dateCreated AS dateCreated FROM User WHERE UserId = ?', [userId])
			.then(function(row) {
				if (!row) {
					throw 404;
				} else {
					deferred.resolve(new User(row));
				}
			})
			.fail(function(err) {
				deferred.reject(new Error(err));		
			})
			.finally(function() {
				DBPool.release(sql);
			})
			.done();
		}
	});
	return deferred.promise;
}

function findByFacebookId(facebookId) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);

			sql.one('SELECT UserId AS userId, Firstname AS firstname, Lastname AS lastname, FacebookId AS facebookId, Email AS email, dateCreated AS dateCreated FROM User WHERE FacebookId = ?', [facebookId])
			.then(function(row) {
				if (!row) {
					throw 404;
				} else {
					deferred.resolve(new User(row));
				}
			})
			.fail(function(err) {
				deferred.reject(new Error(err));		
			})
			.finally(function() {
				DBPool.release(sql);
			})
			.done();
		}
	});
	return deferred.promise;
}

function getCurrentLocation(userId) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);
			var question = null;

			sql.one('SELECT CurrentLocation AS location, Lat AS lat, Lng AS lng, Timestamp AS timestamp FROM UserLocation WHERE UserId = ?', [userId])
			.then(function(row) {
				if (!row) {
					throw 404;
				} else {
					location = new Location(row);
					deferred.resolve(location);
				}
			})
			.fail(function(err) {
				deferred.reject(new Error(err));		
			})
			.finally(function() {
				DBPool.release(sql);
			})
			.done();
		}
	});
	return deferred.promise;
}

function updateCurrentLocation(userId, location) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);

			sql.query('UPDATE UserLocation SET CurrentLocation = ?, Lat = ?, Lng = ?, Timestamp = CURRENT_TIMESTAMP WHERE UserId =?', [location.get('location'), location.get('lat'), location.get('lng'), userId])
			.then(function(result) {
				if (result.affectedRows <= 0) {
					throw 404;
				} else {
					return sql.selectOne('UserLocation', {UserId: userId})
				}
			})
			.then(function(row) {
				location.set('timestamp', row.Timestamp);
				deferred.resolve(location);
			})
			.fail(function(err) {
				deferred.reject(new Error(err));		
			})
			.finally(function() {
				DBPool.release(sql);
			})
			.done();
		}
	});

	return deferred.promise;
}

function updateUser(user) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);

			sql.update('User', {Firstname: user.get('firstname'), Lastname: user.get('lastname'), Email: user.get('email')}, {UserId: user.get('userId')})
			.then(function(result) {
				if (result.affectedRows <= 0) {
					throw 404;
				} else {
					deferred.resolve(user);
				}
			})
			.fail(function(err) {
				deferred.reject(new Error(err));
			})
			.finally(function() {
				DBPool.release(sql);
			})
			.done();
		}
	});

	return deferred.promise;
}
module.exports = UserRepository;
