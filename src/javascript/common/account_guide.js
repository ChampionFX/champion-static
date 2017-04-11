const Client         = require('./client');
const Login          = require('./login');
const ChampionSocket = require('./socket');

const AccountGuide = (() => {
    'use strict';

    const hidden_class = 'invisible';
    let $account_guide;

    const init = () => {
        ChampionSocket.wait('authorize').then(() => {
            $account_guide = $('#account_guide');

            if (!Client.is_logged_in()) {
                setDisabled('.logged-in');
                $account_guide.find('a.login').attr('href', Login.login_url());
            } else {
                setExists('.virtual');

                if (!Client.has_real()) {
                    setDisabled('.has-real');
                } else {
                    setExists('.real');
                }

                ChampionSocket.wait('mt5_login_list').then((response) => {
                    (response.mt5_login_list || []).forEach((obj) => {
                        const acc_type = Client.getMT5AccountType(obj.group);
                        if (acc_type) {
                            setExists(`.mt5_${acc_type === 'demo' ? 'demo' : 'real'}`);
                        }
                    });
                });
            }

            const $guide_content = $account_guide.find('#guide_content');
            const $guide_button  = $account_guide.find('#guide_button');
            $guide_button.off('click').on('click', function() {
                $guide_content.slideToggle(400, () => { $guide_button.toggleClass('open'); });
            });
            $account_guide.removeClass(hidden_class);

            // check display flag
            if (localStorage.getItem('show_guide') === '1') {
                localStorage.removeItem('show_guide');
                $('#guide_button:not(.open)').click();
            }
        });
    };

    const setDisabled = function(account_selector) {
        const $account = $account_guide.find(account_selector).addClass('disabled');
        $account.each(function() {
            $(this).find('.account-tooltip').removeClass(hidden_class);
            const $button = $(this).find('a.button');
            $button.replaceWith(() => ($('<span/>', { class: 'button-disabled', href: $button.attr('href'), html: $button.html() })));
        });
    };

    // const setEnabled = function($account) {
    //     $account.removeClass('disabled');
    //     const $button = $account.find('span.button-disabled');
    //    $button.replaceWith(() => ($('<a/>', { class: 'button', href: $button.attr('href'), html: $button.html() })));
    // };

    const setExists = function(account_selector) {
        $account_guide.find(`${account_selector}.account-desc`).html($('#account_exists').html());
    };

    return {
        init: init,
    };
})();

module.exports = AccountGuide;
