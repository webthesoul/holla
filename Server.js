// Server.js
var http = require('http');
var express = require('express');

var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');

var routes = require('./Routes');
var router = express.Router();
var app = express();

//Configuration
app.set('port', process.env.PORT || 3000);
app.set('env', process.env.NODE_ENV || 'development');
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('X-HTTP-Method-Override'));

var UserHandler = require('./handlers/UserHandler');
var QuestionHandler = require('./handlers/QuestionHandler');
var AnswerHandler = require('./handlers/AnswerHandler');
var AuthenticationHandler = require('./handlers/AuthenticationHandler');
var handlers = {
	user: new UserHandler(),
	question: new QuestionHandler(),
	answer: new AnswerHandler,
	auth: new AuthenticationHandler
};

function start() {
	routes.setup(router, handlers);
	app.use('/api/v1', router);

	if ('development' == app.get('env')) {
		app.use(errorHandler({dumpExceptions: true, showStack: true}));
	} else if ('production' == app.get('env')) {
		app.use(errorHandler());		
	}

	var server = http.createServer(app);
	server.listen(app.get('port'), function(){
		console.log('Express server listening on port ' + app.get('port') + ' in ' + app.get('env') + ' mode.');
	});
}

exports.start = start;
exports.app = app;