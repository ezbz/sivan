var log4js = require('log4js');
var config = require('../config');
log4js.configure({
	appenders: [{
		type: 'console'
	}, {
		type: 'file',
		filename: '/var/log/sivan/server.log',
		category: 'librarian',
		maxLogSize: 20480,
		backups: 10
	}]
});

var DEFAULT_LOG_LEVEL = config.logging.defaultLevel;


var rootLogger = log4js.getLogger('librarian');
rootLogger.setLevel(DEFAULT_LOG_LEVEL);

var getLogger = function(filename, level) {
	if (filename) {
		var name = filename.substr(filename.indexOf("librarian/") + 7, filename.length);
		name = name.replace(".js", "").replace("/", ".");
		var logger = log4js.getLogger(name);
		logger.setLevel(level ? level : DEFAULT_LOG_LEVEL);
		return logger;
	} else {
		return rootLogger;
	}
};

exports.logger = getLogger;