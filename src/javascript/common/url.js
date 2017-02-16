const getLanguage = require('./language').getLanguage;

function url_for(path, params) {
    if (!path) {
        path = '';
    } else if (path.length > 0 && path[0] === '/') {
        path = path.substr(1);
    }
    const lang = getLanguage().toLowerCase();
    let url = '';
    if (typeof window !== 'undefined') {
        url  = window.location.href;
    }
    return `${url.substring(0, url.indexOf(`/${lang}/`) + lang.length + 2)}${path || 'home'}.html${params ? `?${params}` : ''}`;
}

function url_for_static(path) {
    if (!path) {
        path = '';
    } else if (path.length > 0 && path[0] === '/') {
        path = path.substr(1);
    }

    let staticHost;
    if (typeof window !== 'undefined') {
        staticHost = window.staticHost;
    }
    if (!staticHost || staticHost.length === 0) {
        staticHost = $('script[src*="bundle.min.js"],script[src*="bundle.js"]').attr('src');

        if (staticHost && staticHost.length > 0) {
            staticHost = staticHost.substr(0, staticHost.indexOf('/js/') + 1);
        } else {
            staticHost = 'https://www.champion-fx.com/';
        }

        if (typeof window !== 'undefined') {
            window.staticHost = staticHost;
        }
    }

    return staticHost + path;
}

function default_redirect_url() {
    return url_for('user/settings');
}

function get_params() {
    const urlParams = {};
    window.location.search.substring(1).split('&').forEach((pair) => {
        const keyValue = pair.split('=');
        if (keyValue[0] && keyValue[1]) urlParams[keyValue[0]] = decodeURIComponent(keyValue[1]);
    });
    return urlParams;
}

module.exports = {
    url_for             : url_for,
    url_for_static      : url_for_static,
    default_redirect_url: default_redirect_url,
    get_params          : get_params,
};
