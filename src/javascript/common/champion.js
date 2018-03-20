const Client                  = require('./client');
const GTM                     = require('./gtm');
const Header                  = require('./header');
const LoggedIn                = require('./logged_in');
const Login                   = require('./login');
const Redirect                = require('./redirect');
const ChampionRouter          = require('./router');
const SessionDurationLimit    = require('./session_duration_limit');
const ChampionSocket          = require('./socket');
const State                   = require('./storage').State;
const default_redirect_url    = require('./url').default_redirect_url;
const Utility                 = require('./utility');
const Notify                  = require('./notify');
const Cashier                 = require('./../pages/cashier/cashier');
const CashierPassword         = require('./../pages/cashier/cashier_password');
const CashierDepositWithdraw  = require('./../pages/cashier/deposit_withdraw');
const CashierPaymentMethods   = require('./../pages/cashier/payment_methods');
const CashierTopUpVirtual     = require('./../pages/cashier/top_up_virtual');
const ClientType              = require('./../pages/client_type');
const ChampionContact         = require('./../pages/contact');
const ChampionEndpoint        = require('./../pages/endpoint');
const Home                    = require('./../pages/home');
const LostPassword            = require('./../pages/lost_password');
const MT5                     = require('./../pages/mt5');
const MT5WebPlatform          = require('./../pages/mt5_web_platform');
const BinaryOptions           = require('./../pages/binary_options');
const ChampionNewReal         = require('./../pages/new_account/real');
const ChampionNewVirtual      = require('./../pages/new_account/virtual');
const ResetPassword           = require('./../pages/reset_password');
const ChampionSignup          = require('./../pages/signup');
const TradingTimes            = require('./../pages/trading_times');
const Authenticate            = require('./../pages/user/authenticate');
const ChangePassword          = require('./../pages/user/change_password');
const Limits                  = require('./../pages/user/limits');
const LoginHistory            = require('./../pages/user/login_history');
const MetaTrader              = require('./../pages/user/metatrader/metatrader');
const ChampionProfile         = require('./../pages/user/profile');
const ChampionSecurity        = require('./../pages/user/security');
const SelfExclusion           = require('./../pages/user/self_exclusion');
const ChampionSettings        = require('./../pages/user/settings');
const TNCApproval             = require('./../pages/user/tnc_approval');

const Champion = (function() {
    'use strict';

    let container,
        active_script = null;

    const init = () => {
        container = $('#champion-container');
        container.on('champion:before', beforeContentChange);
        container.on('champion:after', afterContentChange);
        Client.init();

        ChampionSocket.init({
            authorize         : (response) => { Client.response_authorize(response); },
            balance           : (response) => { Header.updateBalance(response); },
            logout            : (response) => { Client.do_logout(response); },
            get_settings      : (response) => { GTM.eventHandler(response.get_settings); },
            get_self_exclusion: (response) => { SessionDurationLimit.exclusionResponseHandler(response); },
        }, Client.is_logged_in());
        Notify.init(); // call once
        ChampionRouter.init(container, '#champion-content');
        if (!Client.is_logged_in()) {
            $('.btn-login').on('click', () => { Login.redirect_to_login(); });
        } else {
            $('a.logo-parent').attr('href', default_redirect_url());
        }
    };

    const beforeContentChange = () => {
        if (active_script) {
            if (typeof active_script.unload === 'function') {
                active_script.unload();
            }
            active_script = null;
        }
    };

    const afterContentChange = (e, content) => {
        const page = content.getAttribute('data-page');
        State.set('current_page', page);
        const pages_map = {
            authenticate           : { module: Authenticate,           is_authenticated: true, only_real: true },
            cashier                : { module: Cashier },
            contact                : { module: ChampionContact },
            endpoint               : { module: ChampionEndpoint },
            forward                : { module: CashierDepositWithdraw, is_authenticated: true, only_real: true },
            home                   : { module: Home,                not_authenticated: true },
            limits                 : { module: Limits,              is_authenticated: true, only_real: true },
            logged_inws            : { module: LoggedIn },
            metatrader             : { module: MetaTrader,          is_authenticated: true },
            forex                  : { module: MT5 },
            cfd                    : { module: MT5 },
            metals                 : { module: MT5 },
            profile                : { module: ChampionProfile,     is_authenticated: true },
            real                   : { module: ChampionNewReal,     is_authenticated: true, only_virtual: true, is_disabled: true }, // eslint-disable-line max-len
            redirect               : { module: Redirect },
            settings               : { module: ChampionSettings,    is_authenticated: true },
            security               : { module: ChampionSecurity,    is_authenticated: true },
            virtual                : { module: ChampionNewVirtual,  not_authenticated: true },
            'cashier-password'     : { module: CashierPassword,     is_authenticated: true, only_real: true },
            'change-password'      : { module: ChangePassword,      is_authenticated: true },
            'choose-platform'      : { is_authenticated: true },
            'login-history'        : { module: LoginHistory,        is_authenticated: true },
            'lost-password'        : { module: LostPassword,        not_authenticated: true },
            'binary-options'       : { module: BinaryOptions },
            'mt5-web-platform'     : { module: MT5WebPlatform },
            'payment-methods'      : { module: CashierPaymentMethods },
            'reset-password'       : { module: ResetPassword,       not_authenticated: true },
            'self-exclusion'       : { module: SelfExclusion,       is_authenticated: true, only_real: true },
            'tnc-approval'         : { module: TNCApproval,         is_authenticated: true, only_real: true },
            'top-up-virtual'       : { module: CashierTopUpVirtual, is_authenticated: true, only_virtual: true },
            'trading-times'        : { module: TradingTimes },
            'types-of-accounts'    : { module: ClientType },
            'trading-platform'     : { module: ClientType },
            'metatrader-5'         : { module: MT5 },
            'champion-trader'      : { module: ClientType },
            'economic-calendar'    : { module: ClientType },
            'mt5-types-of-accounts': { module: MT5 },
        };
        if (page in pages_map) {
            loadHandler(pages_map[page]);
        }

        if (!active_script) active_script = ChampionSignup;
        Header.init();
        GTM.pushDataLayer();
        ChampionSignup.load();
        Utility.handleActive();
    };

    const errorMessages = {
        login       : () => (Utility.template('Please <a href="[_1]" class="login">log in</a> to view this page.', [`${'java'}${'script:;'}`])),
        only_virtual: 'Sorry, this feature is available to virtual accounts only.',
        only_real   : 'This feature is not relevant to virtual-money accounts.',
    };

    const loadHandler = (config) => {
        active_script = config.module;
        if (config.is_authenticated) {
            if (!Client.is_logged_in()) {
                displayMessage(errorMessages.login(config.module));
            } else {
                ChampionSocket.wait('authorize')
                    .then((response) => {
                        if (response.error) {
                            displayMessage(errorMessages.login());
                        } else if (config.only_virtual && !Client.is_virtual()) {
                            displayMessage(errorMessages.only_virtual);
                        } else if (config.only_real && Client.is_virtual()) {
                            displayMessage(errorMessages.only_real);
                        } else if (config.is_disabled) {
                            displayMessage('Sorry, we are disabling this feature at the moment.');
                        } else {
                            active_script.load();
                        }
                    });
            }
        } else if (config.not_authenticated && Client.is_logged_in()) {
            ChampionRouter.forward(default_redirect_url(), true);
        } else {
            active_script.load();
        }
    };

    const displayMessage = (message) => {
        const $content = container.find('#champion-content .container');
        $content.html($content.find('h1').first())
            .append($('<p/>', { class: 'center-text notice-msg', html: message }));
        $content.find('a.login').on('click', () => { Login.redirect_to_login(); });
    };

    return {
        init: init,
    };
})();

module.exports = Champion;
