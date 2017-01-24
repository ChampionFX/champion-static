const ChampionSocket = require('./../../common/socket');
const Client = require('../../common/client');

const CashierPaymentMethods = (function() {
    'use strict';

    let paymentMethodsContainer;

    const hidden_class = 'hidden';

    const load = () => {
        paymentMethodsContainer = $('.fx-payment-methods');

        if (!Client.is_logged_in()) {
            paymentMethodsContainer.find('#btn-open-account').removeClass(hidden_class);
        } else {
            ChampionSocket.promise().then(() => {
                if (!Client.is_virtual()) {
                    paymentMethodsContainer.find('#btn-deposit').removeClass(hidden_class);
                    paymentMethodsContainer.find('#btn-withdraw').removeClass(hidden_class);
                }
            });
        }
    };

    return {
        load: load,
    };
})();

module.exports = CashierPaymentMethods;
