const Client = require('../../../common/client');

const MetaTraderConfig = (function() {
    'use strict';

    const types_info = {
        demo  : { account_type: 'demo',      title: 'Demo',          max_leverage: 1000, is_demo: true },
        real_1: { account_type: 'financial', title: 'Real Cent',     max_leverage: 1000 },
        real_2: { account_type: 'financial', title: 'Real Standard', max_leverage: 300 },
        real_3: { account_type: 'financial', title: 'Real STP',      max_leverage: 100 },
    };

    const actions_info = {
        new_account: {
            title      : 'Create Account',
            success_msg: 'Congratulations! Your [_1] Account has been created.',
            formValues : ($form, acc_type, action) => {
                // Account type
                $form.find(fields[action].lbl_account_type.id).text(types_info[acc_type].title);
                // Max leverage
                $form.find(`${fields[action].ddl_leverage.id} option`).each(function() {
                    if (+$(this).val() > types_info[acc_type].max_leverage) {
                        $(this).remove();
                    }
                });
            },
        },
        password_change: {
            title      : 'Change Password',
            success_msg: 'Your main password has been changed.',
            formValues : ($form, acc_type, action) => {
                // Login ID
                $form.find(fields[action].lbl_login.id).text(fields[action].additional_fields(acc_type).login);
            },
        },
        deposit: {
            title      : 'Deposit',
            success_msg: 'Deposit is done. Transaction ID: [_1]',
            formValues : ($form, acc_type, action) => {
                // From, To
                $form.find(fields[action].lbl_from.id).text(fields[action].additional_fields(acc_type).from_binary);
                $form.find(fields[action].lbl_to.id).text(fields[action].additional_fields(acc_type).to_mt5);
            },
        },
        withdrawal: {
            title      : 'Withdraw',
            success_msg: 'Withdrawal is done. Transaction ID: [_1]',
            formValues : ($form, acc_type, action) => {
                // From, To
                $form.find(fields[action].lbl_from.id).text(fields[action].additional_fields(acc_type).from_mt5);
                $form.find(fields[action].lbl_to.id).text(fields[action].additional_fields(acc_type).to_binary);
            },
        },
    };

    const fields = {
        new_account: {
            lbl_account_type : { id: '#lbl_account_type' },
            txt_name         : { id: '#txt_name',          request_field: 'name' },
            ddl_leverage     : { id: '#ddl_leverage',      request_field: 'leverage' },
            txt_main_pass    : { id: '#txt_main_pass',     request_field: 'mainPassword' },
            txt_re_main_pass : { id: '#txt_re_main_pass' },
            txt_investor_pass: { id: '#txt_investor_pass', request_field: 'investPassword' },
            chk_tnc          : { id: '#chk_tnc' },
            additional_fields:
                acc_type => ({
                    account_type: types_info[acc_type].account_type,
                    email       : Client.get_value('email'),
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
            { selector: fields.new_account.txt_name.id,          validations: ['req', 'general'] },
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
