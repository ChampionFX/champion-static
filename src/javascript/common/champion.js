const ChampionSocket        = require('./socket');
const ChampionRouter        = require('./router');
const ChampionSignup        = require('./../pages/signup');
const ChampionCreateAccount = require('./../pages/create_account');

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
            _active_script.hide();
            _active_script = null;
        }
    };

    const afterContentChange = (e, content) => {
        const tag = content.getAttribute('data-tag');
        if (tag === 'create') {
            _active_script = ChampionCreateAccount;
            _active_script.show(_container);
        } else if (!_authenticated) {
            const form = _container.find('#verify-email-form');
            _active_script = ChampionSignup;
            _active_script.show(form.length ? form : _signup);
        }
    };

    return {
        init: init,
    };
})();

module.exports = Champion;
