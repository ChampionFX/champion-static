const Client         = require('../common/client');
const ChampionSocket = require('../common/socket');

const MT5WebPlatform = (() => {
    'use strict';

    const load = () => {
        $('#footer').addClass('invisible');
        if (Client.is_logged_in()) {
            ChampionSocket.wait('mt5_login_list').then((response) => {
                setFrameSource(response.mt5_login_list.length > 0);
            });
        } else {
            setFrameSource(false);
        }
    };

    const setFrameSource = (has_mt_account) => {
        let web_url = 'https://trade.mql5.com/trade?servers=ChampionGroup-Server&trade_server=ChampionGroup-Server&demo_server=ChampionGroup-Server&lang=en';
        if (!has_mt_account) {
            web_url += '&startup_mode=open_demo';
        }
        $(document).ready(() => {
            $('iframe#mt5_web_platform').attr('src', web_url).css('height', `calc(100vh - ${$('#top_group').height() + 5}px)`);
        });
    };

    return {
        load: load,
    };
})();

module.exports = MT5WebPlatform;
