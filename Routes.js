// Routes.js
function setup(router, handlers) {
	router.route('/questions')
		.post(handlers.auth.isAuthenticated, handlers.question.createQuestion)
		.get(handlers.auth.isAuthenticated, handlers.question.getQuestionList);
	router.route('/questions/:questionId')
		.get(handlers.auth.isAuthenticated, handlers.question.getQuestion);
	router.route('/questions/:questionId/likes')
		.post(handlers.auth.isAuthenticated, handlers.question.likeQuestion);
	router.route('/questions/:questionId/answers')
		.post(handlers.auth.isAuthenticated, handlers.answer.createAnswer);
	router.route('/questions/:questionId/answers/:answerId')
		.get(handlers.auth.isAuthenticated, handlers.answer.getAnswer);
	router.route('/questions/:questionId/answers/:answerId/likes')
		.post(handlers.auth.isAuthenticated, handlers.answer.likeAnswer);
	router.route('/users')
		.post(handlers.auth.isAuthenticated, handlers.user.createUser);
	router.route('/users/:userId/location')
		.get(handlers.auth.isAuthenticated, handlers.user.getCurrentLocation)
		.put(handlers.auth.isAuthenticated, handlers.user.updateCurrentLocation);
	router.route('/auth/facebook')
		.post(handlers.auth.facebookMobileLogin);
	router.route('/auth/logout')
		.post(handlers.auth.logout);
}

exports.setup = setup;