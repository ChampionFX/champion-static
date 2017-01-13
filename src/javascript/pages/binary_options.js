require('jquery.scrollto');
const Client = require('../common/client');

const BinaryOptions = (function() {
    'use strict';

    const load = () => {
        if (Client.is_logged_in()) {
            $('#virtual-signup-button').hide();
            if (Client.has_real()) {
                $('#real-signup-button').hide();
            }
        } else {
            $('#virtual-signup-button').on('click', function() {
                $.scrollTo('#verify-email-form', 500);
            });
        }
    };

    const unload = () => {
        $('#virtual-signup-button').off('click');
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = BinaryOptions;
