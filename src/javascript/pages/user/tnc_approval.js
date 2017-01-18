const showLoadingImage     = require('../../common/utility').showLoadingImage;
const template             = require('../../common/utility').template;
const Client               = require('../../common/client');
const url_for_static       = require('../../common/url').url_for_static;
const url_for              = require('../../common/url').url_for;
const default_redirect_url = require('../../common/url').default_redirect_url;
const ChampionSocket       = require('../../common/socket');

const TNCApproval = (function() {
    'use strict';

    let hiddenClass,
        redirectUrl;

    const btn_accept = '#btn-accept';

    const load = () => {
        hiddenClass = 'invisible';
        showLoadingImage($('#tnc-loading'));

        redirectUrl = sessionStorage.getItem('tnc_redirect');
        sessionStorage.removeItem('tnc_redirect');

        ChampionSocket.promise.then(() => { showTNC(); });

        $(btn_accept).on('click', function (e) { approveTNC(e); });
    };

    const approveTNC = (e) => {
        e.preventDefault();
        e.stopPropagation();
        ChampionSocket.send({ tnc_approval: '1' }, (response) => {
            if (!Object.prototype.hasOwnProperty.call(response, 'error')) {
                redirectBack();
            } else {
                $('#err_message').html(response.error.message).removeClass(hiddenClass);
            }
        });
    };

    const showTNC = () => {
        if (!Client.is_logged_in() || Client.is_virtual()) {
            redirectBack();
        }
        $('#tnc-loading').addClass(hiddenClass);
        $('#tnc_image').attr('src', url_for_static('images/protection-icon.svg'));
        $('#tnc_approval').removeClass(hiddenClass);
        const $tnc_msg = $('#tnc-message');
        const tnc_message = template($tnc_msg.html(), [
            Client.get_value('landing_company_fullname'),
            url_for('terms-and-conditions'),
        ]);
        $tnc_msg.html(tnc_message).removeClass(hiddenClass);
        $(btn_accept).text('OK');
    };

    const redirectBack = () => {
        window.location.href = redirectUrl || default_redirect_url();
    };

    const unload = () => {
        $(btn_accept).off('click', function (e) { approveTNC(e); });
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = TNCApproval;
