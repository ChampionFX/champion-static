const ChampionSocket = require('../../common/socket');
const url_for        = require('../../common/url').url_for;

const CashierDeposit = (function() {
    'use strict';

    let depositContainer,
        errorMessage;

    const hidden_class = 'hidden';

    const load = () => {
        depositContainer = $('#cashier_deposit');
        errorMessage = depositContainer.find('#error_msg');

        ChampionSocket.wait('authorize').then((response) => {
            if (response.error) {
                console.log(response.error);
                return;
            }
            deposit();
        });
    };

    const deposit = () => {
        const data = {
            cashier: 'deposit',
        };
        ChampionSocket.send(data).then((response) => {
            if (response.error) {
                errorMessage.removeClass(hidden_class);
                switch (response.error.code) {
                    case 'ASK_TNC_APPROVAL':
                        window.location.href = url_for('user/tnc_approval');
                        break;
                    case 'ASK_FIX_DETAILS':
                        errorMessage.html(response.error.details);
                        break;
                    case 'ASK_UK_FUNDS_PROTECTION':
                        $('#ukgc_funds_protection').removeClass(hidden_class);
                        break;
                    case 'ASK_AUTHENTICATE':
                        errorMessage.html('Your account is not fully authenticated.');
                        break;
                    case 'ASK_FINANCIAL_RISK_APPROVAL':
                        errorMessage.html('Financial Risk approval is required. Please contact <a href="[_1]">customer support</a> for more information.', [url_for('/contact')]);
                        break;
                    case 'ASK_AGE_VERIFICATION':
                        errorMessage.html('Your account needs age verification. Please contact <a href="[_1]">customer support</a> for more information.', [url_for('/contact')]);
                        break;
                    case 'ASK_CURRENCY': // set account currency to USD if not set
                        ChampionSocket.send({ set_account_currency: 'USD' });
                        break;
                    default:
                        errorMessage.html(response.error.message);
                }
            } else {
                errorMessage.addClass(hidden_class);
                $('#ukgc_funds_protection').addClass(hidden_class);
                switch (response.msg_type) {
                    case 'cashier_password':
                        if (response.cashier_password) {
                            errorMessage.removeClass(hidden_class)
                                .html('Your cashier is locked as per your request - to unlock it, please click <a class="pjaxload" href="[_1]">here</a>.', [url_for('/user/security/cashier_passwordws')]);
                        }
                        break;
                    case 'cashier':
                        $('#deposit_iframe_container')
                            .removeClass(hidden_class)
                            .find('iframe').attr('src', response.cashier)
                            .end();
                        break;
                    case 'set_account_currency':
                    case 'tnc_approval':
                        // CashierDeposit.getCashierURL();
                        break;
                    default:
                        break;
                }
            }
        });
    };

    return {
        load   : load,
        deposit: deposit,
    };
})();

module.exports = CashierDeposit;
