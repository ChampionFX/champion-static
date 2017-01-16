const ChampionSocket = require('../../common/socket');
const Client         = require('../../common/client');
const Login          = require('../../common/login');

const CashierTopUpVirtual = (function() {
    'use strict';

    let container,
        viewError,
        viewSuccess;

    const load = () => {
        container   = $('#topup_virtual');
        viewError   = container.find('#viewError');
        viewSuccess = container.find('#viewSuccess');

        if (Client.is_logged_in() && (Client.is_virtual() === 1)) {
            top_up_virtual();
        } else if (Client.is_logged_in() && (Client.is_virtual() !== 0)) {
            viewError.removeClass('hidden')
                .find('.notice-msg')
                .text('Sorry, this feature is available to virtual accounts only.');
        } else {
            viewError.removeClass('hidden')
                .find('.notice-msg').html('Please <a href="javascript:;">log in</a> to view this page.')
                .find('a')
                .on('click', () => {
                    Login.redirect_to_login();
                });
        }
    };

    const top_up_virtual = () => {
        const data = {
            topup_virtual: '1',
        };
        ChampionSocket.send(data, (response) => {
            if (response.error) {
                viewError.removeClass('hidden')
                    .find('.notice-msg')
                    .text(response.error.message);
            } else {
                viewSuccess.removeClass('hidden')
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
