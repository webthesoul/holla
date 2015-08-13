// answerRepository.js
var DBWrap = require('mysql-wrap');
var DBPool = require('../utils/DBPool');
var logger = require('../utils/logger');
var Q = require('q');
var Answer = require('../models/answer');

function AnswerRepository() {
	this.createAnswer = createAnswer;
	this.findById = findById;
	this.findByQuestionId = findByQuestionId;
	this.likeAnswer = likeAnswer;
	this.hasLikedAnswer = hasLikedAnswer;
}

function createAnswer(answer) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);

			sql.beginTransaction()
			.then(function() {
				return sql.selectOne('Question', {QuestionId: answer.get('questionId')})
			})
			.then(function(row) {
				if (!row) {
					throw 404;
				} else {
					var data = {UserId: answer.get('userId'), Answer: answer.get('answer')};
					return sql.insert("Answer", data);
				}
			})
			.then(function(result) {
				answer.set('answerId', result.insertId);
				return sql.insert("QuestionAnswer", {QuestionId: answer.get('questionId'), AnswerId: answer.get('answerId')});
			})
			.then(function(result) {
				return sql.one('SELECT AnswerId AS answerId, UserId AS userId, Answer AS answer, Likes AS likes, DateCreated AS dateCreated FROM Answer WHERE AnswerId = ?', [answer.get('answerId')]);
			})
			.then(function(row) {
				var questionId = answer.get('questionId');
					answer.setData(row);
					answer.set('questionId', questionId);
				return sql.commit();
			})
			.then(function() {
				deferred.resolve(answer);
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

function findById(answer) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);

			sql.one('SELECT AnswerId AS answerId, UserId AS userId, Answer AS answer, Likes AS likes, DateCreated AS dateCreated FROM Answer WHERE AnswerId = ?', [answer.get('answerId')])
			.then(function(row) {
				if (!row) {
					throw 404;
				} else {
					var questionId = answer.get('questionId');
					answer.setData(row);
					answer.set('questionId', questionId);
					deferred.resolve(answer);
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

function findByQuestionId(questionId) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);

			sql.query('SELECT Answer.AnswerId, Answer.UserId, Answer.Answer, Answer.Likes, Answer.DateCreated FROM Answer LEFT JOIN QuestionAnswer ON Answer.AnswerId = QuestionAnswer.AnswerId WHERE QuestionAnswer.QuestionId = ?', [questionId])
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

function likeAnswer(answerId, userId) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);

			sql.beginTransaction()
			.then(function(result) {
				return sql.query('UPDATE Answer SET Likes = Likes + 1 WHERE AnswerId = ?', [answerId]);
			})
			.then(function(result) {
				if (result.affectedRows <= 0) {
					throw 404;
				} else {
					return sql.insert("AnswerLike", {AnswerId: answerId, UserId: userId});
				}
			})
			.then(function(result) {
				return sql.commit();
			})
			.then(function() {
				return sql.one('SELECT Likes AS likes FROM Answer WHERE AnswerId = ?', [answerId]);
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

function hasLikedAnswer(answerId, userId) {
	var deferred = Q.defer();

	DBPool.acquire(function(err, db) {
		if (err) {
			deferred.reject(new Error("CONNECTION error: " + err));	
		} else {
			var sql = DBWrap(db);

			sql.selectOne('AnswerLike', {AnswerId: answerId, UserId: userId})
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
module.exports = AnswerRepository;
