const Client = require('./../../common/client');
const State  = require('./../../common/storage').State;

const ChampionSettings = (function() {
    'use strict';

    let settingsContainer;

    const load = () => {
        State.remove('is_mt_pages');
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
