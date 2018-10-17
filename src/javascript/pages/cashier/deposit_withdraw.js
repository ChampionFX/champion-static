const ChampionSocket = require('../../common/socket');
const url_for        = require('../../common/url').url_for;
const Client         = require('../../common/client');
const Currency       = require('../../common/currency');
const get_params     = require('../../common/url').get_params;
const Validation     = require('../../common/validation');

const CashierDepositWithdraw = (function() {
    'use strict';

    const hidden_class  = 'invisible';
    const default_iframe_height = 700;

    let $error_msg,
        cashier_type,
        $iframe;

    const container = '#cashier_deposit';

    const fields = {
        cashier_title: '#cashier_title',
        error_msg    : '#error_msg',
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
        $container.find(fields.cashier_title).html(cashier_type);
        $error_msg       = $container.find(fields.error_msg);

        ChampionSocket.send({ cashier_password: '1' }).then((response) => {
            if (response.error) {
                $error_msg.removeClass(hidden_class).html(response.error.message);
            } else if (response.cashier_password) {
                $error_msg.removeClass(hidden_class)
                    .html('Your cashier is locked as per your request - to unlock it, please click <a href="[_1]">here</a>.'
                        .replace('[_1]', url_for('/cashier/cashier-password')));
            } else {
                checkToken();
            }
        });
    };

    const setFrameHeight = (e) => {
        if (!/www\.champion-fx\.com/i.test(e.origin)) {
            $iframe.height(+e.data || default_iframe_height);
        }
    };

    const checkToken = () => {
        if (cashier_type === 'withdraw') {
            const token = get_params().token || '';
            if (!token) {
                ChampionSocket.send({
                    verify_email: Client.get('email'),
                    type        : 'payment_withdraw',
                });
                $error_msg.html('Please check your email to complete the process.').removeClass(hidden_class);
            } else if (!Validation.validEmailToken(token)) {
                $error_msg.html('Verification code is wrong. Please use the link sent to your email.').removeClass(hidden_class);
            } else {
                deposit_withdraw(token);
            }
        } else {
            deposit_withdraw();
        }
    };

    const deposit_withdraw = (token) => {
        const req = { cashier: cashier_type, provider: 'doughflow' };
        if (token) req.verification_code = token;

        ChampionSocket.send(req).then((response) => {
            if (response.error) {
                $error_msg.removeClass(hidden_class);
                switch (response.error.code) {
                    case 'ASK_EMAIL_VERIFY':
                        checkToken();
                        break;
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
                                deposit_withdraw(token);
                                Client.setCurrency(res.echo_req.set_account_currency);
                            }
                        });
                        break;
                    default:
                        $error_msg.html(response.error.message);
                }
            } else {
                $error_msg.addClass(hidden_class);

                $iframe = $(container).find('#cashier_iframe');

                if (Currency.isCryptocurrency(Client.get('currency'))) {
                    $iframe.height(default_iframe_height);
                } else {
                    // Automatically adjust iframe height based on contents
                    window.addEventListener('message', setFrameHeight, false);
                }

                $iframe.attr('src', response.cashier).parent().setVisibility(1);

                setTimeout(() => { // wait for iframe contents to load before removing loading bar
                    $(`#${cashier_type}_iframe_container`).removeClass(hidden_class)
                        .find('iframe')
                        .attr('src', response.cashier)
                        .end();
                }, 1000);
            }
        });
    };

    const unload = () => {
        window.removeEventListener('message', setFrameHeight);
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = CashierDepositWithdraw;
