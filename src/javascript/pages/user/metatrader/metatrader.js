const MetaTraderConfig = require('./metatrader.config');
const MetaTraderUI     = require('./metatrader.ui');
const Client           = require('../../../common/client');
const switchLoginId    = require('../../../common/header').switchLoginId;
const ChampionSocket   = require('../../../common/socket');
const State            = require('../../../common/storage').State;
const Validation       = require('../../../common/validation');

const MetaTrader = (function() {
    'use strict';

    const types_info   = MetaTraderConfig.types_info;
    const actions_info = MetaTraderConfig.actions_info;
    const fields       = MetaTraderConfig.fields;

    const load = () => {
        State.set('is_mt_pages', 1);

        if (Client.is_virtual() && Client.has_real()) {
            const real_login_id = Client.get('loginid_array').find(login => !login.disabled && login.real).id;
            switchLoginId(real_login_id);
            return;
        }

        ChampionSocket.wait('mt5_login_list').then((response) => {
            responseLoginList(response);
        });
        MetaTraderUI.init(submit);
    };

    const responseLoginList = (response) => {
        (response.mt5_login_list || []).forEach((obj) => {
            const acc_type = Client.getMT5AccountType(obj.group);
            if (acc_type) { // ignore old accounts which are not linked to any group
                types_info[acc_type].account_info = { login: obj.login };
                getAccountDetails(obj.login, acc_type);
            }
        });

        Client.set('mt5_account', getDefaultAccount());

        // Update types with no account
        Object.keys(types_info)
            .filter(acc_type => !hasAccount(acc_type))
            .forEach((acc_type) => { MetaTraderUI.updateAccount(acc_type); });
    };

    const getDefaultAccount = () => {
        let default_account = '';
        if (hasAccount(location.hash.substring(1))) {
            default_account = location.hash.substring(1);
            MetaTraderUI.removeUrlHash();
        } else if (hasAccount(Client.get('mt5_account'))) {
            default_account = Client.get('mt5_account');
        } else {
            default_account = Object.keys(types_info)
                .filter(acc_type => hasAccount(acc_type))
                .sort(acc_type => (types_info[acc_type].is_demo ? 1 : -1))[0] || ''; // real first
        }
        return default_account;
    };

    const hasAccount = acc_type => (types_info[acc_type] || {}).account_info;

    const getAccountDetails = (login, acc_type) => {
        ChampionSocket.send({
            mt5_get_settings: 1,
            login           : login,
        }).then((response) => {
            if (response.mt5_get_settings) {
                types_info[acc_type].account_info = response.mt5_get_settings;
                MetaTraderUI.updateAccount(acc_type);
            }
        });
    };

    const makeRequestObject = (acc_type, action) => {
        const req = {};

        Object.keys(fields[action]).forEach((field) => {
            const field_obj = fields[action][field];
            if (field_obj.request_field) {
                req[field_obj.request_field] = MetaTraderUI.$form().find(field_obj.id).val();
            }
        });

        // set main command
        req[`mt5_${action}`] = 1;

        // add additional fields
        $.extend(req, fields[action].additional_fields(acc_type));

        return req;
    };

    const submit = (e) => {
        e.preventDefault();
        const $btn_submit = $(e.target);
        const acc_type = $btn_submit.attr('acc_type');
        const action = $btn_submit.attr('action');
        MetaTraderUI.hideFormMessage(action);
        if (Validation.validate(`#frm_${action}`)) {
            MetaTraderUI.disableButton(action);
            // further validations before submit (password_check)
            MetaTraderUI.postValidate(acc_type, action).then((is_ok) => {
                if (!is_ok) {
                    MetaTraderUI.enableButton(action);
                    return;
                }

                const req = makeRequestObject(acc_type, action);
                ChampionSocket.send(req).then((response) => {
                    if (response.error) {
                        MetaTraderUI.displayFormMessage(response.error.message, action);
                    } else {
                        const login = actions_info[action].login ?
                            actions_info[action].login(response) : types_info[acc_type].account_info.login;
                        if (!types_info[acc_type].account_info) {
                            types_info[acc_type].account_info = { login: login };
                            MetaTraderUI.setAccountType(acc_type, true);
                        }
                        MetaTraderUI.loadAction(null, acc_type);
                        getAccountDetails(login, acc_type);
                        if (typeof actions_info[action].success_msg === 'function') {
                            MetaTraderUI.displayMainMessage(actions_info[action].success_msg(response));
                        }
                        if (typeof actions_info[action].onSuccess === 'function') {
                            actions_info[action].onSuccess(response, acc_type);
                        }
                    }
                    MetaTraderUI.enableButton(action);
                });
            });
        }
    };

    return {
        load: load,
    };
})();

module.exports = MetaTrader;
