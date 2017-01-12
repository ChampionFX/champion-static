const ChampionSocket = require('./../../../common/socket');
const Client         = require('./../../../common/client');
const Validation     = require('./../../../common/validation');
const Login          = require('./../../../common/login');

const ChangePassword = (function() {
    'use strict';

    const form_selector = '#frm_change_password';

    let $form,
        submit_btn;

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
        submit_btn = $form.find('#change_password_btn');
        submit_btn.on('click', submit);
        Validation.init(form_selector, [
            { selector: '#old_password',    validations: ['req', 'password'] },
            { selector: '#new_password',    validations: ['req', 'password'] },
            { selector: '#repeat_password', validations: ['req', ['compare', { to: '#new_password' }]] },
        ]);
    };

    const unload = () => {
        submit_btn.off('click', submit);
    };

    const submit = (e) => {
        e.preventDefault();
        if (Validation.validate(form_selector)) {
            const data = {
                change_password: 1,
                old_password   : $('#old_password').val(),
                new_password   : $('#new_password').val(),
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
