const ChampionSocket = require('../common/socket');
const Validation     = require('../common/validation');
const Client         = require('../common/client');

const ChampionSignup = (function() {
    'use strict';

    const form_selector   = '.frm-verify-email';
    const signup_selector = '#signup';
    const hidden_class    = 'invisible';

    let is_active = false,
        $form,
        $input,
        $button;

    const load = () => {
        $('.toggle-modal').off('click').on('click', function(e) {
            e.stopPropagation();
            $('.modal').toggleClass('modal--show');
            if ($('.modal--show').length) {
                $('body').css('position', 'static').append('<div class="modal-overlay"></div>');
                $('html').css('overflow-y', 'hidden');
            }
        });
        $('.modal__header .close').off('click').on('click', function(e) {
            e.stopPropagation();
            $('.modal').removeClass('modal--show');
            $('.modal-overlay').remove();
            $('html').css('overflow-y', 'auto');
        });

        if (Client.is_logged_in() || /(new-account|terms-and-conditions|user|cashier)/.test(window.location.pathname)) {
            changeVisibility($(form_selector), 'hide');
        } else {
            changeVisibility($(form_selector), 'show');
            if ($(form_selector).length === 1) {
                changeVisibility($(signup_selector), 'show');
            } else {
                changeVisibility($(signup_selector), 'hide');
            }
            eventHandler();
        }
    };

    const changeVisibility = ($selector, action) => {
        if (action === 'hide') {
            $selector.addClass(hidden_class);
        } else {
            $selector.removeClass(hidden_class);
        }
    };

    const eventHandler = () => {
        $form   = $(`${form_selector}:visible`);
        $input  = $form.find('input');
        $button = $form.find('button');
        $button.off('click', submit).on('click', submit);
        is_active = true;
        Validation.init(form_selector, [
            { selector: '#email', validations: ['req', 'email'], msg_element: '#signup_error', no_scroll: true },
        ]);
    };

    const unload = () => {
        if (is_active) {
            $button.off('click', submit);
            $input.val('');
        }
        is_active = false;
        $('toggle-notification').off('click');
        $('.modal__header .close').off('click');
    };

    const submit = (e) => {
        e.preventDefault();
        if (is_active && Validation.validate(form_selector)) {
            ChampionSocket.send({
                verify_email: $input.val(),
                type        : 'account_opening',
            }).then((response) => {
                if (response.verify_email) {
                    $('.modal__form_message').removeClass('invisible');
                    $('.modal__form_wrapper, .modal__body, .modal__footer').addClass('invisible');
                } else if (response.error) {
                    $(`${form_selector}:visible #signup_error`).text(response.error.message).removeClass(hidden_class);
                }
            });
        }
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = ChampionSignup;
