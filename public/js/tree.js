jQuery(function() {
  $('#tree').jstree({
    core: {
      data: {
        url: '/maven/module/all.tree.json',
        progressive_render: true
      },
      themes: {
        name: 'proton',
        responsive: true
          // variant: 'large'
      }
    },
    plugins: ["search"],
    search: {
      fuzzy: false,
      show_only_matches: false
    }
  }).on('search.jstree', function(nodes, str, res) {
    $('#search_btn').toggleClass('disabled');
    $('#search_btn>i').toggleClass('fa-search fa-refresh fa-spin');
  });;

  var timer = false;
  $('#search_form').submit(function() {
    $('#search_btn').toggleClass('disabled');
    $('#search_btn>i').toggleClass('fa-search fa-refresh fa-spin');
    if (timer) {
      clearTimeout(timer);
    }
    var term = $('#query').val();
    timer = setTimeout(function() {
      $('#tree').jstree(true).search(term, true);
    }, 250);
    return false;
  });
});