const Client = require('./../../common/client');

const ChampionSecurity = (function() {
    'use strict';

    let securityContainer;

    const load = () => {
        securityContainer = $('.fx-security');
        securityContainer.find('#fx-security-content').show();
        if (!Client.is_virtual()) {
            securityContainer.find('.fx-real').show();
        }
    };

    return {
        load: load,
    };
})();

module.exports = ChampionSecurity;
