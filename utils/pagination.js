// pagination.js
var _ = require("lodash");

function links(req, params) {
	var url = req.protocol + '://' + req.hostname + (req.app.settings.port == 80 || req.app.settings.port == 443 ? '' : ':' + req.app.settings.port) + req.path + '?';

	_.forEach(params, function(n, key) {
		if (key != 'offset' && key != 'limit') {
			url += key + '=' + n + '&';
		}
	});

	url += 'limit=' + params.limit;

	return {
		next: url + '&offset=' + params.offset
	};
}

exports.links = links;