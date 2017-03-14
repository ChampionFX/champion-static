const Client = require('./../../common/client');

const ChampionSettings = (function() {
    'use strict';

    let settingsContainer;

    const load = () => {
        settingsContainer = $('.fx-settings');

        if (!Client.is_virtual()) {
            settingsContainer
                .find('#fx-settings-content, .fx-real').show();
            return;
        }
        settingsContainer.find('#fx-settings-content').show();
    };

    return {
        load: load,
    };
})();

module.exports = ChampionSettings;
