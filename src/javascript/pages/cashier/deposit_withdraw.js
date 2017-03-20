const ChampionSocket = require('../../common/socket');
const url_for        = require('../../common/url').url_for;
const Client         = require('../../common/client');
const Validation     = require('./../../common/validation');

const CashierDepositWithdraw = (function() {
    'use strict';

    const hidden_class  = 'invisible';
    const form_selector = '#form_withdraw';

    let $btn_submit,
        $form_withdraw,
        $error_msg,
        cashier_type;

    const fields = {
        cashier_title: '#cashier_title',
        error_msg    : '#error_msg',
        btn_submit   : '#btn_submit',
        token        : '#verification_token',
    };

    const load = () => {
        if (/withdraw/.test(window.location.hash.substring(1))) {
            cashier_type = 'withdraw';
        } else if (/deposit/.test(window.location.hash.substring(1))) {
            cashier_type = 'deposit';
        } else {
            window.location.href = url_for('/cashier');
        }

        const $container = $('#cashier_deposit');
        $form_withdraw   = $('#form_withdraw');
        $error_msg       = $container.find(fields.error_msg);

        $(fields.cashier_title).html(cashier_type);
        if (cashier_type === 'withdraw') initForm();

        ChampionSocket.send({ cashier_password: '1' }).then((response) => {
            if (response.error) {
                $error_msg.removeClass(hidden_class).html(response.error.message);
            } else if (response.cashier_password) {
                $error_msg.removeClass(hidden_class)
                    .html('Your cashier is locked as per your request - to unlock it, please click <a href="[_1]">here</a>.'
                        .replace('[_1]', url_for('/cashier/cashier-password')));
            } else {
                deposit_withdraw();
            }
        });
    };

    const initForm = () => {
        $btn_submit = $form_withdraw.find(fields.btn_submit);
        $btn_submit.on('click', submit);
        $form_withdraw.removeClass(hidden_class);
        Validation.init(form_selector, [
            { selector: fields.token, validations: ['req', 'email_token'] },
        ]);
        ChampionSocket.send({
            verify_email: Client.get('email'),
            type        : 'payment_withdraw',
        });
    };

    const unload = () => {
        if ($btn_submit) {
            $btn_submit.off('click', submit);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (Validation.validate(form_selector)) {
            $form_withdraw.addClass(hidden_class);
            deposit_withdraw($(fields.token).val());
        }
    };

    const deposit_withdraw = (token) => {
        const req = { cashier: cashier_type, provider: 'epg' };
        if (token) req.verification_code = token;

        ChampionSocket.send(req).then((response) => {
            if (response.error) {
                $error_msg.removeClass(hidden_class);
                switch (response.error.code) {
                    case 'ASK_TNC_APPROVAL':
                        $error_msg.html('Please accept the latest Terms and Conditions.');
                        break;
                    case 'ASK_FIX_DETAILS':
                        $error_msg.html(response.error.details);
                        break;
                    case 'ASK_AUTHENTICATE':
                        $error_msg.html('Your account is not fully authenticated.');
                        break;
                    case 'ASK_FINANCIAL_RISK_APPROVAL':
                        $error_msg
                            .html('Financial Risk approval is required. Please contact <a href="[_1]">customer support</a> for more information.'
                                .replace('[_1]', url_for('/contact')));
                        break;
                    case 'ASK_CURRENCY': // set account currency to USD if not set // TODO: remove this after currency set by default in backend
                        ChampionSocket.send({ set_account_currency: 'USD' }).then((res) => {
                            if (res.error) {
                                $error_msg.html(res.error.message);
                            } else {
                                deposit_withdraw();
                            }
                        });
                        break;
                    default:
                        $error_msg.html(response.error.message);
                }
            } else {
                $('#error_msg').addClass(hidden_class);
                $(`#${cashier_type}_iframe_container`).removeClass(hidden_class)
                    .find('iframe')
                    .attr('src', response.cashier)
                    .end();
            }
        });
    };

    return {
        load            : load,
        unload          : unload,
        deposit_withdraw: deposit_withdraw,
    };
})();

module.exports = CashierDepositWithdraw;
