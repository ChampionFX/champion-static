/**
 * Loads html resources, and stores in internal cache
 */
const ChampionResources = (function() {
    'use strict';

    const _loaded = {};

    const getResource = (url, callback) => {
        const part = _loaded[url];
        if (part) {
            callback(part);
        } else {
            loadResource(url, callback);
        }
    };

    const loadResource = (url, callback) => {
        $.ajax({
            url     : url,
            type    : 'GET',
            dataType: 'html',
        }).done((data) => {
            _loaded[url] = $.parseHTML(data);
            callback(_loaded[url]);
        }).fail(() => {
            callback(null);
        });
    };

    return {
        get: getResource,
    };
})();

module.exports = ChampionResources;
