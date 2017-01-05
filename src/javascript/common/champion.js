const ChampionSocket        = require('./socket');
const ChampionRouter        = require('./router');
const ChampionSignup        = require('./../pages/signup');
const ChampionCreateAccount = require('./../pages/create_account');
const ChampionContact       = require('./../pages/contact');

const Champion = (function() {
    'use strict';

    const _authenticated = false;

    let _container,
        _signup,
        _active_script = null;

    const init = () => {
        _container = $('#champion-container');
        _signup = $('#signup');
        _container.on('champion:before', beforeContentChange);
        _container.on('champion:after', afterContentChange);
        ChampionRouter.init(_container, '#champion-content');
        ChampionSocket.init();
    };

    const beforeContentChange = () => {
        if (_active_script) {
            _active_script.unload();
            _active_script = null;
        }
    };

    const afterContentChange = (e, content) => {
        const page = content.getAttribute('data-page');
        const pages_map = {
            'create-account': ChampionCreateAccount,
            contact         : ChampionContact,
        };
        if (page in pages_map) {
            _active_script = pages_map[page];
            _active_script.load();
        }

        if (!_authenticated) {
            const form = _container.find('#verify-email-form');
            if (!_active_script) _active_script = ChampionSignup;
            ChampionSignup.load(form.length ? form : _signup);
        }
    };

    return {
        init: init,
    };
})();

module.exports = Champion;
