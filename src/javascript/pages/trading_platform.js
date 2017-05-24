const ClientType     = require('./client_type');
const Client         = require('../common/client');
const ChampionSocket = require('../common/socket');

const TradingPlatform = (() => {
    'use strict';

    const load = () => {
        ClientType.load();

        const web_url = 'https://trade.mql5.com/trade?servers=ChampionGroup-Server&trade_server=ChampionGroup-Server&demo_server=ChampionGroup-Server&startup_mode=open_demo&lang=en';

        const sendToSignup = () => {
            $('a.mt5-web-platform').attr('href', web_url);
        };

        if (Client.is_logged_in()) {
            ChampionSocket.wait('mt5_login_list').then((response) => {
                if (response.mt5_login_list.length) {
                    $('a.mt5-web-platform').attr('href', web_url.replace('&startup_mode=open_demo', ''));
                } else {
                    sendToSignup();
                }
            });
        } else {
            sendToSignup();
        }
    };

    const unload = () => {
        ClientType.unload();
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = TradingPlatform;
