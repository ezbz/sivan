angular.module('sivan').directive('diff2html', function($http, $parse) {
	return {
		restrict: 'E',
		link: function(scope, element, attributes) {
			attributes.$observe('loadDiff', function(loadFlag) {
				if (attributes.revision != 'undefined' && loadFlag === 'true') {
					$http.get(FLAT_URL + "svn/diff/" + attributes.revision, {
						cache: true
					}).then(function(response) {
						var html = '';
						var data = response.data;

						if (attributes.file) {
							var fileDiff = _.filter(data, function(file) {
								console.log(file.oldName + ":" + attributes.file)
								return file.oldName === attributes.file.substr(1);
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