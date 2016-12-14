/*
* Loads html resources, and stores in internal cache
* */
(function() {

    var _loaded = {};

    function getResource(url, callback) {
        var part = _loaded[url];
        if (part) {
            callback(part)
        } else {
            loadResource(url, callback);
        }
    }

    function loadResource(url, callback) {
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'html'
        }).done(function(data) {
            _loaded[url] = $.parseHTML(data);
            callback(_loaded[url]);
        }).fail(function() {
            callback(null);
        });
    }

    window.ChampionResources = {
        get: getResource
    };
})();