const Client                  = require('./client');
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

const Champion = (function() {
    'use strict';

    let _container,
        _active_script = null;

    const init = () => {
        _container = $('#champion-container');
        _container.on('champion:before', beforeContentChange);
        _container.on('champion:after', afterContentChange);
        Client.init();
        ChampionSocket.init();
        ChampionRouter.init(_container, '#champion-content');
        if (!Client.is_logged_in()) {
            $('#main-login').find('a').on('click', () => { Login.redirect_to_login(); });
        } else {
            $('a.logo-parent').attr('href', default_redirect_url());
        }
    };

    const beforeContentChange = () => {
        if (_active_script) {
            if (typeof _active_script.unload === 'function') {
                _active_script.unload();
            }
            _active_script = null;
        }
    };

    const afterContentChange = (e, content) => {
        const page = content.getAttribute('data-page');
        const pages_map = {
            assessment        : FinancialAssessment,
            cashier           : Cashier,
            contact           : ChampionContact,
            endpoint          : ChampionEndpoint,
            logged_inws       : LoggedIn,
            metatrader        : MetaTrader,
            real              : ChampionNewReal,
            settings          : ChampionSettings,
            virtual           : ChampionNewVirtual,
            'binary-options'  : BinaryOptions,
            'cashier-password': CashierPassword,
            'change-password' : ChangePassword,
            'lost-password'   : LostPassword,
            'payment-methods' : CashierPaymentMethods,
            'reset-password'  : ResetPassword,
            'tnc-approval'    : TNCApproval,
            'top-up-virtual'  : CashierTopUpVirtual,
        };
        if (page in pages_map) {
            _active_script = pages_map[page];
            _active_script.load();
        }

        if (!_active_script) _active_script = ChampionSignup;
        ChampionSignup.load();
        Utility.handleActive();
        checkRiskClassification();
    };

    return {
        init: init,
    };
})();

module.exports = Champion;
