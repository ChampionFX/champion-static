const ChampionSocket = require('./../../common/socket');
const Client         = require('../../common/client');

const Cashier = (function() {
    'use strict';

    let cashierContainer;

    const hidden_class = 'hidden';

    const load = () => {
        cashierContainer = $('.fx-cashier');

        if (!Client.is_logged_in()) {
            return;
        } else {
            ChampionSocket.promise().then(() => {
                if (Client.is_virtual()) {
                    cashierContainer.find('.fx-virtual').removeClass(hidden_class);
                    if (Client.get_value('balance') > 1000) {
                        $('#VRT_topup_link')
                            .prop('href', 'javascript;:')
                            .addClass('button-disabled');
                    }
                } else {
                    cashierContainer.find('.fx-real').removeClass(hidden_class);
                }
            });
        }
    };

    return {
        load: load,
    };
})();

module.exports = Cashier;
