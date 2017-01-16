const Client = require('../../common/client');

const CashierPaymentMethods = (function() {
    'use strict';

    let paymentMethodsContainer;

    const load = () => {
        paymentMethodsContainer = $('.fx-payment-methods');

        if (Client.is_logged_in() && (Client.is_virtual() === 1)) {
            paymentMethodsContainer.find('.fx-real').hide();
            paymentMethodsContainer.find('.fx-logged-out').hide();
        } else if (Client.is_logged_in() && (Client.is_virtual() !== 0)) {
            paymentMethodsContainer.find('.fx-real').show();
            paymentMethodsContainer.find('.fx-logged-out').hide();
        } else {
            paymentMethodsContainer.find('.fx-real').hide();
            paymentMethodsContainer.find('.fx-logged-out').show();
        }
    };

    const unload = () => {

    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = CashierPaymentMethods;
