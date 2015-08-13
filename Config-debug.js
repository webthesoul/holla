// Config-debug.js
module.exports = {
	"db": {
		"type": "mysql",
		"host": "hollapp.cmmchx8hbwog.ap-southeast-2.rds.amazonaws.com",
		"port": "3306",
		"user": "hollaadmin",
		"password": "vogelmonkeydishwasher",
		"database": "holla"
	},
	"logger": {
		"api": "logs/api.log",
		"exception": "logs/exceptions.log"
	},
	"api": {
		'secret': 'whatshouldbesecret'
	}
};