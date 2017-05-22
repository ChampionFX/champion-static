require('jquery.scrollto');
const Client = require('../common/client');
const Login  = require('../common/login');

const ClientType = (function() {
    'use strict';

    const load = () => {
        if (Client.is_logged_in()) {
            $('.virtual-signup').hide();
            if (Client.has_real()) {
                $('.real-signup').hide();
            }
            showContent('.logged-in');
        } else {
            $('#login-link').find('a').on('click', () => { Login.redirect_to_login(); });
            showContent('.logged-out');
        }
    };

    const showContent = (selector) => {
        $('#champion-content').find(selector).removeClass('invisible');
    };

    const unload = () => {
        $('#login-link').find('a').off('click');
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = ClientType;
