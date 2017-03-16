require('jquery.scrollto');
const Client = require('../common/client');

const ClientType = (function() {
    'use strict';

    const load = () => {
        if (Client.is_logged_in()) {
            $('.virtual-signup').hide();
            if (Client.has_real()) {
                $('.real-signup').hide();
            }
        }
    };

    return {
        load: load,
    };
})();

module.exports = ClientType;
