const ChampionSocket     = require('./socket');
const ChampionRouter     = require('./router');
const ChampionSignup     = require('./../pages/signup');
const ChampionNewVirtual = require('./../pages/new_account/virtual');
const ChampionNewReal    = require('./../pages/new_account/real');
const ChampionContact    = require('./../pages/contact');
const ChampionEndpoint   = require('./../pages/endpoint');
const ChampionSettings   = require('./../pages/user/settings');
const ChangePassword     = require('./../pages/user/change_password');
const TNCApproval        = require('./../pages/user/tnc_approval');
const LostPassword       = require('./../pages/lost_password');
const ResetPassword      = require('./../pages/reset_password');
const BinaryOptions      = require('./../pages/binary_options');
const Client             = require('./client');
const LoggedIn           = require('./logged_in');
const Login              = require('./login');
const Utility            = require('./utility');
const Cashier             = require('./../pages/cashier/cashier');
const CashierTopUpVirtual = require('./../pages/cashier/top_up_virtual');
const CashierPaymentMethods = require('./../pages/cashier/payment_methods');
const CashierPassword       = require('./../pages/cashier/cashier_password');

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
            virtual           : ChampionNewVirtual,
            real              : ChampionNewReal,
            contact           : ChampionContact,
            endpoint          : ChampionEndpoint,
            logged_inws       : LoggedIn,
            'binary-options'  : BinaryOptions,
            'change-password' : ChangePassword,
            'lost-password'   : LostPassword,
            'reset-password'  : ResetPassword,
            cashier           : Cashier,
            'payment-methods' : CashierPaymentMethods,
            'top-up-virtual'  : CashierTopUpVirtual,
            'cashier-password': CashierPassword,
            'tnc-approval'    : TNCApproval,
        };
        if (page in pages_map) {
            _active_script = pages_map[page];
            _active_script.load();
        }

        if (!_active_script) _active_script = ChampionSignup;
        ChampionSignup.load();
        Utility.handleActive();
    };

    return {
        init: init,
    };
})();

module.exports = Champion;
