const showLoadingImage = require('../../../common/utility').showLoadingImage;
const Client           = require('../../../common/client');
const ChampionSocket   = require('../../../common/socket');
const Validation       = require('../../../common/validation');

const FinancialAssessment = (() => {
    'use strict';

    const form_selector = '#assessment_form';

    let financial_assessment = {},
        arr_validation = [];

    const load = () => {
        showLoadingImage($('<div/>', { id: 'loading', class: 'center-text' }).insertAfter('#heading'));
        if (checkIsVirtual()) return;
        $(form_selector).on('submit', (event) => {
            event.preventDefault();
            submitForm();
            return false;
        });
        ChampionSocket.promise.then(() => {
            if (checkIsVirtual()) return;
            ChampionSocket.send({ get_financial_assessment: 1 }, (response) => {
                hideLoadingImg();
                financial_assessment = response.get_financial_assessment;
                Object.keys(response.get_financial_assessment).forEach((key) => {
                    const val = response.get_financial_assessment[key];
                    $(`#${key}`).val(val);
                });
                arr_validation = [];
                const all_ids = $(form_selector).find('.form-input').find('>:first-child');
                for (let i = 0; i < all_ids.length; i++) {
                    arr_validation.push({ selector: `#${all_ids[i].getAttribute('id')}`, validations: ['req'] });
                }
                Validation.init(form_selector, arr_validation);
            });
        });
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
            showLoadingImage($('#form_message'));
            $('#assessment_form').find('select').each(function() {
                financial_assessment[$(this).attr('id')] = data[$(this).attr('id')] = $(this).val();
            });
            ChampionSocket.send(data, (response) => {
                $('#submit').removeAttr('disabled');
                if ('error' in response) {
                    showFormMessage('Sorry, an error occurred while processing your request.', false);
                } else {
                    showFormMessage('Your settings have been updated successfully.', true);
                }
            });
        } else {
            setTimeout(() => { $('#submit').removeAttr('disabled'); }, 1000);
        }
    };

    const hideLoadingImg = (show_form) => {
        $('#loading').remove();
        if (typeof show_form === 'undefined') {
            show_form = true;
        }
        if (show_form) {
            $('#assessment_form').removeClass('invisible');
        }
    };

    const checkIsVirtual = () => {
        if (Client.get_boolean('is_virtual')) {
            $('#assessment_form').addClass('invisible');
            $('#response_on_success').addClass('notice-msg center-text').removeClass('invisible').text('This feature is not relevant to virtual-money accounts.');
            hideLoadingImg(false);
            return true;
        }
        return false;
    };

    const showFormMessage = (msg, isSuccess) => {
        $('#form_message')
            .attr('class', isSuccess ? 'success-msg' : 'errorfield')
            .html(isSuccess ? `<ul class="checked" style="display: inline-block;"><li>${msg}</li></ul>` : msg)
            .css('display', 'block')
            .delay(5000)
            .fadeOut(1000);
    };

    const unload = () => {
        $(form_selector).off('submit');
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = FinancialAssessment;
