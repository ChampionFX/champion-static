const ChampionSocket = require('../../common/socket');
const Client         = require('../../common/client');
const Login          = require('../../common/login');

const CashierTopUpVirtual = (function() {
    'use strict';

    let topUpContainer,
        viewError,
        viewSuccess;

    const hidden_class = 'hidden';

    const load = () => {
        topUpContainer = $('#topup_virtual');
        viewError      = topUpContainer.find('#viewError');
        viewSuccess    = topUpContainer.find('#viewSuccess');

        if (!Client.is_logged_in()) {
            viewError.removeClass(hidden_class)
                .find('.notice-msg').html('Please <a href="javascript:;">log in</a> to view this page.')
                .find('a')
                .on('click', () => {
                    Login.redirect_to_login();
                });
        } else {
            ChampionSocket.promise().then(() => {
                if (Client.is_virtual()) {
                    top_up_virtual();
                } else {
                    viewError.removeClass(hidden_class)
                        .find('.notice-msg')
                        .text('Sorry, this feature is available to virtual accounts only.');
                }
            });
        }
    };

    const top_up_virtual = () => {
        const data = {
            topup_virtual: '1',
        };
        ChampionSocket.send(data, (response) => {
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
                        Client.get_value('loginid'),
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
