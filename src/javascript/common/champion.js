const Client                  = require('./client');
const Header                  = require('./header');
const LoggedIn                = require('./logged_in');
const Login                   = require('./login');
const ChampionRouter          = require('./router');
const ChampionSocket          = require('./socket');
const default_redirect_url    = require('./url').default_redirect_url;
const Utility                 = require('./utility');
const BinaryOptions           = require('./../pages/binary_options');
const ChampionContact         = require('./../pages/contact');
const ChampionEndpoint        = require('./../pages/endpoint');
const ChampionSignup          = require('./../pages/signup');
const Slider             = require('./../pages/slider');
const ChampionNewReal         = require('./../pages/new_account/real');
const ChampionNewVirtual      = require('./../pages/new_account/virtual');
const LostPassword            = require('./../pages/lost_password');
const ResetPassword           = require('./../pages/reset_password');
const Cashier                 = require('./../pages/cashier/cashier');
const CashierPassword         = require('./../pages/cashier/cashier_password');
const CashierPaymentMethods   = require('./../pages/cashier/payment_methods');
const CashierTopUpVirtual     = require('./../pages/cashier/top_up_virtual');
const ChangePassword          = require('./../pages/user/change_password');
const checkRiskClassification = require('./../pages/user/check_risk_classification');
const FinancialAssessment     = require('./../pages/user/financial_assessment');
const MetaTrader              = require('./../pages/user/metatrader/metatrader');
const ChampionSettings        = require('./../pages/user/settings');
const TNCApproval             = require('./../pages/user/tnc_approval');
const CashierDepositWithdraw  = require('./../pages/cashier/deposit_withdraw');
const PersonalDetails         = require('./../pages/user/personal_details');
const ChampionProfile         = require('./../pages/user/profile');
const ChampionSecurity        = require('./../pages/user/security');

const Champion = (function() {
    'use strict';

    let container,
        active_script = null;

    const init = () => {
        container = $('#champion-container');
        container.on('champion:before', beforeContentChange);
        container.on('champion:after', afterContentChange);
        Client.init();
        Slider.init();
        ChampionSocket.init({
            authorize: (response) => { Client.response_authorize(response); },
            balance  : (response) => { Header.updateBalance(response); },
            logout   : (response) => { Client.do_logout(response); },
        }, Client.is_logged_in());
        ChampionRouter.init(container, '#champion-content');
        if (!Client.is_logged_in()) {
            $('#main-login').find('a').on('click', () => { Login.redirect_to_login(); });
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
        const pages_map = {
            assessment        : { module: FinancialAssessment, is_authenticated: true, only_real: true },
            cashier           : { module: Cashier },
            contact           : { module: ChampionContact },
            details           : { module: PersonalDetails,     is_authenticated: true },
            endpoint          : { module: ChampionEndpoint },
            forward           : { module: CashierDepositWithdraw, is_authenticated: true, only_real: true },
            logged_inws       : { module: LoggedIn },
            metatrader        : { module: MetaTrader,          is_authenticated: true },
            profile           : { module: ChampionProfile,     is_authenticated: true },
            real              : { module: ChampionNewReal,     is_authenticated: true, only_virtual: true },
            settings          : { module: ChampionSettings,    is_authenticated: true },
            security          : { module: ChampionSecurity,    is_authenticated: true },
            virtual           : { module: ChampionNewVirtual,  not_authenticated: true },
            'binary-options'  : { module: BinaryOptions },
            'cashier-password': { module: CashierPassword,     is_authenticated: true, only_real: true },
            'change-password' : { module: ChangePassword,      is_authenticated: true },
            'lost-password'   : { module: LostPassword,        not_authenticated: true },
            'payment-methods' : { module: CashierPaymentMethods },
            'reset-password'  : { module: ResetPassword,       not_authenticated: true },
            'tnc-approval'    : { module: TNCApproval,         is_authenticated: true, only_real: true },
            'top-up-virtual'  : { module: CashierTopUpVirtual, is_authenticated: true, only_virtual: true },
        };
        if (page in pages_map) {
            loadHandler(pages_map[page]);
        }

        if (!active_script) active_script = ChampionSignup;
        Header.init();
        ChampionSignup.load();
        Utility.handleActive();
        ChampionSocket.wait('get_settings', 'get_account_status').then(() => { Client.check_tnc(); });
        checkRiskClassification();
    };

    const errorMessages = {
        login       : () => Utility.template('Please <a href="[_1]">log in</a> to view this page.', [Login.login_url()]),
        only_virtual: 'Sorry, this feature is available to virtual accounts only.',
        only_real   : 'This feature is not relevant to virtual-money accounts.',
    };

    const loadHandler = (config) => {
        active_script = config.module;
        if (config.is_authenticated) {
            if (!Client.is_logged_in()) {
                displayMessage(errorMessages.login());
            } else {
                ChampionSocket.wait('authorize')
                    .then((response) => {
                        if (response.error) {
                            displayMessage(errorMessages.login());
                        } else if (config.only_virtual && !Client.is_virtual()) {
                            displayMessage(errorMessages.only_virtual);
                        } else if (config.only_real && Client.is_virtual()) {
                            displayMessage(errorMessages.only_real);
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
    };

    return {
        init: init,
    };
})();

module.exports = Champion;
