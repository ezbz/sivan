var logger = require('./logger').logger(module.filename);
var config = require('../config');
var indexer = require('../lib/indexer');
var schedule = require('node-schedule');

scheduler = function() {};

scheduler.prototype = {
  scheduleSync: function(callback) {
    var rule = new schedule.RecurrenceRule();
    var intervalMinutes = config.repository.autoSyncMinutes ? config.repository.autoSyncMinutes : 5;
    rule.minutes = [0, schedule.Range(intervalMinutes, 60)];
    var job = schedule.scheduleJob(rule, function() {
      logger.info("Running scheduled sync");
      indexer.sync(function(err, results) {
        callback(err, results);
      });
    });
  }
};

module.exports = scheduler;