const Client           = require('../../../common/client');
const formatMoney      = require('../../../common/currency').formatMoney;
const GTM              = require('../../../common/gtm');
const ChampionSocket   = require('../../../common/socket');
const url_for          = require('../../../common/url').url_for;
const template         = require('../../../common/utility').template;
const showSuccessPopup = require('../../../common/utility').showSuccessPopup;

const MetaTraderConfig = (function() {
    'use strict';

    const mt_companies = {
        financial: {
            standard: { mt5_account_type: 'standard', max_leverage: 500, title: 'Standard' },
            advanced: { mt5_account_type: 'advanced', max_leverage: 100, title: 'Advanced' },
        },
    };

    const accounts_info = {};

    const needsRealMessage = () => $(`#msg_${Client.has_real() ? 'switch' : 'upgrade'}`).html();

    const actions_info = {
        new_account: {
            title        : 'Sign up',
            login        : response => response.mt5_new_account.login,
            prerequisites: is_real => (
                new Promise((resolve) => {
                    if (!is_real) {
                        resolve();
                    } else if (Client.is_virtual()) {
                        $('#msg_real_financial').html(needsRealMessage());
                        resolve(true);
                    } else {
                        ChampionSocket.wait('get_account_status').then((response_get_account_status) => {
                            const $message = $('#msg_real_financial');
                            let is_ok = true;
                            if (/financial_assessment_not_complete/.test(response_get_account_status.get_account_status.status)) {
                                $message.find('.assessment').setVisibility(1).find('a').attr('onclick', `localStorage.setItem('financial_assessment_redirect', '${url_for('user/metatrader')}')`);
                                is_ok = false;
                            }
                            if (response_get_account_status.get_account_status.prompt_client_to_authenticate) {
                                $message.find('.authenticate').setVisibility(1);
                                is_ok = false;
                            }
                            resolve(!is_ok);
                        });
                    }
                })
            ),
            onSuccess: (response, acc_type) => {
                showSuccessPopup(template('Congratulations! You’ve successfully created your [_1] account.', [accounts_info[acc_type].title]), 'You can trade Forex, CFDs and Metals with our virtual money, launch our MetaTrader 5 on our sidebar Quick Links or Download it to your machine or mobile applications.');
                ChampionSocket.send({ mt5_login_list: 1 });
                GTM.mt5NewAccount(response);
            },
        },
        password_change: {
            title        : 'Change password',
            success_msg  : response => 'The main password of account number [_1] has been changed.'.replace('[_1]', response.echo_req.login),
            prerequisites: () => new Promise(resolve => resolve('')),
        },
        deposit: {
            title      : 'Deposit',
            success_msg: response => '[_1] deposit from [_2] to account number [_3] is done. Transaction ID: [_4]'
                .replace('[_1]', formatMoney(response.echo_req.amount))
                .replace('[_2]', response.echo_req.from_binary)
                .replace('[_3]', response.echo_req.to_mt5)
                .replace('[_4]', response.binary_transaction_id),
            prerequisites: () => new Promise((resolve) => {
                if (Client.is_virtual()) {
                    resolve(needsRealMessage());
                } else {
                    ChampionSocket.send({ cashier_password: 1 }).then((response) => {
                        if (!response.error && response.cashier_password === 1) {
                            resolve('Your cashier is locked as per your request - to unlock it, please click <a href="[_1]">here</a>.'
                                .replace('[_1]', url_for('cashier/cashier-password')));
                        } else {
                            resolve();
                        }
                    });
                }
            }),
        },
        withdrawal: {
            title      : 'Withdraw',
            success_msg: response => '[_1] withdrawal from account number [_2] to [_3] is done. Transaction ID: [_4]'
                .replace('[_1]', formatMoney(response.echo_req.amount))
                .replace('[_2]', response.echo_req.from_mt5)
                .replace('[_3]', response.echo_req.to_binary)
                .replace('[_4]', response.binary_transaction_id),
            prerequisites: () => new Promise((resolve) => {
                if (Client.is_virtual()) {
                    resolve(needsRealMessage());
                } else {
                    ChampionSocket.send({ get_account_status: 1 }).then((response_status) => {
                        // There are cases that prompt_client_to_authenticate=0
                        // but websocket returns authentication required error when trying to withdraw
                        // so we check for 'authenticated' status as well to display a user friendly message instead
                        resolve(+response_status.get_account_status.prompt_client_to_authenticate || !/authenticated/.test(response_status.get_account_status.status) ?
                        $('#msg_authenticate').html() : '');
                    });
                }
            }),
            pre_submit: ($form, acc_type, displayFormMessage) => (
                ChampionSocket.send({
                    mt5_password_check: 1,
                    login             : accounts_info[acc_type].account_info.login,
                    password          : $form.find(fields.withdrawal.txt_main_pass.id).val(),
                }).then((response) => {
                    if (+response.mt5_password_check === 1) {
                        return true;
                    } else if (response.error) {
                        displayFormMessage(response.error.message, 'withdrawal');
                    }
                    return false;
                })
            ),
        },
    };

    const fields = {
        new_account: {
            txt_name         : { id: '#txt_name',          request_field: 'name' },
            txt_main_pass    : { id: '#txt_main_pass',     request_field: 'mainPassword' },
            txt_re_main_pass : { id: '#txt_re_main_pass' },
            txt_investor_pass: { id: '#txt_investor_pass', request_field: 'investPassword' },
            chk_tnc          : { id: '#chk_tnc' },
            additional_fields:
                acc_type => ($.extend(
                    {
                        account_type: accounts_info[acc_type].account_type,
                        email       : Client.get('email'),
                    },
                    accounts_info[acc_type].mt5_account_type ? {
                        mt5_account_type: accounts_info[acc_type].mt5_account_type,
                        leverage        : accounts_info[acc_type].max_leverage,
                    } : {})),
        },
        password_change: {
            txt_old_password   : { id: '#txt_old_password', request_field: 'old_password' },
            txt_new_password   : { id: '#txt_new_password', request_field: 'new_password' },
            txt_re_new_password: { id: '#txt_re_new_password' },
            additional_fields  :
                acc_type => ({
                    login: accounts_info[acc_type].account_info.login,
                }),
        },
        deposit: {
            txt_amount       : { id: '#txt_amount_deposit', request_field: 'amount' },
            additional_fields:
                acc_type => ({
                    from_binary: Client.get('loginid'),
                    to_mt5     : accounts_info[acc_type].account_info.login,
                }),
        },
        withdrawal: {
            txt_amount       : { id: '#txt_amount_withdrawal', request_field: 'amount' },
            txt_main_pass    : { id: '#txt_main_pass_wd' },
            additional_fields:
                acc_type => ({
                    from_mt5 : accounts_info[acc_type].account_info.login,
                    to_binary: Client.get('loginid'),
                }),
        },
    };

    const validations = {
        new_account: [
            { selector: fields.new_account.txt_name.id,          validations: ['req', 'letter_symbol', ['length', { min: 2, max: 30 }]] },
            { selector: fields.new_account.txt_main_pass.id,     validations: ['req', ['password', 'mt']] },
            { selector: fields.new_account.txt_re_main_pass.id,  validations: ['req', ['compare', { to: fields.new_account.txt_main_pass.id }]] },
            { selector: fields.new_account.txt_investor_pass.id, validations: ['req', ['password', 'mt'], ['not_equal', { to: fields.new_account.txt_main_pass.id, name1: 'Main password', name2: 'Investor password' }]] },
        ],
        password_change: [
            { selector: fields.password_change.txt_old_password.id,    validations: ['req'] },
            { selector: fields.password_change.txt_new_password.id,    validations: ['req', ['password', 'mt'], ['not_equal', { to: fields.password_change.txt_old_password.id, name1: 'Current password', name2: 'New password' }]] },
            { selector: fields.password_change.txt_re_new_password.id, validations: ['req', ['compare', { to: fields.password_change.txt_new_password.id }]] },
        ],
        deposit: [
            { selector: fields.deposit.txt_amount.id, validations: ['req', ['number', { type: 'float', min: 1, max: 20000, decimals: '0, 2' }], ['custom', { func: () => (+Client.get('balance') >= +$(fields.deposit.txt_amount.id).val()), message: template('You have insufficient funds in your Binary account, please <a href="[_1]">add fund</a>.', [url_for('cashier')]) }]] },
        ],
        withdrawal: [
            { selector: fields.withdrawal.txt_main_pass.id, validations: ['req'] },
            { selector: fields.withdrawal.txt_amount.id,    validations: ['req', ['number', { type: 'float', min: 1, max: 20000, decimals: '0, 2' }]] },
        ],
    };

    return {
        mt_companies,
        accounts_info,
        actions_info,
        fields,
        validations,
        needsRealMessage,
        mt5Currency: () => 'USD',
    };
})();

module.exports = MetaTraderConfig;
