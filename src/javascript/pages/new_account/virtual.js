const ChampionSocket       = require('../../common/socket');
const Client               = require('../../common/client');
const default_redirect_url = require('../../common/url').default_redirect_url;
const Utility              = require('../../common/utility');
const FormManager          = require('../../common/form_manager');

const ChampionNewVirtualAccount = (function() {
    'use strict';

    const form_selector = '#frm_new_account_virtual';
    const hidden_class  = 'invisible';

    const fields = {
        txt_password   : '#txt_password',
        txt_re_password: '#txt_re_password',
        ddl_residence  : '#ddl_residence',
        btn_submit     : '#btn_submit',
    };

    const load = () => {
        if (Client.redirect_if_login()) return;

        populateResidence();

        const validations = [
            { selector: fields.txt_password,    validations: ['req', 'password'], request_field: 'client_password' },
            { selector: fields.txt_re_password, validations: ['req', ['compare', { to: fields.txt_password }]], exclude_request: 1 },
            { selector: fields.ddl_residence,   validations: ['req'], request_field: 'residence' },

            { request_field: 'new_account_virtual', value: 1 },
        ];
        if (Client.get('affiliate_token')) {
            validations.push({ request_field: 'affiliate_token', value: Client.get('affiliate_token') });
        }
        FormManager.init(form_selector, validations, true);
        FormManager.handleSubmit({
            form_selector       : form_selector,
            fnc_response_handler: virtualResponse,
        });
    };

    const populateResidence = () => {
        ChampionSocket.send({ residence_list: 1 }).then((response) => {
            const $container = $('#champion-container');
            const $ddl_residence = $container.find(fields.ddl_residence);
            Utility.dropDownFromObject($ddl_residence, response.residence_list);
            $container.find('#residence_loading').remove();
            $ddl_residence.removeClass(hidden_class);
        });
    };

    const virtualResponse = (response) => {
        if (response.error) {
            $('#msg_form').removeClass(hidden_class).text(response.error.message);
        } else {
            const acc_info = response.new_account_virtual;
            Client.process_new_account({
                email     : acc_info.email,
                loginid   : acc_info.client_id,
                token     : acc_info.oauth_token,
                is_virtual: true,
            });
        }
    };

    return {
        load: load,
    };
})();

module.exports = ChampionNewVirtualAccount;
