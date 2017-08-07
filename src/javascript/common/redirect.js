const ChampionRouter = require('./router');
const Url            = require('./url');

const Redirect = (function() {
    'use strict';

    const load = () => {
        const actions_map = {
            signup                : { path: 'new-account/virtual' },
            reset_password        : { path: 'reset-password' },
            payment_withdraw      : { path: 'cashier/forward', hash: '#withdraw' },
            payment_agent_withdraw: null, // to be updated once the functionality is available in ChampionFX
        };

        const params = Url.get_params();
        const config = actions_map[params.action];
        ChampionRouter.forward(config && params.code ?
            Url.url_for(config.path, `token=${params.code}${config.hash || ''}`, params.lang) :
            Url.default_redirect_url());
    };

    return {
        load: load,
    };
})();

module.exports = Redirect;
