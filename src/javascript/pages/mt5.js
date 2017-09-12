const Client = require('../common/client');

const MT5 = (() => {
    'use strict';

    const hidden_class = 'invisible';

    const load = () => {
        $('.has-tabs').tabs().removeClass(hidden_class);
    };

    return {
        load: load,
    };
})();

module.exports = MT5;
