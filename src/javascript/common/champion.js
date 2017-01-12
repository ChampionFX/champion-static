const ChampionSocket     = require('./socket');
const ChampionRouter     = require('./router');
const ChampionSignup     = require('./../pages/signup');
const ChampionNewVirtual = require('./../pages/new_account/virtual');
// const ChampionNewReal    = require('./../pages/new_account/real');
const ChampionContact    = require('./../pages/contact');
const ChampionEndpoint   = require('./../pages/endpoint');
const ChangePassword     = require('./../pages/user/security/change_password');
const BinaryOptions      = require('./../pages/binary_options');
const Client             = require('./client');
const LoggedIn           = require('./logged_in');
const Login              = require('./login');
const Utility            = require('./utility');

const Champion = (function() {
    'use strict';

    let _container,
        _signup,
        _active_script = null;

    const init = () => {
        _container = $('#champion-container');
        _signup = $('#signup');
        _container.on('champion:before', beforeContentChange);
        _container.on('champion:after', afterContentChange);
        Client.init();
        ChampionSocket.init();
        ChampionRouter.init(_container, '#champion-content');
        if (!Client.is_logged_in()) {
            $('#main-login').find('a').on('click', () => { Login.redirect_to_login(); });
        }
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
            virtual         : ChampionNewVirtual,
            // real            : ChampionNewReal,
            contact         : ChampionContact,
            endpoint        : ChampionEndpoint,
            logged_inws     : LoggedIn,
            'binary-options': BinaryOptions,
            change_password : ChangePassword,
        };
        if (page in pages_map) {
            _active_script = pages_map[page];
            _active_script.load();
        }

        const form = _container.find('#verify-email-form');
        if (Client.is_logged_in() || /new-account/.test(window.location.pathname)) {
            form.hide();
        } else {
            if (!_active_script) _active_script = ChampionSignup;
            ChampionSignup.load(form.length ? form : _signup);
        }
        Utility.handleActive();
    };

    return {
        init: init,
    };
})();

module.exports = Champion;
