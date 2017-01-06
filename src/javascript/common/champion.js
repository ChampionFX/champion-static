const ChampionSocket     = require('./socket');
const ChampionRouter     = require('./router');
const ChampionSignup     = require('./../pages/signup');
const ChampionNewVirtual = require('./../pages/new_account/virtual');
const ChampionContact    = require('./../pages/contact');
const ChampionEndpoint   = require('./../pages/endpoint');
const Client             = require('./client');
const LoggedIn           = require('./logged_in');

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
        Client.init();
    };

    const beforeContentChange = () => {
        if (_active_script) {
            if (typeof _active_script.unload === 'function') {
                _active_script.unload();
            }
            _active_script = null;
        }
    };

    const afterContentChange = (e, content) => {
        const page = content.getAttribute('data-page');
        const pages_map = {
            virtual    : ChampionNewVirtual,
            contact    : ChampionContact,
            endpoint   : ChampionEndpoint,
            logged_inws: LoggedIn,
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
