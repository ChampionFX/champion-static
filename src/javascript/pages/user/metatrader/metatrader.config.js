const ChampionSocket = require('../../../common/socket');
const Client         = require('../../../common/client');
const url_for        = require('../../../common/url').url_for;
const isEmptyObject  = require('../../../common/utility').isEmptyObject;

const MetaTraderConfig = (function() {
    'use strict';

    const types_info = {
        demo             : { account_type: 'demo',      sub_account_type: '',         title: 'Demo',          max_leverage: 1000, is_demo: true },
        champion_cent    : { account_type: 'financial', sub_account_type: 'cent',     title: 'Real Cent',     max_leverage: 1000 }, // TODO: remove account_info
        champion_standard: { account_type: 'financial', sub_account_type: 'standard', title: 'Real Standard', max_leverage: 300 },
        champion_stp     : { account_type: 'financial', sub_account_type: 'stp',      title: 'Real STP',      max_leverage: 100 },
    };

    const actions_info = {
        new_account: {
            title        : 'Create Account',
            success_msg  : response => 'Congratulations! Your [_1] Account has been created.'.replace('[_1]', response.mt5_new_account.login),
            prerequisites: acc_type => (
                new Promise((resolve) => {
                    if (types_info[acc_type].is_demo) {
                        resolve();
                    } else if (Client.is_virtual()) {
                        resolve(Client.has_real() ?
                            'To create a [_1] Account for MT5, please switch to your [_2] Real Account.'
                                .replace('[_1]', types_info[acc_type].title)
                                .replace('[_2]', 'Champion-FX.com') :
                            'To create a [_1] Account for MT5, please <a href="[_2]"> upgrade to [_3] Real Account</a>.'
                                .replace('[_1]', types_info[acc_type].title)
                                .replace('[_2]', url_for('new-account/real'))
                                .replace('[_3]', 'Champion-FX.com'));
                    } else {
                        ChampionSocket.send({ get_account_status: 1 }, (response_status) => {
                            if ($.inArray('authenticated', response_status.get_account_status.status) === -1) {
                                resolve($('#msg_authenticate').html());
                            } else {
                                ChampionSocket.send({ get_financial_assessment: 1 }, (response_financial) => {
                                    if (isEmptyObject(response_financial.get_financial_assessment)) {
                                        resolve('To create a Financial Account for MT5, please complete the <a href="[_1]">Financial Assessment</a>.'
                                            .replace('[_1]', url_for('user/financial')));
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
                if (types_info[acc_type].sub_account_type) {
                    $form.find(fields[action].lbl_sub_account_type.id).text(`: ${types_info[acc_type].sub_account_type}`);
                }
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
            success_msg  : () => 'Your main password has been changed.',
            prerequisites: () => new Promise(resolve => resolve('')),
            formValues   : ($form, acc_type, action) => {
                // Login ID
                $form.find(fields[action].lbl_login.id).text(fields[action].additional_fields(acc_type).login);
            },
        },
        deposit: {
            title        : 'Deposit',
            success_msg  : response => 'Deposit is done. Transaction ID: [_1]'.replace('[_1]', response.binary_transaction_id),
            prerequisites: () => new Promise(resolve => resolve('')),
            formValues   : ($form, acc_type, action) => {
                // From, To
                $form.find(fields[action].lbl_from.id).text(fields[action].additional_fields(acc_type).from_binary);
                $form.find(fields[action].lbl_to.id).text(fields[action].additional_fields(acc_type).to_mt5);
            },
        },
        withdrawal: {
            title        : 'Withdraw',
            success_msg  : response => 'Withdrawal is done. Transaction ID: [_1]'.replace('[_1]', response.binary_transaction_id),
            prerequisites: () => new Promise(resolve => resolve('')),
            formValues   : ($form, acc_type, action) => {
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
                acc_type => ({
                    account_type    : types_info[acc_type].account_type,
                    sub_account_type: types_info[acc_type].sub_account_type,
                    email           : Client.get_value('email'),
                }),
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
                    from_binary: Client.get_value('loginid'),
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
                    to_binary: Client.get_value('loginid'),
                }),
        },
    };

    const validations = {
        new_account: [
            { selector: fields.new_account.txt_name.id,          validations: ['req', 'general', ['length', { min: 2, max: 30 }]] },
            { selector: fields.new_account.txt_main_pass.id,     validations: ['req', 'password'] },
            { selector: fields.new_account.txt_re_main_pass.id,  validations: ['req', ['compare', { to: fields.new_account.txt_main_pass.id }]] },
            { selector: fields.new_account.txt_investor_pass.id, validations: ['req', 'password'] },
            { selector: fields.new_account.ddl_leverage.id,      validations: ['req'] },
            { selector: fields.new_account.chk_tnc.id,           validations: ['req'] },
        ],
        password_change: [
            { selector: fields.password_change.txt_old_password.id,    validations: ['req'] },
            { selector: fields.password_change.txt_new_password.id,    validations: ['req', 'password'] },
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
