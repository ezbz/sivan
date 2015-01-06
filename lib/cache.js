var config = require('../config');

module.exports.keys = function(search, callback) {
	config.cache.proxy.keys(search, callback);
};
module.exports.del = function(key, callback) {
	config.cache.proxy.del(key, callback);
};
module.exports.put = function(key, value, ttl, callback) {
	config.cache.proxy.put(key, value, ttl, callback);
};
module.exports.get = function(key, hitCallback, missCallback) {
	config.cache.proxy.get(key, hitCallback, missCallback);	
}