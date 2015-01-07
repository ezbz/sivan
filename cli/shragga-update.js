var config = require('../config');
var subversion = require('../lib/subversion');
var logger = require('../lib/logger').logger(module.filename);

var svnClient = new subversion();

svnClient.update(function(err, json) {
	if (err) {
		console.error(err);
	} else {
		console.log(JSON.stringify(json))
	}
});