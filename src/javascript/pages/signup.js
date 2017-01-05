const ChampionSocket = require('./../common/socket');
const ChampionRouter = require('./../common/router');
const url_for = require('../common/url').url_for;

const ChampionSignup = (function() {
    'use strict';

    let _active = false,
        _element,
        _input,
        _error_empty,
        _error_email,
        _button,
        _timeout;

    const _email_regex = /[^@]+@[^@\.]+\.[^@]+/;
    // const _email_regex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/;
    const _validate_delay = 500;

    const load = (element) => {
        _element     = element;
        _input       = _element.find('input');
        _error_empty = _element.find('#signup_error_empty');
        _error_email = _element.find('#signup_error_email');
        _button      = _element.find('button');

        _element.removeClass('hidden');
        _input.on('input', inputChanged);
        _button.on('click', submitClicked);

        _active = true;
    };

    const unload = () => {
        if (_active) {
            _element.addClass('hidden');
            _input.off('input', inputChanged);
            _button.off('click', submitClicked);
            _input.val('');
            _error_empty.addClass('hidden');
            _error_email.addClass('hidden');
            if (_timeout) {
                clearTimeout(_timeout);
            }
        }
        _active = false;
    };

    const inputChanged = () => {
        if (_timeout) {
            clearTimeout(_timeout);
        }
        _timeout = setTimeout(validate, _validate_delay);
    };

    const validate = () => {
        let value,
            error = true;
        if (_active) {
            value = _input.val();
            _error_empty.addClass('hidden');
            _error_email.addClass('hidden');
            if (!value || value.length < 1) {
                _error_empty.removeClass('hidden');
            } else if (!_email_regex.test(value)) {
                _error_email.removeClass('hidden');
            } else {
                error = false;
            }
        }
        return !error;
    };


    const submitClicked = (e) => {
        e.preventDefault();
        if (_active && validate()) {
            ChampionSocket.send({
                verify_email: _input.val(),
                type        : 'account_opening',
            }, function(response) {
                if (response.verify_email) {
                    ChampionRouter.forward(url_for('create-account'));
                }
            });
        }
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = ChampionSignup;
