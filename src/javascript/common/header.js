const Client      = require('./client');
const Utility     = require('./utility');
const formatMoney = require('./currency').formatMoney;

const Header = (function () {
    'use strict';

    const userMenu = function() {
        if (!Client.is_logged_in()) {
            $('#main-login').removeClass('hidden');
            return;
        }
        $('#main-logout').removeClass('hidden');
        const all_accounts = $('#all-accounts');
        const language = $('#select_language');
        $('.nav-menu').unbind('click').on('click', function(e) {
            e.stopPropagation();
            Utility.animateDisappear(language);
            if (+all_accounts.css('opacity') === 1) {
                Utility.animateDisappear(all_accounts);
            } else {
                Utility.animateAppear(all_accounts);
            }
        });
        let loginid_select = '';
        const loginid_array = Client.get_value('loginid_array');
        for (let i = 0; i < loginid_array.length; i++) {
            const login = loginid_array[i];
            if (!login.disabled) {
                const curr_id = login.id;
                const type = `${login.real ? 'Real' : 'Virtual'} Account`;

                // default account
                if (curr_id === Client.get_value('loginid')) {
                    $('.account-type').html(type);
                    $('.account-id').html(curr_id);
                } else {
                    loginid_select += `<a href="#" value="${curr_id}"><li>${type}<div>${curr_id}</div>
                        </li></a><div class="separator-line-thin-gray"></div>`;
                }
            }
        }
        $('.login-id-list').html(loginid_select);
        $('.login-id-list a').off('click').on('click', function(e) {
            e.preventDefault();
            $(this).attr('disabled', 'disabled');
            switchLoginId($(this).attr('value'));
        });
    };

    const switchLoginId = (loginid) => {
        if (!loginid || loginid.length === 0) {
            return;
        }
        const token = Client.get_token(loginid);
        if (!token || token.length === 0) {
            Client.send_logout_request(true);
            return;
        }

        // cleaning the previous values
        Client.clear_storage_values();
        sessionStorage.removeItem('client_status');
        // set cookies: loginid, token
        Client.set_value('loginid', loginid);
        Client.set_cookie('loginid', loginid);
        Client.set_cookie('token',   token);
        $('.login-id-list a').removeAttr('disabled');
        window.location.reload();
    };

    const updateBalance = (response) => {
        if (response.error) {
            console.log(response.error.message);
            return;
        }
        const balance = response.balance.balance;
        Client.set_value('balance', balance);
        const currency = response.balance.currency;
        if (!currency) {
            return;
        }
        const view = formatMoney(balance, currency);
        $('.topMenuBalance').text(view).css('visibility', 'visible');
    };

    return {
        userMenu     : userMenu,
        updateBalance: updateBalance,
    };
})();

module.exports = Header;
