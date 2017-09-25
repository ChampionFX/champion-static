const Client         = require('./client');
const formatMoney    = require('./currency').formatMoney;
const GTM            = require('./gtm');
const ChampionRouter = require('./router');
const ChampionSocket = require('./socket');
const State          = require('./storage').State;
const url_for        = require('./url').url_for;
const template       = require('./utility').template;

const Header = (function () {
    'use strict';

    const hidden_class = 'invisible';

    const init = function() {
        ChampionSocket.wait('authorize').then(() => { updatePage(); });
        $(function () {
            const window_path = window.location.pathname;
            const path = window_path.replace(/\/$/, '');
            const href = decodeURIComponent(path);
            $('.navbar__nav__menu li a').each(function() {
                const target = $(this).attr('href');
                if (target === href) {
                    $(this).parent().addClass('active');
                } else {
                    $(this).parent().removeClass('active');
                }
            });
        });
    };

    const updatePage = () => {
        desktopMenu();
        userMenu();
        if (!Client.is_logged_in()) {
            $('#top_group').removeClass('logged-in').find('.logged-out').removeClass(hidden_class);
            $('.trading-platform-header').removeClass(hidden_class);
            $('.navbar__brand, .navbar__toggle').removeClass('logged-in'); // show logo
            $('#header > .navbar').removeClass('navbar--fixed');
        }
    };

    const desktopMenu = function() {
        if (!Client.is_logged_in()) return;

        $(window).off('resize.updateBody').on('resize.updateBody', updateBody);
        updateBody();

        $('#header .logged-in').removeClass(hidden_class);
        $('#header > .navbar').addClass('navbar--fixed');

        // to be remove when we change notification ui
        $(window).on('orientationchange resize', updateMobileMenuHeight);
        updateMobileMenuHeight();
    };

    const updateBody = () => {
        const notificationBarHeight = $('#msg_notification').css('display') === 'block' ? $('#top_group').height() : 0;
        const navbarHeight = 50;
        $('#champion-container').css('margin-top', navbarHeight + notificationBarHeight);
        updateMobileMenuHeight();
    };

    const updateMobileMenuHeight = () => {
        $('.navbar__nav').height($(window).height() - $('#top_group').height());
    };

    const userMenu = function() {
        if (!Client.is_logged_in()) return;
        if (!Client.is_virtual()) {
            displayAccountStatus();
        }

        setMetaTrader();

        const selectedTemplate = (text, value, icon) => (
            `<div class="hidden-lg-up invisible">
                 <a rel="#" class="selected" value="${value}">
                     <li><span class="fx ${icon}"></span>${text}</li>
                 </a>
             </div>`
        );
        const switchTemplate = (text, value, icon, type, item_class) => (
            `<li class="${item_class}">
                <a href="javascript:;" value="${value}">
                     <span class="hidden-lg-up fx ${icon}"></span>
                     <div class="account-id">${text}</div>
                     <div class="hidden-lg-down account-type">${type}</div>
                </a>
            </li>
            `
        );
        const is_mt_pages = State.get('is_mt_pages');
        let loginid_select = is_mt_pages ? selectedTemplate('MetaTrader 5', '', 'fx-mt5-o') : '';
        Client.get('loginid_array').forEach((login) => {
            if (!login.disabled) {
                const curr_id = login.id;
                const type    = `(Binary ${login.real ? 'Real' : 'Virtual'} Account)`;
                const icon    = login.real ? 'fx-account-real' : 'fx-account-virtual';
                const is_current = curr_id === Client.get('loginid');

                // default account
                if (is_current && !is_mt_pages) {
                    $('.account-type').html(type);
                    $('.account-id').html(curr_id);
                } else if (is_mt_pages && login.real && Client.is_virtual()) {
                    switchLoginId(curr_id);
                    return;
                }
                loginid_select += switchTemplate(curr_id, curr_id, icon, type, is_current ? (is_mt_pages ? 'mt-show' : 'invisible') : '');
            }
        });

        $('.login-id-list').html(loginid_select);
        if (!Client.has_real()) {
            $('.account-list .upgrade').removeClass(hidden_class);
        }
        $('.login-id-list a').off('click').on('click', function(e) {
            e.preventDefault();
            $(this).attr('disabled', 'disabled');
            switchLoginId($(this).attr('value'));
            if (State.get('is_mt_pages')) {
                State.remove('is_mt_pages');
                ChampionRouter.forward(url_for('user/settings'));
            }
        });
    };

    const setMetaTrader = () => {
        const is_mt_pages = State.get('is_mt_pages');
        $('#header, #footer').find('.mt-hide')[is_mt_pages ? 'addClass' : 'removeClass'](hidden_class);
        $('#header, #footer').find('.mt-show')[is_mt_pages ? 'removeClass' : 'addClass'](hidden_class);
    };

    const displayNotification = (message) => {
        const $msg_notification = $('#msg_notification');
        $msg_notification.html(message);
        if ($msg_notification.is(':hidden')) $msg_notification.slideDown(500, updateBody);
    };

    const hideNotification = () => {
        const $msg_notification = $('#msg_notification');
        if ($msg_notification.is(':visible')) $msg_notification.slideUp(500, () => { $msg_notification.html(''); });
    };

    const displayAccountStatus = () => {
        ChampionSocket.wait('authorize').then(() => {
            let get_account_status,
                status,
                has_mt_account = false;

            const riskAssessment = () => (get_account_status.risk_classification === 'high' || has_mt_account) &&
            /financial_assessment_not_complete/.test(status);

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
                authenticate: () => get_account_status.prompt_client_to_authenticate,
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
                ChampionSocket.wait('mt5_login_list').then((response) => {
                    if (response.mt5_login_list.length) {
                        has_mt_account = true;
                    }
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
        });
    };

    const switchLoginId = (loginid) => {
        if (!loginid || loginid.length === 0 || loginid === Client.get('loginid')) {
            return;
        }
        const token = Client.get_token(loginid);
        if (!token || token.length === 0) {
            ChampionSocket.send({ logout: 1 });
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
        $('.account-balance').text(view).css('visibility', 'visible');
    };

    return {
        init                : init,
        displayAccountStatus: displayAccountStatus,
        updateBalance       : updateBalance,
    };
})();

module.exports = Header;
