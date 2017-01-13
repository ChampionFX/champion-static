const CookieStorage        = require('./storage').CookieStorage;
const LocalStore           = require('./storage').LocalStore;
const default_redirect_url = require('./url').default_redirect_url;
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
        const loginid = Cookies.get('loginid');
        client_object.loginid_array = parseLoginIDList(Cookies.get('loginid_list') || '');
        const is_logged_in = !!(
            loginid &&
            client_object.loginid_array.length > 0 &&
            get_storage_value('tokens') &&
            Cookies.get('token')
        );

        set_storage_value('email', Cookies.get('email'));
        set_storage_value('loginid', loginid);
        set_storage_value('is_logged_in', is_logged_in);
        set_storage_value('residence', Cookies.get('residence'));
    };

    const redirect_if_login = () => {
        if (is_logged_in()) {
            window.location.href = default_redirect_url();
        }
        return is_logged_in();
    };

    const set_storage_value = (key, value) => {
        if (value === undefined) value = '';
        client_object[key] = value;
        return LocalStore.set(`client.${key}`, value);
    };

    // use this function to get variables that have values
    const get_storage_value = key => client_object[key] || LocalStore.get(`client.${key}`) || '';

    // use this function to get variables that are a boolean
    const get_boolean = value => JSON.parse(client_object[value] || get_storage_value(value) || false);

    const response_authorize = (response) => {
        const authorize = response.authorize;
        if (!Cookies.get('email')) {
            set_cookie('email', authorize.email);
            set_storage_value('email', authorize.email);
        }
        set_storage_value('is_virtual', authorize.is_virtual);
        set_storage_value('landing_company_name', authorize.landing_company_name);
        set_storage_value('landing_company_fullname', authorize.landing_company_fullname);
        set_storage_value('currency', authorize.currency);
        client_object.values_set = true;

        if (authorize.is_virtual && !get_boolean('has_real')) {
            $('.upgrade-message').removeClass('hidden');
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
        const tokens = get_storage_value('tokens');
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
        const tokens = get_storage_value('tokens');
        const tokensObj = tokens && tokens.length > 0 ? JSON.parse(tokens) : {};
        tokensObj[client_loginid] = token;
        set_storage_value('tokens', JSON.stringify(tokensObj));
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
        set_storage_value('loginid', client_loginid);
        window.location.href = default_redirect_url();
    };

    const is_logged_in = () => get_boolean('is_logged_in');
    const is_virtual   = () => get_boolean('is_virtual');
    const has_real     = () => get_boolean('has_real');

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
        set_value           : set_storage_value,
        get_value           : get_storage_value,
        get_boolean         : get_boolean,
        response_authorize  : response_authorize,
        clear_storage_values: clear_storage_values,
        get_token           : get_token,
        add_token           : add_token,
        set_cookie          : set_cookie,
        process_new_account : process_new_account,
        is_logged_in        : is_logged_in,
        is_virtual          : is_virtual,
        has_real            : has_real,
        do_logout           : do_logout,
    };
})();

module.exports = Client;
