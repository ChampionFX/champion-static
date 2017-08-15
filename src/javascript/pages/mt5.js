const Client = require('../common/client');

const MT5 = (() => {
    'use strict';

    const load = () => {
        $('.has-tabs').tabs().removeClass('invisible');

        if (Client.is_logged_in()) {
            $('#mt5-accounts').find('.button-disabled').addClass('button').removeClass('button-disabled');
        } else {
            $('#mt5-accounts').find('.button').addClass('button-disabled').removeClass('button');
            $('#mt5-accounts').find('a').removeAttr('href');
        }
    };

    return {
        load: load,
    };
})();

module.exports = MT5;
