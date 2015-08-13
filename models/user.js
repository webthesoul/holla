// question.js
var _ = require("lodash");

var User = function (data) {  
	this.data = this.sanitize(data);
};

User.prototype.data = {};

User.prototype.schema = {  
	userId: null,
	firstname: null,
	lastname: null,
	facebookId: 0,
	password: null,
	email: null,
	dateCreated: null,
	location: {},
	facebookAccessToken: null,
	inviteToken: null,
	apiToken: null
};

User.prototype.sanitize = function (data) {  
	data = data || {};
	return _.pick(_.defaults(data, this.schema), _.keys(this.schema)); 
};

User.prototype.get = function (key) {  
	return this.data[key];
};

User.prototype.set = function (key, value) {  
	this.data[key] = value;
};

User.prototype.setData = function (data) {  
	this.data = this.sanitize(data);
};

User.prototype.hasChanged = function(data) {
	return (this.data['firstname'] !== data.get('firstname') || this.data['lastname'] !== data.get('lastname') || this.data['email'] !== data.get('email'))
};

module.exports = User;