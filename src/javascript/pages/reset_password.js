const Client         = require('../common/client');
const Validation     = require('../common/validation');
const ChampionSocket = require('../common/socket');
const Login          = require('../common/login');
const DatePicker     = require('../components/date_picker').DatePicker;
const Utility        = require('../common/utility');
const moment         = require('moment');

const ResetPassword = (function() {
    'use strict';

    const form_selector = '#frm_reset_password',
        hiddenClass = 'invisible';

    let container,
        submit_btn,
        real_acc,
        dob_field;

    const fields = {
        email_token: '#verification-code',
        password   : '#password',
        dob        : '#dob',
    };

    const load = () => {
        if (Client.redirect_if_login()) return;
        container  = $(form_selector);
        submit_btn = container.find('#btn-submit');
        real_acc   = container.find('#have-real-account');
        dob_field  = container.find('#dob-field');

        real_acc.on('click', haveRealAccountHandler);
        submit_btn.on('click', submit);
        attachDatePicker();

        Validation.init(form_selector, [
            { selector: fields.email_token, validations: ['req', 'email_token'] },
            { selector: fields.password,    validations: ['req', 'password'] },
            { selector: '#r-password',      validations: ['req', ['compare', { to: fields.password }]] },
            { selector: fields.dob,         validations: ['req'] },
        ]);
    };

    const haveRealAccountHandler = function() {
        dob_field.toggleClass(hiddenClass);
    };

    const submit = (e) => {
        e.preventDefault();
        if (Validation.validate(form_selector)) {
            const data = {
                reset_password   : 1,
                verification_code: $(fields.email_token).val(),
                new_password     : $(fields.password).val(),
            };
            if (real_acc.is(':checked')) {
                data.date_of_birth = $(fields.dob).val();
            }
            ChampionSocket.send(data, (response) => {
                submit_btn.prop('disabled', true);
                $(form_selector).addClass(hiddenClass);
                if (response.error) {
                    $('p.notice-msg').addClass(hiddenClass);
                    $('#reset-error').removeClass(hiddenClass);

                    const resetErrorTemplate = '[_1]' +
                        ' Please click the link below to restart the password recovery process. ' +
                        'If you require further assistance, please contact our Customer Support.';

                    // special handling as backend returns inconsistent format
                    const errMsg = resetErrorTemplate.replace('[_1]',
                        response.error.code === 'InputValidationFailed' ?
                            'Token has expired.' :
                            response.error.message);

                    $('#reset-error-msg').text(errMsg);
                } else {
                    $('p.notice-msg')
                        .text('Your password has been successfully reset. ' +
                            'Please log into your account using your new password.');
                    window.setTimeout(function () {
                        Login.redirect_to_login();
                    }, 5000);
                }
            });
        }
    };

    const attachDatePicker = () => {
        const datePickerInst = new DatePicker(fields.dob);
        datePickerInst.hide();
        datePickerInst.show({
            minDate  : -100 * 365,
            maxDate  : -18  * 365,
            yearRange: '-100:-18',
        });
        $(fields.dob)
            .attr('data-value', Utility.toISOFormat(moment()))
            .change(function() {
                return Utility.dateValueChanged(this, 'date');
            });
    };

    const unload = () => {
        real_acc.off('click', haveRealAccountHandler);
        submit_btn.off('click', submit);
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = ResetPassword;
