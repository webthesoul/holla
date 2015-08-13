// question.js
var _ = require("lodash");

var Question = function (data) {  
	this.data = this.sanitize(data);
};

Question.prototype.data = {};

Question.prototype.schema = {  
	questionId: null,
	userId: null,
	question: null,
	radius: null,
	regards: null,
	likes: 0,
	shareLink: null,
	dateCreated: null,	
	location: {},
	answers: []
};

Question.prototype.sanitize = function (data) {  
	data = data || {};
	return _.pick(_.defaults(data, this.schema), _.keys(this.schema)); 
};

Question.prototype.get = function (key) {  
	return this.data[key];
};

Question.prototype.set = function (key, value) {  
	this.data[key] = value;
};

Question.prototype.setData = function (data) {  
	this.data = this.sanitize(data);
};


module.exports = Question;