const Client         = require('./client');
const formatMoney    = require('./currency').formatMoney;
const GTM            = require('./gtm');
const ChampionRouter = require('./router');
const ChampionSocket = require('./socket');
const State          = require('./storage').State;
const url_for        = require('./url').url_for;
const Utility        = require('./utility');
const template       = require('./utility').template;

const Header = (function () {
    'use strict';

    const hidden_class = 'invisible';
    const media_query  = window.matchMedia('(max-width: 1199px)');

    const init = function() {
        ChampionSocket.wait('authorize').then(() => { updatePage(media_query); });
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
            media_query.addListener(updatePage);
        });
    };

    const updatePage = (mq) => {
        if (mq.matches) {
            mobileMenu();
        } else {
            desktopMenu();
        }
        userMenu();
        if (!Client.is_logged_in()) {
            $('#top_group').removeClass('logged-in').find('.logged-out').removeClass(hidden_class);
            $('.trading-platform-header').removeClass(hidden_class);
        }
    };

    const mobileMenu = function() {
        const $menu_dropdown = $('.nav-menu-dropdown');

        $('#mobile-menu > ul').height($(window).innerHeight());
        $(window).on('orientationchange resize', () => {
            $('#mobile-menu > ul').height($(window).innerHeight());
        });

        $('.nav-menu:not(.selected-account)').unbind('click').on('click', function(e) {
            e.stopPropagation();
            if ($('.nav-menu-dropdown.slide-in').length) {
                Utility.slideOut($menu_dropdown);
            } else {
                Utility.slideIn($menu_dropdown);
            }
        });

        $(document).off('click.mobileMenu').on('click.mobileMenu', function(e) {
            e.stopPropagation();
            if ($('.nav-menu-dropdown.slide-in').length) {
                Utility.slideOut($menu_dropdown);
            }
        });

        $('.nav-dropdown-toggle').off('click').on('click', function(e) {
            e.stopPropagation();
            $(this).next().toggleClass(hidden_class);
        });

        if (!Client.is_logged_in()) {
            $('#topbar, #header').find('.logged-out').removeClass(hidden_class);
            return;
        }
        $('#topbar, #header').find('.logged-in').removeClass(hidden_class);
    };

    const desktopMenu = function() {
        const $all_accounts = $('#all-accounts');
        $all_accounts.find('li.has-sub > a').off('click').on('click', function(e) {
            e.stopPropagation();
            $(this).siblings('ul').toggleClass(hidden_class);
        });

        if (!Client.is_logged_in()) return;

        $(window).off('resize.updateBody').on('resize.updateBody', updateBody);
        updateBody();

        $('#header .logged-in').removeClass(hidden_class);
        $all_accounts.find('.account > a').removeClass('menu-icon');
        const language = $('#select_language');
        $('.nav-menu').unbind('click').on('click', function(e) {
            e.stopPropagation();
            Utility.animateDisappear(language);
            if (+$all_accounts.css('opacity') === 1) {
                Utility.animateDisappear($all_accounts);
            } else {
                Utility.animateAppear($all_accounts);
            }
        });

        $(document).off('click.desktopMenu').on('click.desktopMenu', function(e) {
            e.stopPropagation();
            Utility.animateDisappear($all_accounts);
        });
    };

    const updateBody = () => {
        $('#champion-container').css('margin-top', $('#top_group').height());
    };

    const userMenu = function() {
        if (!Client.is_logged_in()) return;
        if (!Client.is_virtual()) {
            displayAccountStatus();
        }

        setMetaTrader();

        const selectedTemplate = (text, value, icon) => (
            `<div class="hidden-lg-up">
                 <span class="selected" value="${value}">
                     <li><span class="nav-menu-icon pull-left ${icon}"></span>${text}</li>
                 </span>
                 <div class="separator-line-thin-gray hidden-lg-down"></div>
             </div>`
        );
        const switchTemplate = (text, value, icon, type, item_class) => (
            `<a href="javascript:;" value="${value}" class="${item_class}">
                 <li>
                     <span class="hidden-lg-up nav-menu-icon pull-left ${icon}"></span>
                     <div>${text}</div>
                     <div class="hidden-lg-down account-type">${type}</div>
                 </li>
                 <div class="separator-line-thin-gray hidden-lg-down"></div>
            </a>`
        );
        const is_mt_pages = State.get('is_mt_pages');
        let loginid_select = is_mt_pages ? selectedTemplate('MetaTrader 5', '', 'fx-mt5-icon') : '';
        Client.get('loginid_array').forEach((login) => {
            if (!login.disabled) {
                const curr_id = login.id;
                const type    = `(Binary ${login.real ? 'Real' : 'Virtual'} Account)`;
                const icon    = login.real ? 'fx-real-icon' : 'fx-virtual-icon';
                const is_current = curr_id === Client.get('loginid');

                // default account
                if (is_current && !is_mt_pages) {
                    $('.main-account .account-type').html(type);
                    $('.main-account .account-id').html(curr_id);
                    loginid_select += selectedTemplate(curr_id, curr_id, icon);
                } else if (is_mt_pages && login.real && Client.is_virtual()) {
                    switchLoginId(curr_id);
                    return;
                }
                loginid_select += switchTemplate(curr_id, curr_id, icon, type, is_current ? 'mt-show' : '');
            }
        });

        $('.login-id-list').html(loginid_select);
        if (!Client.has_real()) {
            $('#all-accounts .upgrade').removeClass(hidden_class);
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
