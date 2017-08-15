const Client = require('../common/client');

const MT5 = (() => {
    'use strict';

    const $mt5 = $('#mt5-accounts');

    const load = () => {
        $('.has-tabs').tabs().removeClass('invisible');

        if (Client.is_logged_in()) {
            $mt5.find('.button-disabled').addClass('button').removeClass('button-disabled');
        } else {
            $mt5.find('.button').addClass('button-disabled').removeClass('button');
            $mt5.find('a').removeAttr('href');
        }
    };

    return {
        load: load,
    };
})();

module.exports = MT5;
