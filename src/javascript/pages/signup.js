const ChampionSocket = require('../common/socket');
const ChampionRouter = require('../common/router');
const url_for        = require('../common/url').url_for;
const Validation     = require('../common/validation');

const ChampionSignup = (function() {
    'use strict';

    const form_selector = '.frm-verify-email';
    let is_active = false,
        $form,
        $input,
        $button;

    const load = () => {
        $form   = $(`${form_selector}:visible`);
        $input  = $form.find('input');
        $button = $form.find('button');
        $button.off('click', submit).on('click', submit);
        is_active = true;
        Validation.init(form_selector, [
            { selector: '#email', validations: ['req', 'email'], msg_element: '#signup_error' },
        ]);
    };

    const unload = () => {
        if (is_active) {
            $form.addClass('hidden');
            $button.off('click', submit);
            $input.val('');
        }
        is_active = false;
    };

    const submit = (e) => {
        e.preventDefault();
        if (is_active && Validation.validate(form_selector)) {
            ChampionSocket.send({
                verify_email: $input.val(),
                type        : 'account_opening',
            }, function(response) {
                if (response.verify_email) {
                    ChampionRouter.forward(url_for('new-account/virtual'));
                } else if (response.error) {
                    $(`${form_selector}:visible #signup_error`).text(response.error.message).removeClass('hidden');
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
