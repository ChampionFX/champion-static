const getLanguage   = require('./language').getLanguage;
const createElement = require('./utility').createElement;

let location_url;

function init(url) {
    location_url = url ? getLocation(url) : window.location;
}

function getLocation (url) { createElement('a', { href: decodeURIComponent(url) }); }

function reset() {
    location_url = window ? window.location : location_url;
}

function url_for(path, params, language) {
    if (!path) {
        path = '';
    } else if (path.length > 0 && path[0] === '/') {
        path = path.substr(1);
    }
    const lang = (language || getLanguage()).toLowerCase();
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
    return url_for('user/choose-platform');
}

function get_params() {
    const urlParams = {};
    window.location.search.substring(1).split('&').forEach((pair) => {
        const keyValue = pair.split('=');
        if (keyValue[0] && keyValue[1]) urlParams[keyValue[0]] = decodeURIComponent(keyValue[1]);
    });
    return urlParams;
}

const params = (href) => {
    const arr_params = [];
    const parsed     = ((href ? new URL(href) : location_url).search || '').substr(1).split('&');
    let p_l          = parsed.length;
    while (p_l--) {
        const param = parsed[p_l].split('=');
        arr_params.push(param);
    }
    return arr_params;
};

const paramsHash = (href) => {
    const param_hash = {};
    const arr_params = params(href);
    let param        = arr_params.length;
    while (param--) {
        if (arr_params[param][0]) {
            param_hash[arr_params[param][0]] = arr_params[param][1] || '';
        }
    }
    return param_hash;
};

module.exports = {
    init                : init,
    reset               : reset,
    url_for             : url_for,
    url_for_static      : url_for_static,
    default_redirect_url: default_redirect_url,
    get_params          : get_params,
    param               : name => paramsHash()[name],
};
