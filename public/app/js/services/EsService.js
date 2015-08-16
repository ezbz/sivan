angular.module('sivan').factory('EsService', function(EsClient, AppConfig) {
  return {
    getSelections: function(callback, errCallback) {
      EsClient.search({
        index: AppConfig.getAppConfig().elasticsearch.indexName,
        type: AppConfig.getAppConfig().elasticsearch.indexType,
        body: AppConfig.getAppConfig().elasticsearch.aggregationsQuery
      }).then(function(body) {
        callback({
          allAuthors: _.sortBy(body.aggregations.authors.buckets, 'key'),
          allModules: _.sortBy(body.aggregations.modules.buckets, 'key'),
          allTags: _.sortBy(body.aggregations.tags.buckets, 'key'),
          allFileTypes: _.sortBy(body.aggregations.fileTypes.buckets, 'key')
        });
      }, function(err) {
        console.log(err);
        errCallback(err);
      });
    },
    search: function(params, callback, errCallback) {
      var config = AppConfig.getAppConfig().elasticsearch;
      var searchObj = $.extend(true, {}, config.searchBaseQuery);
      searchObj.index = AppConfig.getAppConfig().elasticsearch.indexName;
      searchObj.type = AppConfig.getAppConfig().elasticsearch.indexType;
      searchObj.body.from = (params.pagination.pageSize * (params.pagination.pageNumber - 1));
      searchObj.body.size = params.pagination.pageSize;

      searchObj.body.sort = [];
      var sortObject = {};
      sortObject[params.pagination.sortBy] = {
        order: params.pagination.sortDirection
      };
      searchObj.body.sort.push(sortObject);
      searchObj.body.sort.push("_score");

      if (params.query) {
        searchObj.body.query.filtered.query = {
          match: {
            _all: params.query
          }
        }
      };

      var andFilterItems = [];

      if (params.selections.modules) {
        andFilterItems.push({
          term: {
            modules: params.selections.modules.key
          }
        });
      }
      if (params.selections.authors) {
        andFilterItems.push({
          term: {
            author: params.selections.authors.key
          }
        });
      }
      if (params.selections.fileTypes) {
        andFilterItems.push({
          term: {
            fileTypes: params.selections.fileTypes.key
          }
        });
      }
      if (params.selections.tags) {
        andFilterItems.push({
          term: {
            tags: params.selections.tags.key
          }
        });
      }
      if (params.selections.filterAuthors) {
        andFilterItems.push({
          not: {
            term: {
              author: config.filterAuthors
            }
          }
        });
      }

      if (params.selections.startRevision && params.selections.endRevision) {
        andFilterItems.push({
          range: {
            revision: {
              gte: parseInt(params.selections.startRevision),
              lte: parseInt(params.selections.endRevision)
            }
          }
        });
      } else {
        if (params.selections.startRevision) {
          andFilterItems.push({
            range: {
              revision: {
                gte: parseInt(params.selections.startRevision)
              }
            }
          });
        }
        if (params.selections.endRevision) {
          andFilterItems.push({
            range: {
              revision: {
                lte: parseInt(params.selections.endRevision)
              }
            }
          });
        }
      }

      var hasStart = false,
        hasEnd = false;
      if (params.selections.startDate ||
        params.selections.startTime) {
        hasStart = true;
        andFilterItems.push({
          range: {
            date: {
              gte: getEsDateFormat(params.selections.startDate, params.selections.startTime)
            }
          }
        });
      }
      if (params.selections.endDate ||
        params.selections.endTime) {
        hasEnd = true;
        andFilterItems.push({
          range: {
            date: {
              lte: getEsDateFormat(params.selections.endDate, params.selections.endTime)
            }
          }
        });
      }

      if (hasStart && hasEnd) {
        var start = parseDate(params.selections.startDate, params.selections.startTime);
        var end = parseDate(params.selections.endDate, params.selections.endTime);
        if (end.diff(start, 'months') > 12) {
          searchObj.body.aggregations.timeline.date_histogram.interval = 'month'
        } else if (end.diff(start, 'days') > 30) {
          searchObj.body.aggregations.timeline.date_histogram.interval = 'day'
        } else if (end.diff(start, 'hours') > 24) {
          searchObj.body.aggregations.timeline.date_histogram.interval = 'hour'
        } else {
          searchObj.body.aggregations.timeline.date_histogram.interval = 'minute'
        }
      }

      if (andFilterItems.length > 0) {
        searchObj.body.query.filtered.filter = {
          and: andFilterItems
        };
      }
      EsClient.search(searchObj).then(function(body) {
        callback(body);
      }, function(err) {
        errCallback(err);
      });
    }
  }
});


function getEsDateFormat(date, time) {
  if (date && time) {
    return date + "T" + time + ".000Z"
  }
  return date + "T000000.000Z"
}

function parseDate(date, time) {
  if (date === "undefined") {
    date = "";
  }
  return moment(date + " " + time + "+02:00", "YYYY-MM-DD HH:mm:ssZZ");
}