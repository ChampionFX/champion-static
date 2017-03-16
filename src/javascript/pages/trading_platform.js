const Login = require('./../common/login');

const ChampionTradingPlatform = (function() {
    'use strict';

    const load = () => {
        $('#login-link').on('click', function() {
            Login.redirect_to_login();
        });
    };

    const unload = () => {
        $('#login-link').off('click');
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = ChampionTradingPlatform;
