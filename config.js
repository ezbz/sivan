var fs = require('fs');
var home =  process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

var config = {};
var localConfigFile = home+'/.sivan/config.js';
if(fs.existsSync(localConfigFile)){
  config = require(localConfigFile);
}

var systemConfigFile = '/etc/sivan/config.js';
if(fs.existsSync(systemConfigFile)){
  config = require(systemConfigFile);
}

module.exports = config;