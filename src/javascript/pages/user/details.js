const ChampionSocket = require('../../common/socket');
const Client         = require('../../common/client');

const Profile = (() => {
    'use strict';

    // TODO: add response handler
    const load = () => {
        ChampionSocket.send({ acc})

    };

    const unload = () => {

    };

    return {
        load  : load,
        unload: unload,
    }

})();

module.exports = Profile;
