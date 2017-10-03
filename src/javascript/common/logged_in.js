const Client               = require('./client');
const GTM                  = require('./gtm');
const getLanguage          = require('./language').getLanguage;
const default_redirect_url = require('./url').default_redirect_url;
const url_for              = require('./url').url_for;
const get_params           = require('./url').get_params;
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
        Client.set_cookie('token', tokens[loginid].token);
        Client.set('notification_shown', 0);

        // set flags
        GTM.setLoginFlag();

        // redirect url
        redirect_url = sessionStorage.getItem('redirect_url');
        sessionStorage.removeItem('redirect_url');

        // redirect back
        let set_default = true;
        if (redirect_url) {
            const do_not_redirect = ['reset-password', 'lost-password', 'change-password', 'home', '404'];
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
        // Parse url for loginids, tokens, and currencies returned by OAuth
        const params = get_params(window.location);
        const tokens = {};
        let i = 1;
        while (params[`acct${i}`]) {
            const loginid  = params[`acct${i}`];
            const token    = params[`token${i}`];
            const currency = params[`cur${i}`] || '';
            if (loginid && token) {
                tokens[loginid] = { token: token, currency: currency };
            }
            i++;
        }
        if (!isEmptyObject(tokens)) {
            Client.set('tokens', JSON.stringify(tokens));
        }
        return tokens;
    };

    return {
        load: load,
    };
})();

module.exports = LoggedIn;
