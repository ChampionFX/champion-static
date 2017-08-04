const moment         = require('moment');
const Client         = require('../common/client');
const Login          = require('../common/login');
const ChampionSocket = require('../common/socket');
const get_params     = require('../common/url').get_params;
const Utility        = require('../common/utility');
const Validation     = require('../common/validation');
const DatePicker     = require('../components/date_picker').DatePicker;

const ResetPassword = (function() {
    'use strict';

    const form_selector = '#frm_reset_password';
    const hidden_class  = 'invisible';

    let $container,
        $btn_submit,
        $real_acc;

    const fields = {
        txt_password   : '#txt_password',
        txt_re_password: '#txt_re_password',
        chk_has_real   : '#chk_has_real',
        txt_birth_date : '#txt_birth_date',
        btn_submit     : '#btn_submit',
    };

    const load = () => {
        if (Client.redirect_if_login()) return;
        $container  = $(form_selector);
        $btn_submit = $container.find(fields.btn_submit);
        $real_acc   = $container.find(fields.chk_has_real);

        $real_acc.on('click', haveRealAccountHandler);
        $btn_submit.on('click', submit);
        attachDatePicker();

        Validation.init(form_selector, [
            { selector: fields.txt_password,    validations: ['req', 'password'] },
            { selector: fields.txt_re_password, validations: ['req', ['compare', { to: fields.txt_password }]] },
            { selector: fields.txt_birth_date,  validations: ['req'] },
        ], true);
    };

    const haveRealAccountHandler = function() {
        $container.find('.dob_row').toggleClass(hidden_class);
    };

    const submit = (e) => {
        e.preventDefault();
        if (Validation.validate(form_selector)) {
            const data = {
                reset_password   : 1,
                verification_code: get_params().token,
                new_password     : $(fields.txt_password).val(),
            };
            if ($real_acc.is(':checked')) {
                data.date_of_birth = $(fields.txt_birth_date).val();
            }
            ChampionSocket.send(data).then((response) => {
                $btn_submit.prop('disabled', true);
                $(form_selector).addClass(hidden_class);
                if (response.error) {
                    $('p.notice-msg').addClass(hidden_class);
                    $('#reset-error').removeClass(hidden_class);

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
        const datePickerInst = new DatePicker(fields.txt_birth_date);
        datePickerInst.hide();
        datePickerInst.show({
            minDate  : -100 * 365,
            maxDate  : (-18 * 365) - 5,
            yearRange: '-100:-18',
        });
        $(fields.txt_birth_date)
            .attr('data-value', Utility.toISOFormat(moment()))
            .change(function() {
                return Utility.dateValueChanged(this, 'date');
            });
    };

    const unload = () => {
        if ($btn_submit) {
            $real_acc.off('click', haveRealAccountHandler);
            $btn_submit.off('click', submit);
        }
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = ResetPassword;
