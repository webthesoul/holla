// QuestionRepository.js
var DBWrap = require('mysql-wrap');
var DBPool = require('../utils/DBPool');
var logger = require('../utils/logger');
var Q = require('q');
var Question = require('../models/question');

function QuestionRepository() {
	this.createQuestion = createQuestion;
	this.findById = findById;
	this.findAll = findAll;
	this.likeQuestion = likeQuestion;
	this.hasLikedQuestion = hasLikedQuestion;
}

function createQuestion(question) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);

			sql.beginTransaction()
			.then(function(results) {
				return sql.insert("Question", {UserId: question.get('userId'), Question: question.get('question'), Radius: question.get('radius'), Regards: question.get('regards'), Likes: 0});
			})
			.then(function(result) {
				question.set('questionId', result.insertId);
				return sql.insert("QuestionLocation", {QuestionId: question.get('questionId'), Location: question.get('location')['location'], Lat: question.get('location')['lat'], Lng: question.get('location')['lng']});
			})
			.then(function(row) {
				return sql.commit();
			})
			.then(function() {
				deferred.resolve(question);
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

function findById(questionId) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);
			var question = null;

			sql.one('SELECT QuestionId AS questionId, UserId AS userId, Question AS question, Likes AS likes, ShareLink AS shareLnk, DateCreated AS dateCreated FROM Question WHERE QuestionId = ?', [questionId])
			.then(function(row) {
				if (!row) {
					throw 404;
				} else {
					question = new Question(row);
					return sql.query('SELECT Answer.AnswerId AS answerId, Answer.UserId as userId, Answer.Answer as answer, Answer.Likes as likes, Answer.DateCreated as dateCreated FROM Answer LEFT JOIN QuestionAnswer ON Answer.AnswerId = QuestionAnswer.AnswerId WHERE QuestionAnswer.QuestionId = ?', [questionId]);
				}
			})
			.then(function(rows) {
				question.set('answers', rows);
				deferred.resolve(question);
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

function findAll(params) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);

			sql.selectOne('UserLocation', {UserId: params.userId})
			.then(function(row){
				if(!row) {
					throw 'No user exists';
				} else {
					var whereStatement = params.offset != 0 ? 'WHERE questionId < ' + params.offset : '';

					// TODO: Location calculation
					return sql.query('SELECT QuestionId AS questionId, UserId AS userId, Question AS question, Likes AS likes, ShareLink AS shareLnk, DateCreated AS dateCreated FROM Question ' + whereStatement + ' ORDER BY dateCreated DESC LIMIT ?', [params.limit]);
				}
			})			
			.then(function(rows) {
				if (rows.length <= 0) {
					throw 404;
				} else {
					deferred.resolve(rows);
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


function likeQuestion(questionId, userId) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);

			sql.beginTransaction()
			.then(function(result) {
				return sql.query('UPDATE Question SET Likes = Likes + 1 WHERE QuestionId = ?', [questionId]);
			})
			.then(function(result) {
				if (result.affectedRows <= 0) {
					throw 404;
				} else {
					return sql.insert("QuestionLike", {QuestionId: questionId, UserId: userId});
				}
			})
			.then(function(result) {
				return sql.commit();
			})
			.then(function() {
				return sql.one('SELECT Likes AS likes FROM Question WHERE QuestionId = ?', [questionId]);
			})
			.then(function(result) {
				deferred.resolve(result.likes);
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

function hasLikedQuestion(questionId, userId) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);

			sql.selectOne('QuestionLike', {QuestionId: questionId, UserId: userId})
			.then(function(row) {
				if (row) {
					throw 409;
				} else {
					deferred.resolve('No');
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
module.exports = QuestionRepository;
