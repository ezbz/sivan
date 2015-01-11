angular.module('sivan').factory('EsService', function(EsClient, AppConfig) {
  return {
    getSelections: function(callback) {
      EsClient.search({
        index: 'svn-revision',
        type: 'revision',
        body: AppConfig.getAppConfig().elasticsearch.aggregationsQuery
      }).then(function(body, err) {
        callback({
          allAuthors: _.sortBy(body.aggregations.authors.buckets, 'key'),
          allModules: _.sortBy(body.aggregations.modules.buckets, 'key'),
          allTags: _.sortBy(body.aggregations.tags.buckets, 'key'),
        }, err);
      });
    },
    search: function(params, callback, errCallback) {
      var config = AppConfig.getAppConfig().elasticsearch;
      var searchObj = config.searchBaseQuery;
      searchObj.body.from = params.pagination.pageNumber - 1;
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
      if (params.selections.startDate ||
        params.selections.startTime) {
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
        andFilterItems.push({
          range: {
            date: {
              lte: getTimestamp(params.selections.endDate, params.selections.endTime)
            }
          }
        });
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

function getTimestamp(date, time) {
  if (date === "undefined") {
    date = "";
  }
  var datetime = moment(date + " " + time + "+02:00", "YYYY-MM-DD HH:mm:ssZZ")
  return datetime.valueOf();
}