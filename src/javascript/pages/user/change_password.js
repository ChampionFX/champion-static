const ChampionSocket = require('./../../common/socket');
const Validation     = require('./../../common/validation');

const ChangePassword = (function() {
    'use strict';

    const form_selector = '#frm_change_password';

    let $form,
        btn_submit;

    const fields = {
        txt_old_password: '#txt_old_password',
        txt_new_password: '#txt_new_password',
        txt_re_password : '#txt_re_password',
        btn_submit      : '#btn_submit',
    };

    const load = () => {
        $form = $(`${form_selector}:visible`);
        btn_submit = $form.find(fields.btn_submit);
        btn_submit.on('click', submit);
        Validation.init(form_selector, [
            { selector: fields.txt_old_password, validations: ['req', 'password'] },
            { selector: fields.txt_new_password, validations: ['req', 'password'] },
            { selector: fields.txt_re_password,  validations: ['req', ['compare', { to: fields.txt_new_password }]] },
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
                change_password: 1,
                old_password   : $(fields.txt_old_password).val(),
                new_password   : $(fields.txt_new_password).val(),
            };
            ChampionSocket.send(data, (response) => {
                if (response.error) {
                    $('#error-change-password').removeClass('hidden').text(response.error.message);
                } else {
                    setTimeout(() => {
                        ChampionSocket.send({ logout: 1 });
                    }, 5000);
                    $form.addClass('hidden');
                    $('#client_message').show().find('.notice-msg').text('Your password has been changed. Please log in again.');
                }
            });
        }
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = ChangePassword;
