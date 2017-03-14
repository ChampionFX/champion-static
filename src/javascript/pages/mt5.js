const MT5 = (() => {
    'use strict';

    const load = () => {
        $('.has-tabs').tabs().removeClass('invisible');
    };

    return {
        load: load,
    };
})();

module.exports = MT5;
