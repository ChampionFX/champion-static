var Cookies = require('../lib/js-cookie');
var ChampionSocket        = require('./socket');
var ChampionRouter        = require('./router');
var ChampionSignup        = require('./signup');
var ChampionCreateAccount = require('./create_account');

var Champion = (function() {
    'use strict';

    var _authenticated = false;

    var _container;
    var _signup;

    var _active_script = null;

    function init() {
        _container = $('#champion-container');
        _signup = $('#signup');
        _container.on('champion:before', beforeContentChange);
        _container.on('champion:after', afterContentChange);
        ChampionRouter.init(_container, '#champion-content');
    }

    function beforeContentChange() {
        if (_active_script) {
            _active_script.hide();
            _active_script = null;
        }
    }

    function afterContentChange(e, content) {
        var tag = content.getAttribute('data-tag');
        if (tag === 'create') {
            _active_script = ChampionCreateAccount;
            _active_script.show(_container);
        } else if (!_authenticated) {
            var form = _container.find('#verify-email-form');
            _active_script = ChampionSignup;
            _active_script.show(form.length ? form : _signup);
        }
    }

    function socketMessage(message) {
        if (!message) { // socket just opened
            var token = Cookies.get('token');
            if (token) {
                ChampionSocket.send({ authorize: token });
            }
        } else {
            switch (message.msg_type) {
                case 'authenticate':
                    break;
                // no default
            }
            console.log(message);
        }
    }

    ChampionSocket.init(socketMessage);

    return {
        init: init,
    };
})();

module.exports = Champion;
