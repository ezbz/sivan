angular.module('sivan').directive('diff2html', function($http, $parse) {
	return {
		restrict: 'E',
		link: function(scope, element, attributes) {
			attributes.$observe('loadDiff', function(loadFlag) {
				var revisionAttr = $parse(attributes.revision)(scope);
				if (revisionAttr != 'undefined' && loadFlag === 'true') {
					$http.get(FLAT_URL + "svn/diff/" + revisionAttr, {
						cache: true
					}).then(function(response) {
						var html = '';
						if(response.data){					
							var data = _.find(response.data, function(item){
								return parseInt(item.id) === parseInt(revisionAttr)
							});
							var diff = data.diff;
							var fileAttr = $parse(attributes.file)(scope);;
							if (fileAttr) {
								var singleDiff = _.filter(diff, function(file) {
									return file.oldName === fileAttr.substr(1);
								});
								html = diff2html.getPrettySideBySideHtmlFromJson(singleDiff);
							} else {
								html = diff2html.getPrettySideBySideHtmlFromJson(diff);
							}
							element.html(html)
						}
					}, function(err) {
						console.error(err);
					});
				}
			});

		}
	};
});