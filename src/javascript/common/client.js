const CookieStorage        = require('./storage').CookieStorage;
const LocalStore           = require('./storage').LocalStore;
const State                = require('./storage').State;
const default_redirect_url = require('./url').default_redirect_url;
const url_for              = require('./url').url_for;
const ChampionSocket       = require('./socket');
const Cookies              = require('../lib/js-cookie');

const Client = (function () {
    const client_object = {};

    const parseLoginIDList = (string) => {
        if (!string) return [];
        return string.split('+').sort().map((str) => {
            const items = str.split(':');
            const id = items[0];
            const real = items[1] === 'R';
            if (real) client_object.has_real = real;
            return {
                id      : id,
                real    : real,
                disabled: items[2] === 'D',
            };
        });
    };

    const init = () => {
        client_object.loginid_array = parseLoginIDList(Cookies.get('loginid_list') || '');

        set('email',     Cookies.get('email'));
        set('loginid',   Cookies.get('loginid'));
        set('residence', Cookies.get('residence'));
    };

    const is_logged_in = () => (
        Cookies.get('token') &&
        Cookies.get('loginid') &&
        get('tokens') &&
        client_object.loginid_array.length > 0
    );

    const redirect_if_login = () => {
        const client_is_logged_in = is_logged_in();
        if (client_is_logged_in) {
            window.location.href = default_redirect_url();
        }
        return client_is_logged_in;
    };

    const set = (key, value) => {
        if (value === undefined) value = '';
        client_object[key] = value;
        return LocalStore.set(`client.${key}`, value);
    };

    // use this function to get variables that have values
    const get = (key) => {
        let value = client_object[key] || LocalStore.get(`client.${key}`) || '';
        if (!Array.isArray(value) && (+value === 1 || +value === 0 || value === 'true' || value === 'false')) {
            value = JSON.parse(value || false);
        }
        return value;
    };

    const response_authorize = (response) => {
        if (response.error || response.authorize.loginid !== Client.get('loginid')) {
            request_logout();
            return;
        }

        const authorize = response.authorize;
        if (!Cookies.get('email')) {
            set_cookie('email', authorize.email);
            set('email', authorize.email);
        }
        set('is_virtual', authorize.is_virtual);
        set('landing_company_name', authorize.landing_company_name);
        set('landing_company_fullname', authorize.landing_company_fullname);
        set('currency', authorize.currency);
        set('balance', authorize.balance);
        client_object.values_set = true;

        if (authorize.is_virtual && !get('has_real')) {
            $('.upgrade-message').removeClass('hidden');
        }

        ChampionSocket.send({ balance: 1, subscribe: 1 });
        ChampionSocket.send({ get_settings: 1 });
        ChampionSocket.send({ get_account_status: 1 });
        const country_code = response.authorize.country;
        if (country_code) {
            Client.set('residence', country_code);
            ChampionSocket.send({ landing_company: country_code });
        }

        $('#btn_logout').click(() => {
            request_logout();
        });
    };

    const check_tnc = function() {
        if (/tnc-approval/.test(window.location.href) ||
            /terms-and-conditions/.test(window.location.href) ||
            get('is_virtual')) {
            return;
        }
        const client_tnc_status = State.get(['response', 'get_settings', 'get_settings', 'client_tnc_status']),
            terms_conditions_version = State.get(['response', 'website_status', 'website_status', 'terms_conditions_version']);
        if (client_tnc_status !== terms_conditions_version) {
            sessionStorage.setItem('tnc_redirect', window.location.href);
            window.location.href = url_for('user/tnc-approval');
        }
    };

    const clear_storage_values = () => {
        // clear all client values from local storage
        Object.keys(localStorage).forEach(function(c) {
            if (/^client\.(?!(tokens$))/.test(c)) {
                LocalStore.set(c, '');
            }
        });
        sessionStorage.setItem('currencies', '');
    };

    const get_token = (client_loginid) => {
        let token;
        const tokens = get('tokens');
        if (client_loginid && tokens) {
            const tokensObj = JSON.parse(tokens);
            if (client_loginid in tokensObj && tokensObj[client_loginid]) {
                token = tokensObj[client_loginid];
            }
        }
        return token;
    };

    const add_token = (client_loginid, token) => {
        if (!client_loginid || !token || get_token(client_loginid)) {
            return false;
        }
        const tokens = get('tokens');
        const tokensObj = tokens && tokens.length > 0 ? JSON.parse(tokens) : {};
        tokensObj[client_loginid] = token;
        set('tokens', JSON.stringify(tokensObj));
        return true;
    };

    const set_cookie = (cookieName, value, domain) => {
        const cookie_expire = new Date();
        cookie_expire.setDate(cookie_expire.getDate() + 60);
        const cookie = new CookieStorage(cookieName, domain);
        if (value === undefined) value = '';
        cookie.write(value, cookie_expire, true);
    };

    const process_new_account = (client_email, client_loginid, token, virtual_client) => {
        if (!client_email || !client_loginid || !token) {
            return;
        }
        // save token
        add_token(client_loginid, token);
        // set cookies
        set_cookie('email',        client_email);
        set_cookie('token',        token);
        set_cookie('loginid',      client_loginid);
        set_cookie('loginid_list', virtual_client ? `${client_loginid}:V:E` : `${client_loginid}:R:E+${Cookies.get('loginid_list')}`);
        // set local storage
        set('loginid', client_loginid);
        window.location.href = default_redirect_url();
    };

    const request_logout = () => {
        ChampionSocket.send({ logout: '1' });
    };

    const do_logout = (response) => {
        if (response.logout !== 1) return;
        Client.clear_storage_values();
        LocalStore.remove('client.tokens');
        sessionStorage.removeItem('client_status');
        const cookies = ['token', 'loginid', 'loginid_list', 'email'];
        const domains = [
            `.${document.domain.split('.').slice(-2).join('.')}`,
            `.${document.domain}`,
        ];

        let parent_path = window.location.pathname.split('/', 2)[1];
        if (parent_path !== '') {
            parent_path = `/${parent_path}`;
        }

        cookies.forEach(function(c) {
            const regex = new RegExp(c);
            Cookies.remove(c, { path: '/', domain: domains[0] });
            Cookies.remove(c, { path: '/', domain: domains[1] });
            Cookies.remove(c);
            if (regex.test(document.cookie) && parent_path) {
                Cookies.remove(c, { path: parent_path, domain: domains[0] });
                Cookies.remove(c, { path: parent_path, domain: domains[1] });
                Cookies.remove(c, { path: parent_path });
            }
        });
        window.location.reload();
    };

    return {
        init                : init,
        redirect_if_login   : redirect_if_login,
        set                 : set,
        get                 : get,
        response_authorize  : response_authorize,
        check_tnc           : check_tnc,
        clear_storage_values: clear_storage_values,
        get_token           : get_token,
        add_token           : add_token,
        set_cookie          : set_cookie,
        process_new_account : process_new_account,
        is_logged_in        : is_logged_in,
        is_virtual          : () => get('is_virtual'),
        has_real            : () => get('has_real'),
        do_logout           : do_logout,
    };
})();

module.exports = Client;
