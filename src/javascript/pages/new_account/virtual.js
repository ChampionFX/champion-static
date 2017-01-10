const ChampionSocket       = require('../../common/socket');
const Client               = require('../../common/client');
const default_redirect_url = require('../../common/url').default_redirect_url;
const Validation           = require('../../common/validation');

const ChampionNewVirtualAccount = (function() {
    'use strict';

    const form_selector = '#frm_new_account_virtual';

    let _residences = null;

    let _submit_btn,
        _input_residence;

    const load = () => {
        if (Client.redirect_if_login()) return;
        const container = $('#champion-container');
        _input_residence = container.find('#residence');
        _submit_btn      = container.find('#btn-submit');

        _submit_btn.on('click', submit);

        Validation.init(form_selector, [
            { selector: '#verification-code', validations: ['req', ['length', { min: 48, max: 48, message: 'Please submit a valid verification token.' }]] },
            { selector: '#password',          validations: ['req', 'password'] },
            { selector: '#r-password',        validations: ['req', ['compare', { to: '#password' }]] },
            { selector: '#residence',         validations: ['req'] },
        ]);

        if (!_residences) {
            ChampionSocket.send({ residence_list: 1 }, (response) => {
                _residences = response.residence_list;
                renderResidences();
            });
        } else {
            renderResidences();
        }
    };

    const renderResidences = () => {
        _input_residence.empty();
        _residences.forEach((res) => {
            const option = $('<option></option>');
            option.text(res.text);
            option.attr('value', res.value);
            if (res.disabled) {
                option.attr('disabled', '1');
            }
            _input_residence.append(option);
        });
    };

    const unload = () => {
        _submit_btn.off('click', submit);
    };

    const submit = (e) => {
        e.preventDefault();
        if (Validation.validate(form_selector)) {
            const data = {
                new_account_virtual: 1,
                verification_code  : $('#verification-code').val(),
                client_password    : $('#password').val(),
                residence          : $('#residence').val(),
            };
            ChampionSocket.send(data, (response) => {
                if (response.error) {
                    $('#error-create-account').removeClass('hidden').text(response.error.message);
                } else {
                    const acc_info = response.new_account_virtual;
                    Client.process_new_account(acc_info.email, acc_info.client_id, acc_info.oauth_token, true);
                    window.location.href = default_redirect_url();
                }
            });
        }
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = ChampionNewVirtualAccount;
