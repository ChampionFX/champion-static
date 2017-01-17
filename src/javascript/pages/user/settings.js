const Client         = require('./../../common/client');
const Login          = require('./../../common/login');

const ChampionSettings = (function() {
    'use strict';

    let settingsContainer;

    const load = () => {
        settingsContainer = $('.fx-settings');

        if (!Client.is_logged_in()) {
            settingsContainer
                .find('#client_message')
                .show()
                .find('.notice-msg')
                .html('Please <a href="javascript:;">log in</a> to view this page.')
                .find('a')
                .on('click', () => {
                    Login.redirect_to_login();
                });
        } else {
            settingsContainer.find('#fx-settings-content').show();
        }
    };

    return {
        load: load,
    };
})();

module.exports = ChampionSettings;
