const ChampionSocket = require('../../common/socket');
const Client         = require('../../common/client');
const Utility        = require('../../common/utility');
const Validation     = require('../../common/validation');

const ChampionNewVirtualAccount = (function() {
    'use strict';

    const form_selector = '#frm_new_account_virtual';
    const hidden_class  = 'invisible';

    let container,
        btn_submit;

    const fields = {
        txt_verification_code: '#txt_verification_code',
        txt_password         : '#txt_password',
        txt_re_password      : '#txt_re_password',
        ddl_residence        : '#ddl_residence',
        btn_submit           : '#btn_submit',
    };

    const load = () => {
        if (Client.redirect_if_login()) return;
        container  = $('#champion-container');
        btn_submit = container.find(fields.btn_submit);
        btn_submit.on('click dblclick', submit);

        Validation.init(form_selector, [
            { selector: fields.txt_verification_code, validations: ['req', 'email_token'] },
            { selector: fields.txt_password,          validations: ['req', 'password'] },
            { selector: fields.txt_re_password,       validations: ['req', ['compare', { to: fields.txt_password }]] },
            { selector: fields.ddl_residence,         validations: ['req'] },
        ]);

        populateResidence();
    };

    const populateResidence = () => {
        ChampionSocket.send({ residence_list: 1 }).then((response) => {
            const $ddl_residence = container.find(fields.ddl_residence);
            Utility.dropDownFromObject($ddl_residence, response.residence_list);
            container.find('#residence_loading').remove();
            $ddl_residence.removeClass(hidden_class);
        });
    };

    const unload = () => {
        if (btn_submit) {
            btn_submit.off('click', submit);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (Validation.validate(form_selector)) {
            btn_submit.attr('disabled', 'disabled');
            const data = {
                new_account_virtual: 1,
                verification_code  : $(fields.txt_verification_code).val(),
                client_password    : $(fields.txt_password).val(),
                residence          : $(fields.ddl_residence).val(),
            };
            if (Client.get('affiliate_token')) {
                data.affiliate_token = Client.get('affiliate_token');
            }
            ChampionSocket.send(data).then((response) => {
                if (response.error) {
                    $('#msg_form').removeClass(hidden_class).text(response.error.message);
                    btn_submit.removeAttr('disabled');
                } else {
                    const acc_info = response.new_account_virtual;
                    Client.process_new_account(acc_info.email, acc_info.client_id, acc_info.oauth_token, true);
                }
            });
        }
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = ChampionNewVirtualAccount;
