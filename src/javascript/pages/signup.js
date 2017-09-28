const ChampionSocket = require('../common/socket');
const Validation     = require('../common/validation');

const ChampionSignup = (function() {
    'use strict';

    const form_selector = '.frm-verify-email';
    const hidden_class  = 'invisible';

    let is_active = false,
        $form,
        $input,
        $button,
        $after_signup_msg,
        $before_signup_el,
        $modal;

    const load = () => {
        $after_signup_msg = $('.modal__form_message');
        $before_signup_el = $('.modal__form_wrapper, .modal__body, .modal__footer');
        $modal            = $('.modal');

        $('.toggle-signup-modal').off('click').on('click', showModal);
        $('.modal__header .close').off('click').on('click', hideModal);

        eventHandler();
    };

    const showModal = (e) => {
        if (e) e.stopPropagation();
        $modal.toggleClass('modal--show');
        if ($('.modal--show').length) {
            $('body').css('position', 'static').append('<div class="modal-overlay"></div>');
            $('.modal-overlay').off('click', hideModal).on('click', hideModal);
            resetForm();

            // if sign-up success message is already visible, show sign-up form
            if (!$after_signup_msg.hasClass(hidden_class)) {
                changeVisibility($after_signup_msg, 'hide');
                changeVisibility($before_signup_el, 'show');
            }
        }
    };

    const hideModal = (e) => {
        e.stopPropagation();
        $modal.removeClass('modal--show');
        $('.modal-overlay').remove();
    };

    const resetForm = () => {
        $input.val('').removeClass('field-error');
        $(`${form_selector}:visible #signup_error`).addClass(hidden_class);
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

        $('toggle-modal').off('click');
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
                    changeVisibility($after_signup_msg, 'show');
                    changeVisibility($before_signup_el, 'hide');
                } else if (response.error) {
                    $(`${form_selector}:visible #signup_error`).text(response.error.message).removeClass(hidden_class);
                }
            });
        }
    };

    return {
        load     : load,
        unload   : unload,
        showModal: showModal,
    };
})();

module.exports = ChampionSignup;
