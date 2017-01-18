const ChampionSocket       = require('../../../common/socket');
const Client               = require('../../../common/client');
const Validation           = require('../../../common/validation');
const default_redirect_url = require('../../../common/url').default_redirect_url;
const MetaTraderConfig     = require('./metatrader.config');
const MetaTraderUI         = require('./metatrader.ui');

const MetaTrader = (function() {
    'use strict';

    const hidden_class  = 'hidden';

    // const types_info   = MetaTraderConfig.types_info;
    const actions_info = MetaTraderConfig.actions_info;
    const fields       = MetaTraderConfig.fields;
    // const validations  = MetaTraderConfig.validations;

    const load = () => {
        if (!Client.is_logged_in() || Client.has_real()) {
            window.location.href = default_redirect_url();
            return;
        }

        MetaTraderUI.init(submit);
    };

    const makeRequestObject = (acc_type, action) => {
        const req = {};

        Object.keys(fields[action]).forEach((field) => {
            if (field.request_field) {
                req[field.request_field] = MetaTraderUI.$form().find(field.id).val();
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
        if (Validation.validate(`#frm_${action}`)) {
            const req = makeRequestObject(acc_type, action);
            ChampionSocket.send(req, (response) => {
                if (response.error) {
                    $btn_submit.siblings('.error-msg').html(response.error.message).removeClass(hidden_class);
                } else {
                    MetaTraderUI.$form().html($('<p/>', { text: actions_info[acc_type].success_msg }));
                }
            });
        }
    };

    return {
        load: load,
    };
})();

module.exports = MetaTrader;
