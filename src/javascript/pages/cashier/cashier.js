const ChampionSocket = require('./../../common/socket');
const Client         = require('../../common/client');

const Cashier = (function() {
    'use strict';

    let cashierContainer,
        viewVirtual,
        viewReal;

    const hidden_class = 'hidden';

    const load = () => {
        cashierContainer = $('.fx-cashier');
        viewVirtual = cashierContainer.find('.fx-virtual-account');
        viewReal = cashierContainer.find('.fx-real-account');

        if (Client.is_logged_in()) {
            ChampionSocket.wait('authorize').then(() => {
                if (Client.is_virtual()) {
                    viewVirtual.removeClass(hidden_class);
                    if (Client.get('balance') > 1000) {
                        disableButton($('#VRT_topup_link'));
                    }
                } else {
                    ChampionSocket.send({ cashier_password: 1 }).then((response) => {
                        if (!response.error && response.cashier_password === 1) {
                            disableButton($('#deposit-btn, #withdraw-btn'));
                        }
                        viewReal.removeClass(hidden_class);
                    });
                }
            });
        }
    };

    const disableButton = ($btn) => {
        $btn.attr('href', `${'javascr'}${'ipt:;'}`).addClass('button-disabled');
    };

    return {
        load: load,
    };
})();

module.exports = Cashier;
