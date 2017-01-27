const ChampionSocket = require('../../../common/socket');
const Client         = require('../../../common/client');
const formatMoney    = require('../../../common/currency').formatMoney;
const url_for        = require('../../../common/url').url_for;
const isEmptyObject  = require('../../../common/utility').isEmptyObject;

const MetaTraderConfig = (function() {
    'use strict';

    const types_info = {
        demo             : { account_type: 'demo',      sub_account_type: '',         title: 'Demo',          max_leverage: 1000, is_demo: true },
        champion_cent    : { account_type: 'financial', sub_account_type: 'cent',     title: 'Real Cent',     max_leverage: 1000 },
        champion_standard: { account_type: 'financial', sub_account_type: 'standard', title: 'Real Standard', max_leverage: 300 },
        champion_stp     : { account_type: 'financial', sub_account_type: 'stp',      title: 'Real STP',      max_leverage: 100 },
    };

    const needsRealMessage = () => (
         Client.has_real() ?
            'To perform this action, please switch to your [_1] Real Account.'
                .replace('[_1]', 'Champion-FX.com') :
            'To perform this action, please <a href="[_1]"> upgrade to [_2] Real Account</a>.'
                .replace('[_1]', url_for('new-account/real'))
                .replace('[_2]', 'Champion-FX.com')
    );

    const actions_info = {
        new_account: {
            title      : 'Create Account',
            success_msg: response => 'Congratulations! Your [_1] Account has been created.'.replace('[_1]',
                types_info[response.mt5_new_account.account_type === 'financial' ? `champion_${response.mt5_new_account.sub_account_type}` : response.mt5_new_account.account_type].title),
            login        : response => response.mt5_new_account.login,
            prerequisites: acc_type => (
                new Promise((resolve) => {
                    if (types_info[acc_type].is_demo) {
                        resolve();
                    } else if (Client.is_virtual()) {
                        resolve(needsRealMessage());
                    } else {
                        ChampionSocket.send({ get_account_status: 1 }).then((response_status) => {
                            if ($.inArray('authenticated', response_status.get_account_status.status) === -1) {
                                resolve($('#msg_authenticate').html());
                            } else {
                                ChampionSocket.send({ get_financial_assessment: 1 }).then((response_financial) => {
                                    if (isEmptyObject(response_financial.get_financial_assessment)) {
                                        resolve('To create a Financial Account for MT5, please complete the <a href="[_1]">Financial Assessment</a>.'
                                            .replace('[_1]', url_for('user/assessment')));
                                    } else {
                                        resolve();
                                    }
                                });
                            }
                        });
                    }
                })
            ),
            formValues: ($form, acc_type, action) => {
                // Account type, Sub account type
                $form.find(fields[action].lbl_account_type.id).text(types_info[acc_type].title);
                // Email
                $form.find(fields[action].lbl_email.id).text(fields[action].additional_fields(acc_type).email);
                // Max leverage
                $form.find(`${fields[action].ddl_leverage.id} option`).each(function() {
                    if (+$(this).val() > types_info[acc_type].max_leverage) {
                        $(this).remove();
                    }
                });
            },
        },
        password_change: {
            title        : 'Change Password',
            success_msg  : response => 'The main password of account number [_1] has been changed.'.replace('[_1]', response.echo_req.login),
            prerequisites: () => new Promise(resolve => resolve('')),
            formValues   : ($form, acc_type, action) => {
                // Login ID
                $form.find(fields[action].lbl_login.id).text(fields[action].additional_fields(acc_type).login);
            },
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
            formValues: ($form, acc_type, action) => {
                // From, To
                $form.find(fields[action].lbl_from.id).text(fields[action].additional_fields(acc_type).from_binary);
                $form.find(fields[action].lbl_to.id).text(fields[action].additional_fields(acc_type).to_mt5);
            },
        },
        withdrawal: {
            title      : 'Withdraw',
            success_msg: response => '[_1] withdrawal from account number [_2] to [_3] is done. Transaction ID: [_4]'
                .replace('[_1]', formatMoney(response.echo_req.amount))
                .replace('[_2]', response.echo_req.from_mt5)
                .replace('[_3]', response.echo_req.to_binary)
                .replace('[_4]', response.binary_transaction_id),
            prerequisites: () => new Promise(resolve => resolve(Client.is_virtual() ? needsRealMessage() : '')),
            pre_submit   : ($form, acc_type, displayFormMessage) => (
                ChampionSocket.send({
                    mt5_password_check: 1,
                    login             : types_info[acc_type].account_info.login,
                    password          : $form.find(fields.withdrawal.txt_main_pass.id).val(),
                }).then((response) => {
                    if (+response.mt5_password_check === 1) {
                        return true;
                    } else if (response.error) {
                        displayFormMessage(response.error.message);
                    }
                    return false;
                })
            ),
            formValues: ($form, acc_type, action) => {
                // From, To
                $form.find(fields[action].lbl_from.id).text(fields[action].additional_fields(acc_type).from_mt5);
                $form.find(fields[action].lbl_to.id).text(fields[action].additional_fields(acc_type).to_binary);
            },
        },
    };

    const fields = {
        new_account: {
            lbl_account_type    : { id: '#lbl_account_type' },
            lbl_sub_account_type: { id: '#lbl_sub_account_type' },
            lbl_email           : { id: '#lbl_email' },
            txt_name            : { id: '#txt_name',          request_field: 'name' },
            ddl_leverage        : { id: '#ddl_leverage',      request_field: 'leverage' },
            txt_main_pass       : { id: '#txt_main_pass',     request_field: 'mainPassword' },
            txt_re_main_pass    : { id: '#txt_re_main_pass' },
            txt_investor_pass   : { id: '#txt_investor_pass', request_field: 'investPassword' },
            chk_tnc             : { id: '#chk_tnc' },
            additional_fields   :
                acc_type => ($.extend(
                    {
                        account_type: types_info[acc_type].account_type,
                        email       : Client.get('email'),
                    },
                    types_info[acc_type].sub_account_type ? {
                        sub_account_type: types_info[acc_type].sub_account_type,
                    } : {})),
        },
        password_change: {
            lbl_login          : { id: '#lbl_login' },
            txt_old_password   : { id: '#txt_old_password', request_field: 'old_password' },
            txt_new_password   : { id: '#txt_new_password', request_field: 'new_password' },
            txt_re_new_password: { id: '#txt_re_new_password' },
            additional_fields  :
                acc_type => ({
                    login: types_info[acc_type].account_info.login,
                }),
        },
        deposit: {
            lbl_from         : { id: '#lbl_from' },
            lbl_to           : { id: '#lbl_to' },
            txt_amount       : { id: '#txt_amount', request_field: 'amount' },
            additional_fields:
                acc_type => ({
                    from_binary: Client.get('loginid'),
                    to_mt5     : types_info[acc_type].account_info.login,
                }),
        },
        withdrawal: {
            lbl_from         : { id: '#lbl_from' },
            lbl_to           : { id: '#lbl_to' },
            txt_amount       : { id: '#txt_amount', request_field: 'amount' },
            txt_main_pass    : { id: '#txt_main_pass' },
            additional_fields:
                acc_type => ({
                    from_mt5 : types_info[acc_type].account_info.login,
                    to_binary: Client.get('loginid'),
                }),
        },
    };

    const validations = {
        new_account: [
            { selector: fields.new_account.txt_name.id,          validations: ['req', 'letter_symbol', ['length', { min: 2, max: 30 }]] },
            { selector: fields.new_account.txt_main_pass.id,     validations: ['req', 'password'] },
            { selector: fields.new_account.txt_re_main_pass.id,  validations: ['req', ['compare', { to: fields.new_account.txt_main_pass.id }]] },
            { selector: fields.new_account.txt_investor_pass.id, validations: ['req', 'password', ['not_equal', { to: fields.new_account.txt_main_pass.id, name1: 'Main password', name2: 'Investor password' }]] },
            { selector: fields.new_account.ddl_leverage.id,      validations: ['req'] },
            { selector: fields.new_account.chk_tnc.id,           validations: ['req'] },
        ],
        password_change: [
            { selector: fields.password_change.txt_old_password.id,    validations: ['req'] },
            { selector: fields.password_change.txt_new_password.id,    validations: ['req', 'password', ['not_equal', { to: fields.password_change.txt_old_password.id, name1: 'Current password', name2: 'New password' }]] },
            { selector: fields.password_change.txt_re_new_password.id, validations: ['req', ['compare', { to: fields.password_change.txt_new_password.id }]] },
        ],
        deposit: [
            { selector: fields.deposit.txt_amount.id, validations: ['req', ['number', { type: 'float', min: 1, max: 20000 }]] },
        ],
        withdrawal: [
            { selector: fields.withdrawal.txt_main_pass.id, validations: ['req'] },
            { selector: fields.withdrawal.txt_amount.id,    validations: ['req', ['number', { type: 'float', min: 1, max: 20000 }]] },
        ],
    };

    return {
        types_info  : types_info,
        actions_info: actions_info,
        fields      : fields,
        validations : validations,
    };
})();

module.exports = MetaTraderConfig;
