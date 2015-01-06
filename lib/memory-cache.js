var memoryCache = require('memory-cache');
var logger = require('../lib/logger').logger(module.filename);

var memoryCacheKeys = [];

module.exports.keys = function(search, callback) {
	var result = [];
	for(i in memoryCacheKeys){
		if(memoryCacheKeys[i].indexOf(search)!=-1){
			result.push(memoryCacheKeys[i]);
		}
	}
	callback(result);
};
module.exports.del = function(key, callback) {
	memoryCache.del(key);
};
module.exports.put = function(key, value, ttl, putCallback) {
	ttl = ttl ? ttl : 60;
	logger.trace("storing cache object with key [%s] and ttl [%s]", key, ttl);
	memoryCache.put(key, value, ttl * 1000);
	if(putCallback){
		putCallback(value);
	}
	keys.push(key);
};
module.exports.get = function(key, hitCallback, missCallback) {
	var value = memoryCache.get(key);
	logger.trace("got a cache [%s] for key [%s]", value == null ? "miss" : "hit", key);
	if (null == value) {
		missCallback();
	} else {
		hitCallback(value);
	}
};