const ChampionSocket = require('./../../common/socket');
const Client         = require('./../../common/client');
const Validation     = require('./../../common/validation');
const Login          = require('./../../common/login');

const CashierPassword = (function() {
    'use strict';

    let btn_submit,
        form_type;

    const fields = {
        txt_unlock_password: '#txt_unlock_password',
        txt_lock_password  : '#txt_lock_password',
        txt_re_password    : '#txt_re_password',
        btn_submit         : '#btn_submit',
    };

    const views = {
        logged_out    : 'logged_out',
        virtual       : 'virtual',
        real          : 'real',
        lock_cashier  : 'lock',
        unlock_cashier: 'unlock',
    };

    const load = () => {
        if (!Client.is_logged_in()) {
            renderView(views.logged_out);
        } else {
            ChampionSocket.promise.then(() => {
                if (Client.is_virtual()) {
                    renderView(views.virtual);
                } else {
                    checkCashierState();
                }
            });
        }
    };

    const checkCashierState = () => {
        ChampionSocket.send({ cashier_password: 1 }, (response) => {
            if (response.error) return;
            if (response.cashier_password === 1) {
                form_type = views.unlock_cashier;
            } else {
                form_type = views.lock_cashier;
            }
            renderView(views.real, form_type);
            initForm(form_type);
        });
    };

    const renderView = (view, form) => {
        const $form = $(`#form_${form}_cashier`);

        if (view === views.logged_out) {
            $('#client_message').show()
                .find('.notice-msg').html('Please <a href="javascript:;">log in</a> to view this page.')
                .find('a')
                .on('click', () => {
                    Login.redirect_to_login();
                });
        } else if (view === views.virtual) {
            $('#client_message').show()
                .find('.notice-msg').html('This feature is not relevant to virtual-money accounts.');
        } else if (view === views.real) {
            $form.show();
        }
    };

    const initForm = (form) => {
        const form_selector = `#form_${form_type}_cashier`,
            $form = $(form_selector);

        btn_submit = $form.find(fields.btn_submit);
        btn_submit.on('click', submit);

        if (form === views.lock_cashier) {
            Validation.init(form_selector, [
                { selector: fields.txt_lock_password, validations: ['req', 'password'] },
                { selector: fields.txt_re_password,   validations: ['req', ['compare', { to: fields.txt_lock_password }]] },
            ]);
        } else {
            Validation.init(form_selector, [
                { selector: fields.txt_unlock_password, validations: ['req', 'password'] },
            ]);
        }
    };

    const unload = () => {
        if (btn_submit) {
            btn_submit.off('click', submit);
        }
    };

    const submit = (e) => {
        e.preventDefault();

        const form_selector = `#form_${form_type}_cashier`,
            $form = $(form_selector);

        if (Validation.validate(form_selector)) {
            const req_key = `${form_type}_password`,
                req_val = $(`#txt_${form_type}_password`).val();

            const data = {
                cashier_password: 1,
                [req_key]       : req_val,
            };

            ChampionSocket.send(data, (response) => {
                if (response.error) {
                    $('#error-cashier-password').removeClass('hidden').text(response.error.message);
                } else {
                    $form.hide();
                    $('#client_message').show()
                        .find('.notice-msg').text('Your settings have been updated successfully.');
                }
            });
        }
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = CashierPassword;
