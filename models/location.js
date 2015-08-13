// location.js
var _ = require("lodash");

var Location = function (data) {  
	this.data = this.sanitize(data);
};

Location.prototype.data = {};

Location.prototype.schema = {
	location: null,
	lat: null,
	lng: null,
	timestamp: null
};

Location.prototype.sanitize = function (data) {  
	data = data || {};
	return _.pick(_.defaults(data, this.schema), _.keys(this.schema)); 
};

Location.prototype.get = function (key) {  
	return this.data[key];
};

Location.prototype.set = function (key, value) {  
	this.data[key] = value;
};

Location.prototype.setData = function (data) {  
	this.data = this.sanitize(data);
};

module.exports = Location;