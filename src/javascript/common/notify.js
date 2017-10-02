const Client         = require('./client');
const ChampionSocket = require('./socket');
const State          = require('./storage').State;
const url_for        = require('./url').url_for;
const template       = require('./utility').template;

const Notify = (() => {
    'use strict';

    let numberOfNotification = 0;

    const init = () => {
        if (!Client.is_logged_in() || Client.is_virtual()) return;
        createUI();
        updateNotifications();
    };

    const updateNotifications = () => {
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
                    check_statuses.some((object) => {
                        const key = object.validation.name;
                        if (object.validation()) {
                            addToNotifications(object.message(), key);
                        } else {
                            removeFromNotifications(key);
                        }
                    });
                    if (!Client.get('notification_shown')) {
                        showTalkBubble();
                        Client.set('notification_shown', 1);
                    }
                });
            });
        });
    };

    const createUI = () => {
        if ($('.notify .toggle-notification').length) return;

        const toggler       = `<a class="toggle-notification bell" href="javascript:;"></a>
                               <div class="talk-bubble"></div>`;
        const notifications = `<div class="notifications">
                                  <div class="notifications__header">Notifications<a class="close"></a></div>
                                  <div class="notifications__list"></div>
                               </div>`;

        $('.notify').append(toggler);
        $('body').append(notifications);

        // attach event listeners
        $('.toggle-notification, .talk-bubble').off('click').on('click', showNotifications);
        $('.notifications__header .close, .navbar').off('click').on('click', hideNotifications);
    };

    const removeUI = () => {
        $('.toggle-notification, .talk-bubble, .notifications').remove();
    };

    const showNotifications = (e) => {
        e.stopPropagation();
        hideTalkBubble();
        $('.notifications').toggleClass('notifications--show');
        if ($('.overlay').length) {
            $('.overlay').remove();
        } else {
            $('body').append('<div class="overlay"></div>');
            $('.overlay').off('click').on('click', hideNotifications);
        }
    };

    const hideNotifications = (e) => {
        e.stopPropagation();
        $('.notifications').removeClass('notifications--show');
        $('.overlay').remove();
    };

    const updateUI = () => {
        $('.toggle-notification')[numberOfNotification ? 'addClass' : 'removeClass']('bell-active');
    };

    const addToNotifications = (msg, key) => {
        if ($(`.notifications__list .notification.${key}`).length) return;
        $('.notifications__list').append(`<div class="notification ${key}">${msg}</div>`);
        $('.notification > a').off('click').on('click', hideNotifications);
        numberOfNotification++;
        updateUI();
    };

    const removeFromNotifications = (key) => {
        if (!key) return;
        const $note = $(`.notifications__list .notification.${key}`);
        if (!$note.length) return;
        numberOfNotification--;
        $note.remove();
        updateUI();
    };

    const showTalkBubble = () => {
        if (!numberOfNotification) return;
        $('.talk-bubble')
            .html(`You got ${numberOfNotification} notification${numberOfNotification === 1 ? '' : 's'}`)
            .fadeIn(500);
        setTimeout(hideTalkBubble, 5000);
    };

    const hideTalkBubble = () => {
        $('.talk-bubble').fadeOut();
    };

    return {
        init               : init,
        updateNotifications: updateNotifications,
        removeUI           : removeUI,
    };
})();

module.exports = Notify;
