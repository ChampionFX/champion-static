const ChampionSocket = require('./../../common/socket');
const Client = require('../../common/client');

const CashierPaymentMethods = (function() {
    'use strict';

    const hidden_class = 'hidden';

    const load = () => {
        const container = $('.fx-payment-methods');

        ChampionSocket.wait('authorize').then(() => {
            if (!Client.is_logged_in()) {
                container.find('#btn-open-account').removeClass(hidden_class);
            } else if (!Client.is_virtual()) {
                container.find('#btn-deposit').removeClass(hidden_class);
                container.find('#btn-withdraw').removeClass(hidden_class);
            }
        });
    };

    return {
        load: load,
    };
})();

module.exports = CashierPaymentMethods;
