const ChampionSocket = require('../../common/socket');
const Client         = require('../../common/client');

const CashierTopUpVirtual = (function() {
    'use strict';

    const hidden_class = 'invisible';

    let viewError,
        viewSuccess;

    const load = () => {
        const container = $('#topup_virtual');
        viewError       = container.find('#viewError');
        viewSuccess     = container.find('#viewSuccess');

        top_up_virtual();
    };

    const top_up_virtual = () => {
        const data = {
            topup_virtual: '1',
        };
        ChampionSocket.send(data).then((response) => {
            $('#topup_loading').remove();
            if (response.error) {
                viewError.removeClass(hidden_class)
                    .find('.notice-msg')
                    .text(response.error.message);
            } else {
                viewSuccess.removeClass(hidden_class)
                    .find('.notice-msg')
                    .text('[_1] [_2] has been credited to your Virtual money account [_3]', [
                        response.topup_virtual.currency,
                        response.topup_virtual.amount,
                        Client.get('loginid'),
                    ]);
            }
        });
    };

    return {
        load          : load,
        top_up_virtual: top_up_virtual,
    };
})();

module.exports = CashierTopUpVirtual;
