const ChampionSocket = require('./../../common/socket');
const Client         = require('../../common/client');

const Cashier = (function() {
    'use strict';

    const load = () => {
        ChampionSocket.wait('authorize').then(() => {
            const cashierContainer = $('.fx-cashier');
            if (Client.is_logged_in() && Client.is_virtual()) {
                cashierContainer.find('#fx-virtual').removeClass('hidden');
                $('#deposit-btn, #withdraw-btn').addClass('hidden');
                if (Client.get('balance') > 1000) {
                    disableButton($('#VRT_topup_link'));
                }
            } else if (Client.is_logged_in() && !Client.is_virtual()) {
                cashierContainer.find('#fx-virtual').addClass('hidden');
                $('#deposit-btn, #withdraw-btn').removeClass('hidden');
                ChampionSocket.send({ cashier_password: 1 }).then((response) => {
                    if (!response.error && response.cashier_password === 1) {
                        disableButton($('#deposit-btn, #withdraw-btn'));
                    }
                });
            } else {
                $('#deposit-btn, #withdraw-btn').addClass('hidden');
            }
        });
    };

    const disableButton = ($btn) => {
        $btn.attr('href', `${'javascr'}${'ipt:;'}`).addClass('button-disabled');
    };

    return {
        load: load,
    };
})();

module.exports = Cashier;
