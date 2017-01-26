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

        redirectUrl = sessionStorage.getItem('tnc_redirect');
        sessionStorage.removeItem('tnc_redirect');

        showTNC();
    };

    const approveTNC = (e) => {
        e.preventDefault();
        e.stopPropagation();
        ChampionSocket.send({ tnc_approval: '1' }).then((response) => {
            if (!Object.prototype.hasOwnProperty.call(response, 'error')) {
                window.location.href = redirectUrl || default_redirect_url();
            } else {
                $('#err_message').html(response.error.message).removeClass(hiddenClass);
            }
        });
    };

    const showTNC = () => {
        $('#tnc-loading').addClass(hiddenClass);
        $('#tnc_image').attr('src', url_for_static('images/protection-icon.svg'));
        $('#tnc_approval').removeClass(hiddenClass);
        const $tnc_msg = $('#tnc-message');
        const tnc_message = template($tnc_msg.html(), [
            Client.get('landing_company_fullname'),
            url_for('terms-and-conditions'),
        ]);
        $tnc_msg.html(tnc_message).removeClass(hiddenClass);
        $(btn_accept).text('OK').on('click', function (e) { approveTNC(e); });
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
