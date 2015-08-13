// QuestionHandler.js
var Question = require('../models/question');
var QuestionRepository  = require('../repositories/QuestionRepository');
var UserRepository  = require('../repositories/UserRepository');
var logger = require('../utils/logger');
var ResponseError = require('../models/responseError');
var pagination = require('../utils/pagination');

var QuestionHandler = function() {
	this.createQuestion = handleCreateQuestionRequest;
	this.getQuestion = handleGetQuestionRequest;
	this.getQuestionList = handleGetQuestionListRequest;
	this.likeQuestion = handleLikeQuestionRequest;
}

function handleCreateQuestionRequest(req, res) {
	var question = new Question({
		userId: parseInt(req.decoded.userId) || null,
		question: req.body.question || null,
		regards: req.body.regards || null,
		radius: req.body.radius || null,
		location: {
			location: req.body.location || null,
			lat: req.body.lat || null,
			lng: req.body.lng || null
		}
	});

	var questionRepository = new QuestionRepository();
	var userRepository = new UserRepository();

	userRepository.findById(question.get('userId'))
	.then(function(user) {
		return questionRepository.createQuestion(question);
	})
	.then(function(user) {
		logger.info('[201] Question ID ' + question.get('questionId') + ' has been created', req);		
		res.location(req.originalUrl + '/' + question.get('questionId'));
		res.status(201).json(question.data);
	})
	.fail(function(err) {
		var e = new ResponseError(err);
		if (err.message == 404) {
			e.addDevMessage('Could not create a question. No such user ID exists');
			logger.responseError(404, 'User not found', req, res, e);
		} else {
			logger.internalServerError(err, req, res, 'create a question ' + questionId);
		}
	})
}

function handleGetQuestionRequest(req, res) {
	var questionId = parseInt(req.params.questionId) || null;

	var questionRepository = new QuestionRepository();

	questionRepository.findById(questionId)
	.then(function(question) {
		logger.info('[200] Question ID ' + questionId + ' has been retrieved', req);
		res.status(200).json(question.data);
	})
	.fail(function(err) {
		var e = new ResponseError(err);
		if (err.message == 404) {
			e.addDevMessage('Could not retrieve a question ID ' + questionId + '. No such ID exists');
			logger.responseError(404, 'Question not found', req, res, e);
		} else {
			logger.internalServerError(err, req, res, 'retrieve a question ID ' + questionId);
		}
	})
	.done();
}

function handleGetQuestionListRequest(req, res) {
	var params = {
		userId: parseInt(req.decoded.userId) || null,
		limit: parseInt(req.query.limit) || 20,
		offset: parseInt(req.query.offset) || 0
	}
	
	var questionRepository = new QuestionRepository();

	questionRepository.findAll(params)
	.then(function(questionList) {
		logger.info('[200] Question list has been retrieved', req);
		res.status(200).json({questionList: questionList});
	})
	.fail(function(err) {
		var e = new ResponseError(err);
		if (err.message == 'No user exists') {
			e.addDevMessage('Could not retrieve a question list. No such user ID exists');
			logger.responseError(404, 'User not found', req, res, e);
		} else if (err.message == 404) {
			e.addDevMessage('Could not retrieve a question list. No question exists');
			logger.responseError(404, 'Question not found', req, res, e);			
		} else {
			logger.internalServerError(err, req, res, 'retrieve a question list');
		}
	})
	.done();
}

function handleLikeQuestionRequest(req, res) {
	var questionId = parseInt(req.params.questionId) || null;
	var userId = parseInt(req.decoded.userId) || null;

	var questionRepository = new QuestionRepository();

	questionRepository.hasLikedQuestion(questionId, userId)
	.then(function(result) {
		return questionRepository.likeQuestion(questionId, userId);
	})
	.then(function(likes) {
		logger.info('[200] User ID ' + userId + ' liked question ID ' + questionId, req);
		res.status(200).json({userId: userId, questionId: questionId, likes: likes});
	})
	.fail(function(err) {
		var e = new ResponseError(err);
		if (err.message == 409) {
			e.addClientMessage('User already liked a question.');
			e.addDevMessage('User ID ' + userId +' already liked a question ID ' + questionId);
			logger.responseError(400, 'Like Duplicated', req, res, e);
		} else if (err.message == 404) {
			e.addDevMessage('Could not like a question ID ' + questionId +' by user ID ' + userId + '. No such question ID exists');
			logger.responseError(404, 'Question not found', req, res, e);
		} else {
			logger.internalServerError(err, req, res, 'like a question ID ' + questionId);
		}
	})
	.done();
}
module.exports = QuestionHandler;