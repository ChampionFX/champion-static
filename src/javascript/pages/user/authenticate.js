const ChampionSocket = require('../../common/socket');

const Authenticate = (() => {
    'use strict';

    const load = () => {
        ChampionSocket.send({ get_account_status: 1 }).then((response) => {
            if (response.error) {
                $('#error_message').removeClass('invisible').text(response.error.message);
            } else {
                const status = response.get_account_status.status;
                const authenticated = /authenticated/.test(status);
                const age_verified = /age_verification/.test(status);
                if (authenticated && age_verified) {
                    $('#fully_authenticated').removeClass('invisible');
                } else if (!authenticated) {
                    $('#not_authenticated').removeClass('invisible');
                } else if (!age_verified) {
                    $('#needs_age_verification').removeClass('invisible');
                }
            }
        });
    };

    return {
        load: load,
    };
})();

module.exports = Authenticate;
