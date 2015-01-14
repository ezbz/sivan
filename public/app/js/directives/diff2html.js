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
						var data = response.data;

						var fileAttr = $parse(attributes.file)(scope);;
						if (fileAttr) {
							var fileDiff = _.filter(data, function(file) {
								return file.oldName === fileAttr.substr(1);
							});
							html = diff2html.getPrettySideBySideHtmlFromJson(fileDiff);
						} else {
							html = diff2html.getPrettySideBySideHtmlFromJson(data);
						}
						element.html(html)
					}, function(err) {
						console.error(err);
					});
				}
			});

		}
	};
});