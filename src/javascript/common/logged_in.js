const Client               = require('./client');
const GTM                  = require('./gtm');
const getLanguage          = require('./language').getLanguage;
const default_redirect_url = require('./url').default_redirect_url;
const url_for              = require('./url').url_for;
const isEmptyObject        = require('./utility').isEmptyObject;
const Cookies              = require('../lib/js-cookie');

const LoggedIn = (function() {
    'use strict';

    const load = () => {
        const tokens  = storeTokens();
        let loginid = Cookies.get('loginid'),
            redirect_url;

        if (!loginid) { // redirected to another domain (e.g. github.io) so those cookie are not accessible here
            const loginids = Object.keys(tokens);
            let loginid_list = '';
            loginids.map(function(id) {
                loginid_list += `${loginid_list ? '+' : ''}${id}:${/^V/i.test(id) ? 'V' : 'R'}:E`; // since there is not any data source to check, so assume all are enabled, disabled accounts will be handled on authorize
            });
            loginid = loginids[0];
            // set cookies
            Client.set_cookie('loginid',      loginid);
            Client.set_cookie('loginid_list', loginid_list);
        }
        Client.set_cookie('token', tokens[loginid]);

        // set flags
        GTM.setLoginFlag();

        // redirect url
        redirect_url = sessionStorage.getItem('redirect_url');
        sessionStorage.removeItem('redirect_url');

        // redirect back
        let set_default = true;
        if (redirect_url) {
            const do_not_redirect = ['reset-password', 'lost-password', 'change-password', 'home'];
            const reg = new RegExp(do_not_redirect.join('|'), 'i');
            if (!reg.test(redirect_url) && url_for('') !== redirect_url) {
                set_default = false;
            }
        }
        if (set_default) {
            redirect_url = default_redirect_url();
            const lang_cookie = Cookies.get('language');
            const language    = getLanguage();
            if (lang_cookie && lang_cookie !== language) {
                redirect_url = redirect_url.replace(new RegExp(`\/${language}\/`, 'i'), `/${lang_cookie.toLowerCase()}/`);
            }
        }
        document.getElementById('loading_link').setAttribute('href', redirect_url);
        window.location.href = redirect_url;
    };

    const storeTokens = () => {
        // Parse hash for loginids and tokens returned by OAuth
        const hash = (/acct1/i.test(window.location.hash) ? window.location.hash : window.location.search).substr(1).split('&');
        const tokens = {};
        for (let i = 0; i < hash.length; i += 2) {
            const loginid = getHashValue(hash[i], 'acct');
            const token   = getHashValue(hash[i + 1], 'token');
            if (loginid && token) {
                tokens[loginid] = token;
            }
        }
        if (!isEmptyObject(tokens)) {
            Client.set('tokens', JSON.stringify(tokens));
        }
        return tokens;
    };

    const getHashValue = (source, key) => {
        const match = new RegExp(`^${key}`);
        return source && source.length > 0 ? (match.test(source.split('=')[0]) ? source.split('=')[1] : '') : '';
    };

    return {
        load: load,
    };
})();

module.exports = LoggedIn;
