// answer.js
var _ = require("lodash");

var Answer = function (data) {  
	this.data = this.sanitize(data);
};

Answer.prototype.data = {};

Answer.prototype.schema = { 
	answerId: null,
	questionId: null,
	userId: null,
	answer: null,
	likes: 0,
	dateCreated: null
};

Answer.prototype.sanitize = function (data) {  
	data = data || {};
	return _.pick(_.defaults(data, this.schema), _.keys(this.schema)); 
};

Answer.prototype.get = function (key) {  
	return this.data[key];
};

Answer.prototype.set = function (key, value) {  
	this.data[key] = value;
};

Answer.prototype.setData = function (data) {  
	this.data = this.sanitize(data);
};

module.exports = Answer;