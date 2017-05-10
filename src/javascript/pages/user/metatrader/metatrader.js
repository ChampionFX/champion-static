const MetaTraderConfig = require('./metatrader.config');
const MetaTraderUI     = require('./metatrader.ui');
const Client           = require('../../../common/client');
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

        Client.set('mt5_account', getDefaultAccount(response.mt5_login_list));

        // Update types with no account
        Object.keys(types_info).forEach((acc_type) => {
            if (!types_info[acc_type].account_info) {
                MetaTraderUI.updateAccount(acc_type);
            }
        });
    };

    const getDefaultAccount = login_list => (
        // remove hash from url
        // const url = window.location.href.split('#')[0];
        // window.history.replaceState({ url: url }, null, url);
        Object.keys(types_info).indexOf(location.hash.substring(1)) >= 0 ? location.hash.substring(1) :
        Client.get('mt5_account') ||
        (login_list && login_list.length ?
            Client.getMT5AccountType(
                (login_list.find(login => /real/.test(login.group)) || login_list.find(login => /demo/.test(login.group))).group) :
            'demo_champion_cent')
    );

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
        MetaTraderUI.hideFormMessage();
        const $btn_submit = $(e.target);
        const acc_type = $btn_submit.attr('acc_type');
        const action = $btn_submit.attr('action');
        if (Validation.validate(`#frm_${action}`)) {
            MetaTraderUI.disableButton();
            // further validations before submit (password_check)
            MetaTraderUI.postValidate(acc_type, action).then((is_ok) => {
                if (!is_ok) {
                    MetaTraderUI.enableButton();
                    return;
                }

                const req = makeRequestObject(acc_type, action);
                ChampionSocket.send(req).then((response) => {
                    if (response.error) {
                        MetaTraderUI.displayFormMessage(response.error.message);
                    } else {
                        MetaTraderUI.loadAction(action);
                        MetaTraderUI.displayMainMessage(actions_info[action].success_msg(response));
                        getAccountDetails(actions_info[action].login ?
                            actions_info[action].login(response) : types_info[acc_type].account_info.login, acc_type);
                        if (typeof actions_info[action].onSuccess === 'function') {
                            actions_info[action].onSuccess(response, acc_type);
                        }
                    }
                    MetaTraderUI.enableButton();
                });
            });
        }
    };

    return {
        load: load,
    };
})();

module.exports = MetaTrader;
