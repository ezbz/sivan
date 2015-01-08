var subversion = require('node.svn');

var svn = new subversion({
	cwd: process.cwd()
});

svn.update(function(err, json) {});