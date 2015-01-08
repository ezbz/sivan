var config = require('../config');
var redis = require('redis');
var _ = require('underscore');
var logger = require('../lib/logger').logger(module.filename);

config.redis = {
	parser: 'hiredis',
	server: "localhost",
	// server: "shanti-40001-prod-chidc2.chidc2.outbrain.com",
	port: 6379,
	debug: false
};

redis.debug_mode = config.redis.debug;

var client = redis.createClient(config.redis.port, config.redis.server, {
	detect_buffers: false
});

client.on("error", function(err) {
	logger.error(err);
});

client.on("connect", function(err) {
	logger.info("Connected to redis [%s]", JSON.stringify(config.redis));
});


client.on("ready", function(err) {
	logger.info("Redis is ready [%s]", JSON.stringify(client.server_info));
});

module.exports.keys = function(search, callback) {
	var query = search ? "*" + search + "*" : "*";
	client.keys(query, callback);
};
module.exports.del = function(key, callback) {
	client.del(key, callback);
};

module.exports.put = function(key, value, ttl, putCallback) {
	ttl = ttl ? ttl : 60;
	if (_.isEmpty(value)) {
		logger.trace("Cowardly refusing to cache null or empty value for key [%s]", key);
	} else {
		var callback = putCallback ? putCallback : (putCallback) ? putCallback : redis.print;
		logger.trace("storing redis object with key [%s] and ttl [%s]", key, ttl);
		client.set(key, JSON.stringify(value), callback);
		client.expire(key, ttl);
	}
};

module.exports.get = function(key, hitCallback, missCallback) {
	if (config.redis.disable) {
		logger.trace("Disabled in configuration, initiating miss");
		missCallback();
		return;
	}
	return client.get(key, function(err, value) {
		if (err) {
			logger.error(err);
		}
		if (_.isEmpty(value)) {
			logger.trace("got a redis miss for key [%s] value [%s]", key, value);
			missCallback();
		} else {
			logger.trace("got a redis hit for key [%s]", key);
			hitCallback(err, JSON.parse(value));
		}
	});
};