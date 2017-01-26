const ChampionSocket = require('./../../common/socket');
const Client         = require('../../common/client');

const Cashier = (function() {
    'use strict';

    const hidden_class = 'hidden';

    const load = () => {
        const container = $('.fx-cashier');

        if (Client.is_logged_in()) {
            ChampionSocket.wait('authorize').then(() => {
                if (Client.is_virtual()) {
                    container.find('.fx-virtual').removeClass(hidden_class);
                    if (Client.get('balance') > 1000) {
                        $('#VRT_topup_link')
                            .prop('href', 'javascript;:')
                            .addClass('button-disabled');
                    }
                } else {
                    container.find('.fx-real').removeClass(hidden_class);
                }
            });
        }
    };

    return {
        load: load,
    };
})();

module.exports = Cashier;
