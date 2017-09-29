const Notify             = require('../../common/notify');
const ChampionSocket     = require('../../common/socket');
const State              = require('../../common/storage').State;
const isEmptyObject      = require('../../common/utility').isEmptyObject;
const showLoadingImage   = require('../../common/utility').showLoadingImage;
const Validation         = require('../../common/validation');


const FinancialAssessment = (() => {
    'use strict';

    const form_selector = '#assessment_form';
    const hidden_class  = 'invisible';

    let financial_assessment = {},
        arr_validation = [],
        $btn_submit,
        $msg_form,
        $msg_success,
        is_first_time;

    const load = () => {
        showLoadingImage($('<div/>', { id: 'loading', class: 'center-text' }).insertAfter('#heading'));
        $(form_selector).on('submit', (event) => {
            event.preventDefault();
            submitForm();
            return false;
        });

        $btn_submit  = $(form_selector).find('#submit');
        $msg_form    = $(form_selector).find('#msg_form');
        $msg_success = $(form_selector).find('#msg_success');

        ChampionSocket.send({ get_financial_assessment: 1 }, true).then((response) => {
            handleForm(response.get_financial_assessment);
        });
    };

    const handleForm = (response) => {
        if (!response) {
            response = State.get(['response', 'get_financial_assessment']);
        }
        hideLoadingImg();
        financial_assessment = $.extend({}, response);

        is_first_time = isEmptyObject(financial_assessment);

        if (isEmptyObject(financial_assessment)) {
            ChampionSocket.wait('get_account_status').then((data) => {
                if (data.get_account_status.risk_classification === 'high') {
                    $('#high_risk_classification').removeClass(hidden_class);
                }
            });
        }

        Object.keys(financial_assessment).forEach((key) => {
            const val = financial_assessment[key];
            $(`#${key}`).val(val);
        });

        arr_validation = [];
        $(form_selector).find('select').map(function() {
            const id = $(this).attr('id');
            arr_validation.push({ selector: `#${id}`, validations: ['req'] });
            if (financial_assessment[id] === undefined) {  // handle fields not previously set by client
                financial_assessment[id] = '';
            }
        });
        Validation.init(form_selector, arr_validation);
    };

    const submitForm = () => {
        $btn_submit.attr('disabled', 'disabled');

        if (Validation.validate(form_selector)) {
            let has_changed = false;
            Object.keys(financial_assessment).forEach((key) => {
                const $key = $(`#${key}`);
                if ($key.length && $key.val() !== financial_assessment[key]) {
                    has_changed = true;
                }
            });
            if (Object.keys(financial_assessment).length === 0) has_changed = true;
            if (!has_changed) {
                showFormMessage('You did not change anything.', false);
                setTimeout(() => { $btn_submit.removeAttr('disabled'); }, 1000);
                return;
            }

            const data = { set_financial_assessment: 1 };
            showLoadingImage($msg_form);
            $(form_selector).find('select').each(function() {
                financial_assessment[$(this).attr('id')] = data[$(this).attr('id')] = $(this).val();
            });
            ChampionSocket.send(data).then((response) => {
                $btn_submit.removeAttr('disabled');
                if ('error' in response) {
                    showFormMessage('Sorry, an error occurred while processing your request.', false);
                } else {
                    showFormMessage('Your changes have been updated successfully.', true);
                    // need to remove financial_assessment_not_complete from status if any
                    ChampionSocket.send({ get_account_status: 1 }, true).then(() => {
                        Notify.updateNotifications();
                    });
                }
            });
        } else {
            setTimeout(() => { $btn_submit.removeAttr('disabled'); }, 1000);
        }
    };

    const hideLoadingImg = () => {
        $('#loading').remove();
        $(form_selector).removeClass(hidden_class);
    };

    const showFormMessage = (msg, isSuccess) => {
        $msg_form.removeClass(hidden_class).css('display', '').html('');
        if (isSuccess && is_first_time) {
            is_first_time = false;
            $msg_success.removeClass(hidden_class);
            ChampionSocket.send({ get_account_status: 1 }).then((response_status) => {
                if ($.inArray('authenticated', response_status.get_account_status.status) === -1) {
                    $('#msg_authenticate').removeClass(hidden_class);
                }
            });
        } else {
            $msg_success.addClass(hidden_class);
            $msg_form
                .attr('class', isSuccess ? 'success-msg' : 'error-msg').css('display', 'block')
                .html(msg)
                .delay(5000)
                .fadeOut(1000);
        }
    };

    const unload = () => {
        $(form_selector).off('submit');
        $('#msg_success').addClass(hidden_class);
    };

    return {
        load      : load,
        unload    : unload,
        handleForm: handleForm,
        submitForm: submitForm,
    };
})();

module.exports = FinancialAssessment;
