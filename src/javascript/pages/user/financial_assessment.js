const Header             = require('../../common/header');
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
        arr_validation = [];

    const load = () => {
        showLoadingImage($('<div/>', { id: 'loading', class: 'center-text' }).insertAfter('#heading'));
        $(form_selector).on('submit', (event) => {
            event.preventDefault();
            submitForm();
            return false;
        });

        ChampionSocket.wait('get_financial_assessment').then((response) => {
            handleForm(response);
        });
    };

    const handleForm = (response) => {
        if (!response) {
            response = State.get(['response', 'get_financial_assessment']);
        }
        hideLoadingImg();
        financial_assessment = $.extend({}, response.get_financial_assessment);

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
            arr_validation.push({ selector: `#${$(this).attr('id')}`, validations: ['req'] });
        });
        Validation.init(form_selector, arr_validation);
    };

    const submitForm = () => {
        $('#submit').attr('disabled', 'disabled');

        if (Validation.validate(form_selector)) {
            let hasChanged = false;
            Object.keys(financial_assessment).forEach((key) => {
                const $key = $(`#${key}`);
                if ($key.length && $key.val() !== financial_assessment[key]) {
                    hasChanged = true;
                }
            });
            if (Object.keys(financial_assessment).length === 0) hasChanged = true;
            if (!hasChanged) {
                showFormMessage('You did not change anything.', false);
                setTimeout(() => { $('#submit').removeAttr('disabled'); }, 1000);
                return;
            }

            const data = { set_financial_assessment: 1 };
            showLoadingImage($('#msg_form'));
            $(form_selector).find('select').each(function() {
                financial_assessment[$(this).attr('id')] = data[$(this).attr('id')] = $(this).val();
            });
            ChampionSocket.send(data).then((response) => {
                $('#submit').removeAttr('disabled');
                if ('error' in response) {
                    showFormMessage('Sorry, an error occurred while processing your request.', false);
                } else {
                    showFormMessage('Your changes have been updated successfully.', true);
                    ChampionSocket.send({ get_financial_assessment: 1 }, true).then(() => {
                        Header.displayAccountStatus();
                    });
                }
            });
        } else {
            setTimeout(() => { $('#submit').removeAttr('disabled'); }, 1000);
        }
    };

    const hideLoadingImg = () => {
        $('#loading').remove();
        $(form_selector).removeClass(hidden_class);
    };

    const showFormMessage = (msg, isSuccess) => {
        if (isSuccess) {
            $.scrollTo($('h1#heading'), 500, { offset: -10 });
            $(form_selector).addClass(hidden_class);
            $('#msg_success').removeClass(hidden_class);
            ChampionSocket.send({ get_account_status: 1 }).then((response_status) => {
                if ($.inArray('authenticated', response_status.get_account_status.status) === -1) {
                    $('#msg_authenticate').removeClass(hidden_class);
                }
            });
        } else {
            $('#msg_form').html(msg).delay(5000).fadeOut(1000);
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
