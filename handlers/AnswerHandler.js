// AnswerHandler.js
var Answer = require('../models/answer');
var AnswerRepository  = require('../repositories/AnswerRepository');
var logger = require('../utils/logger');
var ResponseError = require('../models/responseError');

var AnswerHandler = function() {
	this.createAnswer = handleCreateAnswerRequest;
	this.getAnswer = handleGetAnswerRequest;
	this.likeAnswer = handleLikeAnswerRequest;
}

function handleCreateAnswerRequest(req, res) {
	var answer = new Answer({
		questionId: parseInt(req.params.questionId) || null,
		userId: parseInt(req.decoded.userId) || null,
		answer: req.body.answer || null
	});

	var answerRepository = new AnswerRepository();

	answerRepository.createAnswer(answer)
	.then(function(answer) {
		logger.info('[201] Answer ID ' + answer.get('answerId') + '] of question ID ' + answer.get('questionId') + ' has been created', req);
		res.location(req.originalUrl  + '/' + answer.get('answerId'));
		res.status(201).json(answer.data);
	})
	.fail(function(err) {
		var e = new ResponseError(err);
		if (err.message == 404) {
			e.addDevMessage('Could not create an answer of question ID ' + answer.get('questionId') + '. No such question ID exists');
			logger.responseError(404, 'Question not found', req, res, e);
		} else {
			logger.internalServerError(err, req, res, 'create an answer of question ID ' + answer.get('questionId'));
		}
	})
	.done();
}

function handleGetAnswerRequest(req, res) {
	var answer = new Answer({
		questionId: parseInt(req.params.questionId) || null,
		answerId: parseInt(req.params.answerId) || null
	});

	var answerRepository = new AnswerRepository();

	answerRepository.findById(answer)
	.then(function(answer) {
		logger.info('[200] Answer ID ' + answer.get('answerId') + 'of question ID ' + answer.get('questionId') + ' has been retrieved', req);
		res.status(200).json(answer.data);
	})
	.fail(function(err) {
		var e = new ResponseError(err);
		if (err.message == 404) {
			e.addDevMessage('Could not retrieve an answer ID ' + answer.get('answerId') + ' of question ID ' + answer.get('questionId') + '. No such answer ID exists');
			logger.responseError(404, 'Answer not found', req, res, e);
		} else {
			logger.internalServerError(err, req, res, 'retrieve an answer ID ' + answer.get('answerId'));
		}
	})
	.done();
}

function handleLikeAnswerRequest(req, res) {
	var answerId = parseInt(req.params.answerId) || null;
	var questionId = parseInt(req.params.questionId) || null;
	var userId = parseInt(req.decoded.userId) || null;

	var answerRepository = new AnswerRepository();

	answerRepository.hasLikedAnswer(answerId, userId)
	.then(function(result) {
		return answerRepository.likeAnswer(answerId, userId);
	})
	.then(function(likes) {
		logger.info('[200] User ID ' + userId + ' liked an answer ID ' + answerId + ' of question ID ' + questionId, req);
		res.status(200).json({userId: userId, answerId: answerId, likes: likes});
	})
	.fail(function(err) {
		var e = new ResponseError(err);
		if (err.message == 409) {
			e.addClientMessage('User already liked an answer.');
			e.addDevMessage('User ID ' + userId +' already liked an answer ID ' + questionId);
			logger.responseError(400, 'Like Duplicated', req, res, e);
		} else if (err.message == 404) {
			e.addDevMessage('Could not like a question ID ' + questionId +' by user ID ' + userId + ' of question ID ' + questionId + '. No such answer ID exists');
			logger.responseError(404, 'Answer not found', req, res, e);
		} else {
			logger.internalServerError(err, req, res, 'like a answer ID ' + answerId + ' of question ID ' + questionId);
		}
	})
	.done();
}
module.exports = AnswerHandler;