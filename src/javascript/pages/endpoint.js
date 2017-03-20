const getAppId  = require('../common/socket').getAppId;
const getServer = require('../common/socket').getServer;

const ChampionEndpoint = (function() {
    'use strict';

    let $container,
        $txt_server_url,
        $txt_app_id,
        $btn_submit,
        $btn_reset;

    const load = () => {
        $container      = $('#champion-container');
        $txt_server_url = $container.find('#txt_server_url');
        $txt_app_id     = $container.find('#txt_app_id');
        $btn_submit     = $container.find('#btn_submit');
        $btn_reset      = $container.find('#btn_reset');

        $txt_server_url.val(getServer());
        $txt_app_id.val(getAppId());

        $btn_submit.on('click', (e) => {
            e.preventDefault();

            const server_url = (($txt_server_url.val() || '').trim().toLowerCase()).replace(/[><()\"\']/g, '');
            if (server_url) {
                localStorage.setItem('config.server_url', server_url);
            }

            const app_id = ($txt_app_id.val() || '').trim();
            if (app_id && !isNaN(app_id)) {
                localStorage.setItem('config.app_id', parseInt(app_id));
            }

            window.location.reload();
        });

        $btn_reset.on('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('config.server_url');
            localStorage.removeItem('config.app_id');
            window.location.reload();
        });
    };

    const unload = () => {
        $btn_submit.off('click');
        $btn_reset.off('click');
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = ChampionEndpoint;
