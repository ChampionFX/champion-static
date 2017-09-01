const Client         = require('./client');
const ChampionSocket = require('./socket');
const State          = require('./storage').State;
const url_for        = require('./url').url_for;
const template       = require('./utility').template;

const Notify = (() => {
    'use strict';

    let numberOfNotification = 0;

    const init = () => {
        if (!Client.is_logged_in()) return;

        // create ui
        $('.notify')
            .append(`<a class="toggle-notification"><span class="notify-bell"></span></a>
                     <div class="notify-bubble"></div>`);

        $('#top_group')
            .append(`<div class="notifications">
                     <div class="notifications-header">Notifications<a class="btn-close"></a></div>
                     <div class="notifications-list"></div></div>`);

        // attach event listeners
        $('.toggle-notification, .notify-bubble, .notifications > .btn-close').off('click').on('click', function(e) {
            e.stopPropagation();
            hidePopUpMessage();
            $('.notifications').toggleClass('notifications--show');
        });

        $('body').off('click').on('click', function(e) {
            if ($(e.target).is('.notifications, .notifications-header')) {
                return false;
            }
            $('.notifications').removeClass('notifications--show');
            return true;
        });

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
                            notify(object.message());
                            return true;
                        }
                        return false;
                    });
                    if (!notified) hideNotification();
                });
            });
        });
    };

    const updateUI = () => {
        $('.toggle-notification')
            .html(`<span class="${!numberOfNotification ? 'notify-bell' : 'notify-bell-active'}"></span>`);
        if (numberOfNotification) {
            showPopUpMessage();
        }
    };

    const notify = (msg) => {
        $('.notifications-list')
            .append(`<div class="notification"><div class="notification-message">${msg}</div></div>`);
        numberOfNotification++;
        updateUI();
    };

    const showPopUpMessage = () => {
        $('.notify-bubble')
            .html(`You've got ${numberOfNotification} notification${numberOfNotification === 1 ? '' : 's'}`)
            .fadeIn(500);
        setTimeout(hidePopUpMessage, 5000);
    };

    const hidePopUpMessage = () => {
        $('.notify-bubble').fadeOut();
    };

    const hideNotification = () => {
        numberOfNotification = 0;
        updateUI();
    };

    return {
        init            : init,
        notify          : notify,
        hideNotification: hideNotification,
    };
})();

module.exports = Notify;
