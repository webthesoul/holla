// DBPool.js
var generic_pool = require('generic-pool');
var mysql = require('mysql');
var config = require('../Config-debug.js');

var pool = generic_pool.Pool({
	name: config.db.type,
	create: function(callback) {
		var setup = {
			host : config.db.host,
			port : config.db.port,
			user : config.db.user,
			password : config.db.password,
			database : config.db.database
		}
		var client = mysql.createConnection(setup);
		client.connect(function (error){
			if(error){
				console.log(error);
			}
			callback(error, client);
		});
	},
	destroy: function(client) {
		client.end();
	},
	min: 2,
	max: 10,
	idleTimeoutMillis : 300000,
	log : false
});
 
process.on("exit", function() {
	pool.drain(function () {
		pool.destroyAllNow();
	});
});
 
 
module.exports = pool;