const moment      = require('moment');
const Client      = require('./client');
const getLanguage = require('./language').get;
const Login       = require('./login');
const getAppId    = require('./socket').getAppId;
const State       = require('./storage').State;
const Cookies     = require('../lib/js-cookie');

const GTM = (() => {
    'use strict';

    const isGtmApplicable = () => (/^(2472|2586)$/.test(getAppId()));

    const gtmDataLayerInfo = (data) => {
        const data_layer_info = {
            language : getLanguage(),
            pageTitle: pageTitle(),
            pjax     : State.get('is_loaded_by_pjax'),
            url      : document.URL,
            event    : 'page_load',
        };

        if (Client.is_logged_in()) {
            data_layer_info.visitorId = Client.get('loginid');

            const mt5_logins = JSON.parse(Client.get('mt5_logins') || '{}');
            Object.keys(mt5_logins).forEach((account_type) => {
                data_layer_info[`mt5_${account_type}`] = mt5_logins[account_type];
            });
        }

        $.extend(true, data_layer_info, data);

        const event = data_layer_info.event;
        delete data_layer_info.event;

        return {
            data : data_layer_info,
            event: event,
        };
    };

    const pushDataLayer = (data) => {
        if (isGtmApplicable() && !Login.is_login_pages()) {
            const info = gtmDataLayerInfo(data && typeof data === 'object' ? data : null);
            dataLayer[0] = info.data;
            dataLayer.push(info.data);
            dataLayer.push({ event: info.event });
        }
    };

    const pageTitle = () => {
        const t = /^.+[:-]\s*(.+)$/.exec(document.title);
        return t && t[1] ? t[1] : document.title;
    };

    const eventHandler = (get_settings) => {
        if (!isGtmApplicable()) return;
        const is_login       = localStorage.getItem('GTM_login')       === '1';
        const is_new_account = localStorage.getItem('GTM_new_account') === '1';
        if (!is_login && !is_new_account) return;

        localStorage.removeItem('GTM_login');
        localStorage.removeItem('GTM_new_account');

        const affiliate_token = Cookies.getJSON('affiliate_tracking');
        if (affiliate_token) {
            pushDataLayer({ bom_affiliate_token: affiliate_token.t });
        }

        const data = {
            visitorId  : Client.get('loginid'),
            bom_country: get_settings.country,
            bom_email  : get_settings.email,
            url        : window.location.href,
            bom_today  : Math.floor(Date.now() / 1000),
            event      : is_new_account ? 'new_account' : 'log_in',
        };
        if (is_new_account) {
            data.bom_date_joined = data.bom_today;
        }
        if (!Client.get('is_virtual')) {
            data.bom_age       = parseInt((moment().unix() - get_settings.date_of_birth) / 31557600);
            data.bom_firstname = get_settings.first_name;
            data.bom_lastname  = get_settings.last_name;
            data.bom_phone     = get_settings.phone;
        }
        pushDataLayer(data);
    };

    return {
        pushDataLayer: pushDataLayer,
        eventHandler : eventHandler,
        setLoginFlag : () => { if (isGtmApplicable()) localStorage.setItem('GTM_login', '1'); },
    };
})();

module.exports = GTM;
