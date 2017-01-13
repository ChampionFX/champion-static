const ChampionSocket       = require('../../common/socket');
const Client               = require('../../common/client');
const State                = require('../../common/storage').State;
const Utility              = require('../../common/utility');
const default_redirect_url = require('../../common/url').default_redirect_url;
const Validation           = require('../../common/validation');

const ChampionNewVirtualAccount = (function() {
    'use strict';

    const form_selector = '#frm_new_account_virtual';

    let residences = null;

    let btn_submit,
        input_residence;

    const load = () => {
        if (Client.redirect_if_login()) return;
        const container = $('#champion-container');
        input_residence = container.find('#residence');
        btn_submit      = container.find('#btn-submit');

        btn_submit.on('click dblclick', submit);

        Validation.init(form_selector, [
            { selector: '#verification-code', validations: ['req', 'email_token'] },
            { selector: '#password',          validations: ['req', 'password'] },
            { selector: '#r-password',        validations: ['req', ['compare', { to: '#password' }]] },
            { selector: '#residence',         validations: ['req'] },
        ]);

        populateResidence();
    };

    const populateResidence = () => {
        residences = State.get('response').residence_list;
        const renderResidence = () => {
            Utility.dropDownFromObject(input_residence, residences);
        };
        if (!residences) {
            ChampionSocket.send({ residence_list: 1 }, (response) => {
                residences = response.residence_list;
                renderResidence();
            });
        } else {
            renderResidence();
        }
    };

    const unload = () => {
        btn_submit.off('click', submit);
    };

    const submit = (e) => {
        e.preventDefault();
        btn_submit.attr('disabled', 'disabled');
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
                    btn_submit.removeAttr('disabled');
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
