const Client = require('../common/client');

const MT5 = (() => {
    'use strict';

    const hidden_class = 'invisible';

    const load = () => {
        $('.has-tabs').tabs().removeClass(hidden_class);

        const $mt5_accounts = $('#mt5-accounts');

        if (Client.is_logged_in()) {
            $mt5_accounts.find('.button-disabled').addClass('button').removeClass('button-disabled');
            $('.mt5-logged-in').removeClass(hidden_class);
            $('.mt5-logged-out').addClass(hidden_class);
        } else {
            $mt5_accounts.find('.button').addClass('button-disabled').removeClass('button');
            $mt5_accounts.find('a').removeAttr('href');
        }
    };

    return {
        load: load,
    };
})();

module.exports = MT5;
