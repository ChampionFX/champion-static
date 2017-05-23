const moment         = require('moment');
const Client         = require('./client');
const getLanguage    = require('./language').getLanguage;
const Login          = require('./login');
const ChampionSocket = require('./socket');
const State          = require('./storage').State;
const Cookies        = require('../lib/js-cookie');

const GTM = (() => {
    'use strict';

    const isGtmApplicable = () => (/^(2472|2586)$/.test(ChampionSocket.getAppId()));

    const gtmDataLayerInfo = (data) => {
        const data_layer_info = {
            language : getLanguage(),
            pageTitle: pageTitle(),
            pjax     : !!State.get('is_loaded_by_pjax'),
            event    : 'page_load',
        };

        if (Client.is_logged_in()) {
            data_layer_info.visitorId = Client.get('loginid');
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
        const t = /^(.+)\s*\|\s*.+$/.exec(document.title);
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

        if (is_login) {
            ChampionSocket.wait('mt5_login_list').then((response) => {
                (response.mt5_login_list || []).forEach((obj) => {
                    const acc_type = (Client.getMT5AccountType(obj.group) || '')
                        .replace('champion_', '').replace('real', 'financial'); // i.e. financial_cent, demo_cent
                    if (acc_type) {
                        data[`mt5_${acc_type}_id`] = obj.login;
                    }
                });
                pushDataLayer(data);
            });
        } else {
            pushDataLayer(data);
        }
    };

    const mt5NewAccount = (response) => {
        const acc_type = `${response.mt5_new_account.account_type}_${response.mt5_new_account.mt5_account_type}`;
        const gtm_data = {
            event          : 'mt5_new_account',
            bom_email      : Client.get('email'),
            bom_country    : State.get(['response', 'get_settings', 'get_settings', 'country']),
            mt5_last_signup: acc_type, // i.e. financial_cent, demo_cent
        };
        gtm_data[`mt5_${acc_type}_id`] = response.mt5_new_account.login;
        if (/demo/.test(acc_type) && !Client.is_virtual()) {
            gtm_data.visitorId = Client.get('loginid_array').find(login => !login.real).id;
        }
        GTM.pushDataLayer(gtm_data);
    };

    return {
        pushDataLayer: pushDataLayer,
        eventHandler : eventHandler,
        mt5NewAccount: mt5NewAccount,
        setLoginFlag : () => { if (isGtmApplicable()) localStorage.setItem('GTM_login', '1'); },
    };
})();

module.exports = GTM;
