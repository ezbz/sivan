var config = require('../config');
var Jsiq = require('../lib/jsiq');
var logger = require('../lib/logger').logger(module.filename);


exports.home = function(req, res) {
	res.render('index', {
		title: 'SiVaN'
	});
};