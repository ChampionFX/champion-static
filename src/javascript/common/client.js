const moment               = require('moment');
const ChampionSocket       = require('./socket');
const CookieStorage        = require('./storage').CookieStorage;
const LocalStore           = require('./storage').LocalStore;
const State                = require('./storage').State;
const url                  = require('./url');
const getPropertyValue     = require('./utility').getPropertyValue;
const isEmptyObject        = require('./utility').isEmptyObject;
const template             = require('./utility').template;
const Cookies              = require('../lib/js-cookie');

const Client = (function () {
    const storage_key = 'client.tokens';
    let client_object = {};
    let current_loginid;

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
        current_loginid = LocalStore.get('client.loginid');
        client_object = getAllAccountsObject();
        client_object.loginid_array = parseLoginIDList(Cookies.get('loginid_list') || '');

        set('email',     Cookies.get('email'));
        set('loginid',   Cookies.get('loginid'));
        set('residence', Cookies.get('residence'));

        endpoint_notification();
        recordAffiliateExposure();
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
            window.location.href = url.default_redirect_url();
        }
        return client_is_logged_in;
    };

    const set = (key, value) => {
        if (value === undefined) value = '';
        client_object[key] = value;
        return LocalStore.set(`client.${key}`, value);
    };

    // TO-DO: Refactor and merge with get function
    const setKey = (key, value, loginid = current_loginid) => {
        if (key === 'loginid' && value !== current_loginid) {
            LocalStore.set('client.loginid', value);
            current_loginid = value;
        } else {
            if (!(loginid in client_object)) {
                client_object[loginid] = {};
            }
            client_object[loginid][key] = value;
            LocalStore.setObject(storage_key, client_object);
        }
    };

    // use this function to get variables that have values
    const get = (key) => {
        let value = client_object[key] || LocalStore.get(`client.${key}`) || '';
        if (!Array.isArray(value) && (+value === 1 || +value === 0 || value === 'true' || value === 'false')) {
            value = JSON.parse(value || false);
        }
        return value;
    };

    // TO-DO: Refactor and merge with get function
    const getKey = (key, loginid = current_loginid) => {
        let value;
        if (key === 'loginid') {
            value = loginid || LocalStore.get('client.loginid');
        } else {
            const current_client = client_object[loginid] || getAllAccountsObject()[loginid] || {};

            value = key ? current_client[key] : current_client;
        }
        if (!Array.isArray(value) && (+value === 1 || +value === 0 || value === 'true' || value === 'false')) {
            value = JSON.parse(value || false);
        }
        return value;
    };

    const getAllAccountsObject = () => LocalStore.getObject(storage_key);

    const getAllLoginids = () => Object.keys(getAllAccountsObject());

    const getAccountType = (loginid = current_loginid) => {
        let account_type;
        if (/^VR/.test(loginid))       account_type = 'virtual';
        else if (/^MF/.test(loginid))  account_type = 'financial';
        else if (/^MLT/.test(loginid)) account_type = 'gaming';
        return account_type;
    };

    const isAccountOfType = (type, loginid = current_loginid, only_enabled = false) => {
        const this_type   = getAccountType(loginid);
        const is_ico_only = get('is_ico_only', loginid);
        return ((
            (type === 'virtual' && this_type === 'virtual') ||
            (type === 'real'    && this_type !== 'virtual') ||
            type === this_type) && !is_ico_only &&              // Account shouldn't be ICO_ONLY.
            (only_enabled ? !get('is_disabled', loginid) : true));
    };

    const getAccountOfType = (type, only_enabled) => {
        const id = getAllLoginids().find(loginid => isAccountOfType(type, loginid, only_enabled));
        return id ? $.extend({ loginid: id }, get(null, id)) : {};
    };

    const hasAccountType = (type, only_enabled) => !isEmptyObject(getAccountOfType(type, only_enabled));

    const types_map = {
        virtual  : 'Virtual',
        gaming   : 'Gaming',
        financial: 'Investment',
    };

    const getAccountTitle = loginid => types_map[getAccountType(loginid)] || 'Real';

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
        set('session_start', parseInt(moment().valueOf() / 1000));
        set('is_virtual', authorize.is_virtual);
        set('landing_company_name', authorize.landing_company_name);
        set('landing_company_fullname', authorize.landing_company_fullname);
        setCurrency(authorize.currency);
        set('balance', authorize.balance);
        updateAccountList(authorize.account_list);
        client_object.values_set = true;

        ChampionSocket.send({ balance: 1, subscribe: 1 });
        ChampionSocket.send({ get_settings: 1 });
        ChampionSocket.send({ get_account_status: 1 });
        ChampionSocket.send({ get_financial_assessment: 1 });
        ChampionSocket.send({ mt5_login_list: 1 });
        ChampionSocket.send({ payout_currencies: 1 });
        if (!authorize.is_virtual) ChampionSocket.send({ get_self_exclusion: 1 });
        const country_code = response.authorize.country;
        if (country_code) {
            set('residence', country_code);
            ChampionSocket.send({ landing_company: country_code });
        }

        $('.btn-logout').click(() => {
            request_logout();
        });
    };

    const updateAccountList = (account_list) => {
        account_list.forEach((account) => {
            setKey('excluded_until', account.excluded_until || '', account.loginid);
            Object.keys(account).forEach((param) => {
                const param_to_set = param === 'country' ? 'residence' : param;
                const value_to_set = typeof account[param] === 'undefined' ? '' : account[param];
                if (param_to_set !== 'loginid') {
                    setKey(param_to_set, value_to_set, account.loginid);
                }
            });
        });
    };

    const should_accept_tnc = () => {
        if (get('is_virtual')) return false;
        const website_tnc_version = State.get(['response', 'website_status', 'website_status', 'terms_conditions_version']);
        const client_tnc_status = State.get(['response', 'get_settings', 'get_settings', 'client_tnc_status']);
        return client_tnc_status && website_tnc_version && client_tnc_status !== website_tnc_version;
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
                token = tokensObj[client_loginid].token;
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
        tokensObj[client_loginid] = { token: token, currency: '' };
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
        localStorage.setItem('GTM_new_account', '1');
        setKey('loginid', client_loginid);
        window.location.href = url.default_redirect_url();
    };

    const request_logout = () => {
        ChampionSocket.send({ logout: '1' });
    };

    const do_logout = (response) => {
        if (response.logout !== 1) return;
        Client.clear_storage_values();
        LocalStore.remove('client.tokens');
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

    const endpoint_notification = () => {
        const server  = localStorage.getItem('config.server_url');
        if (server && server.length > 0) {
            const message = template('This is a staging server - For testing purposes only - The server <a href="[_1]">endpoint</a> is: [_2]',
                [url.url_for('endpoint'), server]);
            const $end_note = $('#end_note');
            $end_note.html(message).removeClass('invisible');
            $('#footer').css('padding-bottom', $end_note.height() + 10);
        }
    };

    const recordAffiliateExposure = () => {
        const is_subsidiary = /\w{1}/.test(url.get_params().s);
        const cookie_token = Cookies.getJSON('affiliate_tracking');
        if (cookie_token && cookie_token.t) {
            set('affiliate_token', cookie_token.t);
            if (is_subsidiary) { // Already exposed to some other affiliate
                return false;
            }
        }

        const token = url.get_params().t;
        if (!token || token.length !== 32) {
            return false;
        }

        // Record the affiliate exposure. Overwrite existing cookie, if any.
        const cookie_hash = {};
        if (token.length === 32) {
            cookie_hash.t = token.toString();
        }
        if (is_subsidiary) {
            cookie_hash.s = '1';
        }

        set_cookie('affiliate_tracking', cookie_hash);
        set('affiliate_token', cookie_hash.t);
        return true;
    };

    const currentLandingCompany = () => {
        const landing_company_response = State.getResponse('landing_company') || {};
        const lc_prop                  = Object.keys(landing_company_response)
             .find(key => get('landing_company_name') === landing_company_response[key].shortcode);
        return landing_company_response[lc_prop] || {};
    };

    const shouldCompleteTax = () => isAccountOfType('financial') && !/crs_tin_information/.test((State.getResponse('get_account_status') || {}).status);


    const getMT5AccountType = (group) => {
        if (group === 'demo\\champion_virtual') group = 'demo\\champion_cent'; // TODO: remove this line (used for backward compatibility)
        return group ? group.replace('\\', '_') : '';
    };

    const hasShortCode = (data, code) => ((data || {}).shortcode === code);

    const canUpgradeVirtualToReal = data => (!data.game_company && !data.financial_company && hasShortCode(data.financial_company, 'costarica'));

    const setCurrency = (currency) => {
        const tokens = get('tokens');
        const tokens_obj = tokens && tokens.length > 0 ? JSON.parse(tokens) : {};
        const loginid = tokens_obj[get('loginid')];
        if (!loginid.currency) {
            loginid.currency = currency;
            set('tokens', JSON.stringify(tokens_obj));
        }
        set('currency', currency);
    };

    const getUpgradeInfo = () => {
        const upgradeable_landing_companies = State.getResponse('authorize.upgradeable_landing_companies');
        const current_landing_company       = State.getResponse('authorize.landing_company_name');
        const type         = 'real';
        const upgrade_link = 'real';

        let can_upgrade  = false;
        if (!get('is_ico_only')) {
            if (get('is_virtual')) {
                const upgradeable = upgradeable_landing_companies;
                can_upgrade = current_landing_company !== 'costarica' && upgradeable.length && upgradeable[0].indexOf('costarica') !== -1;
            }
        }

        return {
            type,
            can_upgrade,
            upgrade_link   : `new-account/${upgrade_link}`,
            is_current_path: new RegExp(upgrade_link, 'i').test(window.location.pathname),
        };
    };

    const getLandingCompanyValue = (loginid, landing_company, key, is_ico_only) => {
        if (is_ico_only) {
            return 'Binary (C.R.) S.A.';
        }
        let landing_company_object;
        if (loginid.financial || isAccountOfType('financial', loginid)) {
            landing_company_object = getPropertyValue(landing_company, 'financial_company');
        } else if (loginid.real || isAccountOfType('real', loginid)) {
            landing_company_object = getPropertyValue(landing_company, 'gaming_company');

            // handle accounts such as japan that don't have gaming company
            if (!landing_company_object) {
                landing_company_object = getPropertyValue(landing_company, 'financial_company');
            }
        } else {
            const financial_company = (getPropertyValue(landing_company, 'financial_company') || {})[key] || [];
            const gaming_company    = (getPropertyValue(landing_company, 'gaming_company') || {})[key] || [];
            landing_company_object  = financial_company.concat(gaming_company);
            return landing_company_object;
        }
        return (landing_company_object || {})[key];
    };

    return {
        init                   : init,
        redirect_if_login      : redirect_if_login,
        set                    : set,
        setKey                 : setKey,
        get                    : get,
        getKey                 : getKey,
        canUpgradeVirtualToReal: canUpgradeVirtualToReal,
        currentLandingCompany  : currentLandingCompany,
        getLandingCompanyValue : getLandingCompanyValue,
        getAccountTitle        : getAccountTitle,
        getAccountType         : getAccountType,
        getAllAccountsObject   : getAllAccountsObject,
        getAllLoginids         : getAllLoginids,
        getUpgradeInfo         : getUpgradeInfo,
        hasAccountType         : hasAccountType,
        isAccountOfType        : isAccountOfType,
        response_authorize     : response_authorize,
        should_accept_tnc      : should_accept_tnc,
        shouldCompleteTax      : shouldCompleteTax,
        clear_storage_values   : clear_storage_values,
        get_token              : get_token,
        add_token              : add_token,
        set_cookie             : set_cookie,
        process_new_account    : process_new_account,
        is_logged_in           : is_logged_in,
        is_virtual             : () => get('is_virtual'),
        has_real               : () => get('has_real'),
        do_logout              : do_logout,
        getMT5AccountType      : getMT5AccountType,
        setCurrency            : setCurrency,
    };
})();

module.exports = Client;
