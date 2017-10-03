const Client = require('../common/client');

const MT5 = (() => {
    'use strict';

    const hidden_class = 'invisible';

    const load = () => {
        $('.has-tabs').tabs().removeClass(hidden_class);

        if (!Client.is_logged_in()) {
            const $signup_btn = $('#mt5-accounts').find('a');
            $signup_btn.addClass('toggle-signup-modal');
            replaceHref($signup_btn);
        }
    };

    const replaceHref = ($element) => {
        $element.attr('href', `${'java'}${'script:;'}`);
    };

    return {
        load: load,
    };
})();

module.exports = MT5;
