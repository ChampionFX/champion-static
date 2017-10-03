const Client         = require('./client');
const formatMoney    = require('./currency').formatMoney;
const GTM            = require('./gtm');
const Notify         = require('./notify');
const ChampionRouter = require('./router');
const ChampionSocket = require('./socket');
const State          = require('./storage').State;
const url_for        = require('./url').url_for;

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
        }
    };

    const desktopMenu = function() {
        if (!Client.is_logged_in()) return;

        $(window).off('resize.updateBody').on('resize.updateBody', updateBody);
        updateBody();

        $('#header .logged-in').removeClass(hidden_class);
    };

    const updateBody = () => {
        $('#champion-container').css('margin-top', $('#top_group').height());
    };
    const userMenu = function() {
        if (!Client.is_logged_in()) return;
        if (!Client.is_virtual()) {
            Notify.updateNotifications();
        } else {
            Notify.removeUI();
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
            const is_mt = State.get('is_mt_pages');
            State.remove('is_mt_pages'); // needs to remove the flag before redirection
            if (is_mt || State.get('current_page') === 'metatrader') {
                ChampionRouter.forward(url_for('user/settings'));
            }
            switchLoginId($(this).attr('value')); // should be at the end as this reloads the page
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
        switchLoginId: switchLoginId,
        updateBalance: updateBalance,
    };
})();

module.exports = Header;
