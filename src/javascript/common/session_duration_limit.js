const moment         = require('moment');
const Client         = require('./client');
const ChampionSocket = require('./socket');
const template       = require('./utility').template;
const showLightBox   = require('./utility').showLightBox;

const SessionDurationLimit = (() => {
    'use strict';

    let warning,
        timeout_before,
        timeout,
        timeout_logout;

    const init = () => {
        clearTimeout(timeout_before);
        clearTimeout(timeout);
        clearTimeout(timeout_logout);
        $('#session_limit').remove();

        warning = 10 * 1000; // milliseconds before limit to display the warning message

        const limit     = Client.get('session_duration_limit') * 1;
        const now       = moment().unix();
        const start     = Client.get('session_start') * 1;
        const mathLimit = Math.pow(2, 31) - 1;
        let remained  = ((limit + start) - now) * 1000;
        if (remained < 0) remained = warning;

        const setTimeOut = () => {
            timeout = setTimeout(displayWarning, remained - warning);
            timeout_logout = setTimeout(() => { ChampionSocket.send({ logout: 1 }); }, remained);
        };

        // limit of setTimeout is this number
        if (remained > mathLimit) {
            remained %= mathLimit;
            timeout_before = setTimeout(init, remained);
        } else {
            setTimeOut();
        }
    };

    const exclusionResponseHandler = (response) => {
        if (response.error || !response.get_self_exclusion) {
            return;
        }

        const limit = response.get_self_exclusion.session_duration_limit * 60;
        if (isNaN(limit) || limit <= 0) return;

        Client.set('session_duration_limit', limit);
        window.addEventListener('storage', init, false);

        init();
    };

    const displayWarning = () => {
        showLightBox('session_limit', $('<div/>', { class: 'limit_message', text: template('Your session duration limit will end in [_1] seconds.', [warning / 1000]) }));
        $('#session_limit').click(function() { $(this).remove(); });
    };

    return {
        exclusionResponseHandler: exclusionResponseHandler,
    };
})();

module.exports = SessionDurationLimit;
