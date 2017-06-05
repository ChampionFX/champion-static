const BinaryOptions = (() => {
    'use strict';

    const load = () => {
        $('.has-tabs').tabs().removeClass('invisible');
    };

    return {
        load: load,
    };
})();

module.exports = BinaryOptions;
