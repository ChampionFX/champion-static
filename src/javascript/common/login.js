const getAppId    = require('../common/socket').getAppId;
const getLanguage = require('./language').getLanguage;
const Client      = require('./client');

const Login = (function() {
    'use strict';

    const redirect_to_login = () => {
        if (!Client.is_logged_in() && !is_login_pages()) {
            try {
                sessionStorage.setItem('redirect_url', window.location.href);
            } catch (e) {
                console.error('The website needs features which are not enabled on private mode browsing. Please use normal mode.');
            }
            window.location.href = login_url();
        }
    };

    const login_url = () => {
        const server_url = localStorage.getItem('config.server_url');
        return ((server_url && /qa/.test(server_url)) ?
            `https://www.${server_url.split('.')[1]}.com/oauth2/authorize?app_id=${getAppId()}&l=${getLanguage()}&brand=champion` :
            `https://oauth.champion-fx.com/oauth2/authorize?app_id=${getAppId()}&l=${getLanguage()}`
        );
    };

    const social_login = brand => (`${login_url()}&social_signup=${brand}`);

    const is_login_pages = () => /logged_inws/.test(document.URL);

    return {
        redirect_to_login: redirect_to_login,
        login_url        : login_url,
        is_login_pages   : is_login_pages,
        social_login     : social_login,
    };
})();

module.exports = Login;
