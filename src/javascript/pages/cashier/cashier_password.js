const ChampionSocket = require('./../../common/socket');
const Validation     = require('./../../common/validation');

const CashierPassword = (function() {
    'use strict';

    let btn_submit,
        form_type;

    const hidden_class = 'invisible';

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
        ChampionSocket.send({ cashier_password: 1 }).then((response) => {
            if (response.error) return;
            if (response.cashier_password === 1) {
                form_type = views.unlock_cashier;
            } else {
                form_type = views.lock_cashier;
            }
            $(`#form_${form_type}_cashier`).removeClass(hidden_class);
            initForm(form_type);
        });
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
                { selector: fields.txt_unlock_password, validations: ['req'] },
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

            ChampionSocket.send(data).then((response) => {
                if (response.error) {
                    $(`${form_selector} #msg_form`).removeClass(hidden_class).text(response.error.message);
                } else {
                    $form.addClass(hidden_class);
                    $('.notice-msg').removeClass(hidden_class).text('Your settings have been updated successfully.');
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
