const Client = require('./../../common/client');
const Login  = require('./../../common/login');

const ChampionSettings = (function() {
    'use strict';

    let settingsContainer;

    const load = () => {
        settingsContainer = $('.fx-settings');

        if (!Client.is_logged_in()) {
            $('#client_message').show()
                .find('.notice-msg')
                .html('Please <a href="javascript:;">log in</a> to view this page.')
                .find('a')
                .on('click', () => {
                    Login.redirect_to_login();
                });
        } else {
            if (!Client.is_virtual()) {
                settingsContainer
                    .find('#fx-settings-content').show()
                    .find('.fx-real').show();
                return;
            }
            settingsContainer.find('#fx-settings-content').show();
        }
    };

    return {
        load: load,
    };
})();

module.exports = ChampionSettings;
