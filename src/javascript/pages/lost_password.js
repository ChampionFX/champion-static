const Client         = require('../common/client');
const Validation     = require('../common/validation');
const ChampionSocket = require('../common/socket');

const LostPassword = (function() {
    'use strict';

    const form_selector = '#frm_lost_password';
    let btn_submit;

    const fields = {
        txt_email : '#txt_email',
        btn_submit: '#btn_submit',
    };

    const load = () => {
        if (Client.redirect_if_login()) return;
        btn_submit = $(form_selector).find(fields.btn_submit);

        btn_submit.on('click', submit);

        Validation.init(form_selector, [
            { selector: fields.txt_email, validations: ['req', 'email'] },
        ]);
    };

    const unload = () => {
        if (btn_submit) {
            btn_submit.off('click', submit);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (Validation.validate(form_selector)) {
            const data = {
                verify_email: $(fields.txt_email).val(),
                type        : 'reset_password',
            };
            ChampionSocket.send(data).then((response) => {
                if (response.error) {
                    $('#msg_form').removeClass('invisible').text(response.error.message);
                } else {
                    $(form_selector).html($('<div/>', { class: 'notice-msg', text: 'Please check your email to complete the process.' }));
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
