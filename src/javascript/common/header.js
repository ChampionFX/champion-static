const Client         = require('./client');
const formatMoney    = require('./currency').formatMoney;
const GTM            = require('./gtm');
const ChampionRouter = require('./router');
const ChampionSocket = require('./socket');
const State          = require('./storage').State;
const url_for        = require('./url').url_for;
const Utility        = require('./utility');

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
                loginid_select += switchTemplate(curr_id, curr_id, icon, type, is_current ? (is_mt_pages ? 'mt-show' : 'invisible') : '');
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
        init         : init,
        updateBalance: updateBalance,
    };
})();

module.exports = Header;
