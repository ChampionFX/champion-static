const ChampionContact = (function() {
    'use strict';

    const load = () => {
        $('#cs_telephone_number').on('change', function() {
            $('#phone-result').html($(this).val());
        });
    };

    const unload = () => {
        $('#cs_telephone_number').off('change');
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = ChampionContact;
