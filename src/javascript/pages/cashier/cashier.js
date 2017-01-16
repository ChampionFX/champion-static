const Client = require('../../common/client');

const Cashier = (function() {
    'use strict';

    let cashierContainer;

    const load = () => {
        cashierContainer = $('.fx-cashier');

        if (Client.is_logged_in() && (Client.is_virtual() === 1)) {
            cashierContainer.find('.fx-virtual').show();
            cashierContainer.find('.fx-real').hide();
            if (Client.get_value('balance') > 1000) {
                $('#VRT_topup_link')
                    .prop('href', 'javascript;:')
                    .addClass('button-disabled');
            }
        } else if (Client.is_logged_in() && (Client.is_virtual() !== 0)) {
            cashierContainer.find('.fx-real').show();
            cashierContainer.find('.fx-virtual').hide();
        } else {
            cashierContainer.find('.fx-virtual').hide();
            cashierContainer.find('.fx-real').hide();
        }
    };

    return {
        load: load,
    };
})();

module.exports = Cashier;
