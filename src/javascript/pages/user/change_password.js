const ChampionSocket = require('./../../common/socket');
const Client         = require('./../../common/client');
const Validation     = require('./../../common/validation');
const Login          = require('./../../common/login');

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
        if (!Client.is_logged_in()) {
            $form.addClass('hidden');
            $('#client_message').show()
                .find('.notice-msg').html('Please <a href="javascript:;">log in</a> to view this page.')
                .find('a')
                .on('click', () => {
                    Login.redirect_to_login();
                });
            return;
        }
        btn_submit = $form.find(fields.btn_submit);
        btn_submit.on('click', submit);
        Validation.init(form_selector, [
            { selector: fields.txt_old_password, validations: ['req', 'password'] },
            { selector: fields.txt_new_password, validations: ['req', 'password'] },
            { selector: fields.txt_re_password,  validations: ['req', ['compare', { to: '#new_password' }]] },
        ]);
    };

    const unload = () => {
        btn_submit.off('click', submit);
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
