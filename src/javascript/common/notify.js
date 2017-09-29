const Client         = require('./client');
const ChampionSocket = require('./socket');
const State          = require('./storage').State;
const url_for        = require('./url').url_for;
const template       = require('./utility').template;
const Cookies        = require('../lib/js-cookie');
const moment         = require('moment');

const Notify = (() => {
    'use strict';

    let numberOfNotification = 0;

    const init = () => {
        if (!Client.is_logged_in()) return;

        createUI();

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
                            addToNotifications(object.message());
                            return true;
                        }
                        return false;
                    });
                    if (!notified) removeFromNotifications();
                });
            });
        });
    };

    const createUI = () => {
        const toggler       = `<a class="toggle-notification" href="javascript:;">
                                  <span class="bell"></span>
                               </a>
                               <div class="talk-bubble"></div>`;
        const notifications = `<div class="notifications">
                                  <div class="notifications__header">Notifications<a class="close"></a></div>
                                  <div class="notifications__list"></div>
                               </div>`;

        $('.notify').append(toggler);
        $('body').append(notifications);

        // attach event listeners
        $('.toggle-notification, .talk-bubble').off('click').on('click', showNotifications);
        $('.notifications__header .close').off('click').on('click', hideNotifications);
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
        if (!numberOfNotification) return;
        $('.toggle-notification').html('<span class="bell-active"></span>');

        if (!Client.get('notification_shown')) { // avoid showing talk bubble on every page refresh
            showTalkBubble();
            Client.set('notification_shown', 1);
        }
    };

    const addToNotifications = (msg) => {
        $('.notifications__list').append(`<div class="notification">${msg}</div>`);
        $('.notification > a').off('click').on('click', hideNotifications);
        numberOfNotification++;
        updateUI();
    };

    const removeFromNotifications = () => {
        numberOfNotification = 0;
        updateUI();
    };

    const showTalkBubble = () => {
        $('.talk-bubble')
            .html(`You got ${numberOfNotification} notification${numberOfNotification === 1 ? '' : 's'}`)
            .fadeIn(500);
        setTimeout(hideTalkBubble, 5000);
    };

    const hideTalkBubble = () => {
        $('.talk-bubble').fadeOut();
    };

    return {
        init                   : init,
        addToNotifications     : addToNotifications,
        removeFromNotifications: removeFromNotifications,
    };
})();

module.exports = Notify;
