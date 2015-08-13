// responseError.js
var _ = require("lodash");

var ResponseError = function(err, userId) {
	this.messages = {
		err: err ? err : null,
		dev: null,
		client: null,
		userId: null
	};

	if (userId) {
		this.setUser(userId);
	}
};

ResponseError.prototype.messages = {};

ResponseError.prototype.addDevMessage = function (message) {  
	if (!message) message = '';
	this.messages.dev = message;
	if (this.messages.client == null) {
		this.addClientMessage(message);
	}
};

ResponseError.prototype.addClientMessage = function (key, message) {  
	if (!message) {
		message = key;
		key = 'general';
	}

	if (this.messages.client === null ) {
		this.messages.client = {};
	}

	this.messages.client[key] = message;

};

ResponseError.prototype.setUser = function (userId) {  
	this.messages.userId = userId;
};

ResponseError.prototype.getMessages = function (key) {  
	return this.messages[key];
};

ResponseError.prototype.getErr = function () {  
	return this.messages['err'];
};

ResponseError.prototype.getUser = function () {  
	return this.messages['userId'];
};

module.exports = ResponseError;