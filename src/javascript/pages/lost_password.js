const Client         = require('../common/client');
const Validation     = require('../common/validation');
const ChampionSocket = require('../common/socket');
const url_for        = require('../common/url').url_for;

const LostPassword = (function() {
    'use strict';

    const form_selector = '#frm_lost_password';
    let submit_btn;

    const load = () => {
        if (Client.redirect_if_login()) return;
        submit_btn = $('#lost_passwordws').find('#btn-submit');

        submit_btn.on('click', submit);

        Validation.init(form_selector, [
            { selector: '#lp_email', validations: ['req', 'email'] },
        ]);
    };

    const unload = () => {
        submit_btn.off('click', submit);
    };

    const submit = (e) => {
        e.preventDefault();
        if (Validation.validate(form_selector)) {
            const data = {
                verify_email: $('#lp_email').val(),
                type        : 'reset_password',
            };
            ChampionSocket.send(data, (response) => {
                if (response.error) {
                    $('#error-lost-password').removeClass('invisible').text(response.error.message);
                } else {
                    window.location.href = url_for('reset_password');
                }
            });
        }
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = LostPassword;
