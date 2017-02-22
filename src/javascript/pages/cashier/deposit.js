const ChampionSocket = require('../../common/socket');
const url_for        = require('../../common/url').url_for;

const CashierDeposit = (function() {
    'use strict';

    let depositContainer,
        errorMessage;

    const load = () => {
        depositContainer = $('#cashier_deposit');
        errorMessage = depositContainer.find('#error_msg');
        ChampionSocket.send({ cashier_password: '1' }).then((response) => {
            if (response.error) {
                errorMessage.removeClass('hidden').html(response.error.message);
            } else if (response.cashier_password) {
                errorMessage.removeClass('hidden')
                    .html('Your cashier is locked as per your request - to unlock it, please click <a href="[_1]">here</a>.'
                        .replace('[_1]', url_for('/cashier/cashier-password')));
            } else {
                deposit();
            }
        });
    };

    const deposit = () => {
        ChampionSocket.send({ cashier: 'deposit' }).then((response) => {
            if (response.error) {
                errorMessage.removeClass('hidden');
                switch (response.error.code) {
                    case 'ASK_TNC_APPROVAL':
                        window.location.href = url_for('user/tnc_approval');
                        break;
                    case 'ASK_FIX_DETAILS':
                        errorMessage.html(response.error.details);
                        break;
                    case 'ASK_UK_FUNDS_PROTECTION':
                        $('#ukgc_funds_protection').removeClass('hidden');
                        break;
                    case 'ASK_AUTHENTICATE':
                        errorMessage.html('Your account is not fully authenticated.');
                        break;
                    case 'ASK_FINANCIAL_RISK_APPROVAL':
                        errorMessage
                            .html('Financial Risk approval is required. Please contact <a href="[_1]">customer support</a> for more information.'
                                .replace('[_1]', url_for('/contact')));
                        break;
                    case 'ASK_AGE_VERIFICATION':
                        errorMessage
                            .html('Your account needs age verification. Please contact <a href="[_1]">customer support</a> for more information.'
                                .replace('[_1]', url_for('/contact')));
                        break;
                    case 'ASK_CURRENCY': // set account currency to USD if not set // TODO: remove this after currency set by default in backend
                        ChampionSocket.send({ set_account_currency: 'USD' }).then((res) => {
                            if (res.error) errorMessage.html(res.error.message);
                            deposit();
                        });
                        break;
                    default:
                        errorMessage.html(response.error.message);
                }
            } else {
                $('#error_msg, #ukgc_funds_protection').addClass('hidden');
                $('#deposit_iframe_container').removeClass('hidden')
                    .find('iframe')
                    .attr('src', response.cashier)
                    .end();
            }
        });
    };

    return {
        load   : load,
        deposit: deposit,
    };
})();

module.exports = CashierDeposit;
