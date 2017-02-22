const ChampionSocket = require('./../../common/socket');
const Client         = require('../../common/client');

const Cashier = (function() {
    'use strict';

    let cashierContainer;

    const load = () => {
        cashierContainer = $('.fx-cashier');
        if (Client.is_logged_in()) {
            ChampionSocket.wait('authorize').then(() => {
                cashierContainer.find('#fx-real').removeClass('hidden');
                if (Client.is_virtual()) {
                    cashierContainer.find('#fx-virtual').removeClass('hidden');
                    hideButton($('#deposit-btn, #withdraw-btn'));
                    if (Client.get('balance') > 1000) {
                        disableButton($('#VRT_topup_link'));
                    }
                } else {
                    cashierContainer.find('#fx-virtual').addClass('hidden');
                    ChampionSocket.send({ cashier_password: 1 }).then((response) => {
                        if (!response.error && response.cashier_password === 1) {
                            disableButton($('#deposit-btn, #withdraw-btn'));
                        }
                    });
                }
            });
        }
    };

    const disableButton = ($btn) => {
        $btn.attr('href', `${'javascr'}${'ipt:;'}`).addClass('button-disabled');
    };

    const hideButton = ($btn) => {
        $btn.attr('href', `${'javascr'}${'ipt:;'}`).addClass('hidden');
    };

    return {
        load: load,
    };
})();

module.exports = Cashier;
