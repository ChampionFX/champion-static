const Client         = require('./client');
const formatMoney    = require('./currency').formatMoney;
const GTM            = require('./gtm');
const ChampionSocket = require('./socket');
const State          = require('./storage').State;
const url_for        = require('./url').url_for;
const Utility        = require('./utility');
const isEmptyObject  = require('./utility').isEmptyObject;
const template       = require('./utility').template;

const Header = (function () {
    'use strict';

    const hidden_class = 'invisible';

    const init = function() {
        ChampionSocket.wait('authorize').then(() => { userMenu(); });
        $(function () {
            const window_path = window.location.pathname;
            const path = window_path.replace(/\/$/, '');
            const href = decodeURIComponent(path);
            $('.top-nav-menu li a').each(function() {
                const target = $(this).attr('href');
                if (target === href) {
                    $(this).addClass('active');
                } else {
                    $(this).removeClass('active');
                }
            });
        });
    };

    const userMenu = function() {
        $('.nav-dropdown-toggle').off('click').on('click', function(e) {
            e.stopPropagation();
            $(this).next().toggleClass(hidden_class);
        });

        // $('#main-logout').removeAttr('class');
        const language = $('#select_language');

        const $menu_dropdown = $('.nav-menu-dropdown');
        $(document).unbind('click').on('click', function(e) {
            e.stopPropagation();
            Utility.slideOut($menu_dropdown);
            Utility.animateDisappear($menu_dropdown);
        });
        $('.nav-menu').unbind('click').on('click', function(e) {
            e.stopPropagation();
            Utility.animateDisappear(language);
            if (+$menu_dropdown.css('opacity') === 1) {
                Utility.slideOut($menu_dropdown);
                Utility.animateDisappear($menu_dropdown);
            } else {
                Utility.animateAppear($menu_dropdown);
                Utility.slideIn($menu_dropdown);
            }
        });

        if (Client.is_logged_in()) {
            $('#header .logged-in').removeClass(hidden_class);
        } else {
            $('#main-login, #header .logged-out').removeClass(hidden_class);
            return;
        }

        if (!Client.is_virtual()) {
            displayAccountStatus();
        }

        let loginid_select = '';
        const loginid_array = Client.get('loginid_array');
        for (let i = 0; i < loginid_array.length; i++) {
            const login = loginid_array[i];
            if (!login.disabled) {
                const curr_id = login.id;
                const type    = `${login.real ? 'Real' : 'Virtual'} Account`;
                const icon    = login.real ? 'fx-real-icon' : 'fx-virtual-icon';

                // default account
                if (curr_id === Client.get('loginid')) {
                    $('.account-type').html(type);
                    $('.account-id').html(curr_id);
                    loginid_select += `<a class="selected-account" href="javascript:;" value="${curr_id}">
                                        <li><span class="nav-menu-icon pull-left ${icon}"></span>${curr_id}</li>
                                       </a>
                                       <div class="separator-line-thin-gray"></div>`;
                } else {
                    loginid_select += `<a href="javascript:;" value="${curr_id}">
                                        <li><span class="nav-menu-icon pull-left ${icon}"></span>${curr_id}</li>
                                       </a>
                                       <div class="separator-line-thin-gray"></div>`;
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

    const displayNotification = (message) => {
        const $msg_notification = $('#msg_notification');
        $msg_notification.html(message);
        if ($msg_notification.is(':hidden')) $msg_notification.slideDown(500);
    };

    const hideNotification = () => {
        const $msg_notification = $('#msg_notification');
        if ($msg_notification.is(':visible')) $msg_notification.slideUp(500, () => { $msg_notification.html(''); });
    };

    const displayAccountStatus = () => {
        ChampionSocket.wait('authorize').then(() => {
            let get_account_status,
                status;

            const riskAssessment = () => {
                if (get_account_status.risk_classification === 'high') {
                    return isEmptyObject(State.get(['response', 'get_financial_assessment', 'get_financial_assessment']));
                }
                return false;
            };

            const messages = {
                authenticate: () => template('Please [_1]authenticate your account[_2] to lift your withdrawal and trading limits.',
                    [`<a href="${url_for('user/authenticate')}">`, '</a>']),
                risk: () => template('Please complete the [_1]financial assessment form[_2] to lift your withdrawal and trading limits.',
                    [`<a href="${url_for('user/profile')}#assessment">`, '</a>']),
                tnc: () => template('Please [_1]accept the updated Terms and Conditions[_2] to lift your withdrawal and trading limits.',
                    [`<a href="${url_for('user/tnc-approval')}">`, '</a>']),
                unwelcome: () => template('Your account is restricted. Kindly [_1]contact customer support[_2] for assistance.',
                    [`<a href="${url_for('contact')}">`, '</a>']),
            };

            const validations = {
                authenticate: () => !/authenticated/.test(status) || !/age_verification/.test(status),
                risk        : () => riskAssessment(),
                tnc         : () => Client.should_accept_tnc(),
                unwelcome   : () => /(unwelcome|(cashier|withdrawal)_locked)/.test(status),
            };

            const check_statuses = [
                { validation: validations.tnc,          message: messages.tnc },
                { validation: validations.risk,         message: messages.risk },
                { validation: validations.authenticate, message: messages.authenticate },
                { validation: validations.unwelcome,    message: messages.unwelcome },
            ];

            ChampionSocket.wait('website_status', 'get_account_status', 'get_settings', 'get_financial_assessment').then(() => {
                get_account_status = State.get(['response', 'get_account_status', 'get_account_status']) || {};
                status = get_account_status.status;
                const notified = check_statuses.some((object) => {
                    if (object.validation()) {
                        displayNotification(object.message());
                        return true;
                    }
                    return false;
                });
                if (!notified) hideNotification();
            });
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
        // set cookies: loginid, token
        Client.set('loginid', loginid);
        Client.set_cookie('loginid', loginid);
        Client.set_cookie('token',   token);
        GTM.setLoginFlag();
        $('.login-id-list a').removeAttr('disabled');
        window.location.reload();
    };

    const updateBalance = (response) => {
        if (response.error) {
            console.log(response.error.message);
            return;
        }
        const balance = response.balance.balance;
        Client.set('balance', balance);
        const currency = response.balance.currency;
        if (!currency) {
            return;
        }
        const view = formatMoney(balance, currency);
        $('.topMenuBalance').text(view).css('visibility', 'visible');
    };

    return {
        init                : init,
        displayAccountStatus: displayAccountStatus,
        updateBalance       : updateBalance,
    };
})();

module.exports = Header;
