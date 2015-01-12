var config = require('../config');


var cache = require('../lib/'+config.cache.proxy);

module.exports.keys = function(search, callback) {
	cache.keys(search, callback);
};
module.exports.del = function(key, callback) {
	cache.del(key, callback);
};
module.exports.put = function(key, value, ttl, callback) {
	cache.put(key, value, ttl, callback);
};
module.exports.get = function(key, hitCallback, missCallback) {
	cache.get(key, hitCallback, missCallback);	
}