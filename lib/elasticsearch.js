var logger = require('../lib/logger').logger(module.filename);
var config = require('../config');
var util = require('util');
var _ = require('underscore');
var es = require('elasticsearch');

var esClient = new es.Client({
  host: util.format('%s:%s', config.elasticsearch.host, config.elasticsearch.port),
  log:  config.elasticsearch.logLevel
});

elasticsearch = function(index, type) {};

elasticsearch.prototype = {
  createIndex: function(indexId, callback) {
    esClient.indices.create({
      index: indexId
    }, function(err, response) {
      callback(err, response);
    });
  },
  waitForStatus: function(indexId, status, callback) {
    esClient.cluster.health({
      index: indexId,
      waitForStatus: status
    }, function(err, response) {
      callback(err, response);
    });
  },
  index: function(params, callback) {
    esClient.index({
      index: params.index,
      type: params.type,
      id: params.id,
      body: params.data
    }, function(err, response) {
      callback(err, response);
    });
  },
  bulkIndex: function(params, callback) {
    var bulkOperations = _.chain(params.data).map(function(entry) {
      return [{
        index: {
          _index: params.index,
          _type: params.type,
          _id: params.idResolver ? params.idResolver(entry) : entry,
        }
      }, entry]
    }).flatten().value();
    esClient.bulk({
      body: bulkOperations
    }, function(err, response) {
      callback(err, response);
    });
  },
  get: function(params, callback) {
    esClient.mget({
      index: params.index,
      type: params.type,
      body: {
        ids: params.data
      }
    }, callback);
  },
  allIds: function(params, callback) {
    esClient.search({
      index: params.index,
      type: params.type,
      body: {
        query: {
          match_all: {}
        },
        fields: ["id"],
        size: 500000
      }
    }, callback);
  },
  maxId: function(params, callback) {
    esClient.search({
      index: params.index,
      type: params.type,
      body: {
        fields: [
          'revision'
        ],
        query: {
          match_all: {}
        },
        sort: {
          revision: 'desc'
        },
        size: 1
      }
    }, callback);
  },
  closeIndex: function(indexId, callback) {
    esClient.indices.close({
      index: indexId
    }, function(err, response) {
      callback(err, response);
    });
  },
  openIndex: function(indexId, callback) {
    esClient.indices.open({
      index: indexId
    }, function(err, response) {
      callback(err, response);
    });
  },
  putSettings: function(indexId, settings, callback) {
    settings.index = indexId;
    esClient.indices.putSettings(settings, function(err, response) {
      callback(err, response);
    });
  },
  putMappings: function(indexId, type, mappings, callback) {
    mappings.index = indexId;
    mappings.type = type;
    esClient.indices.putMapping(mappings, function(err, response) {
      callback(err, response);
    });
  }
};

module.exports = elasticsearch;