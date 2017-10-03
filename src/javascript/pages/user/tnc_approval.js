const Client               = require('../../common/client');
const Notify               = require('../../common/notify');
const ChampionSocket       = require('../../common/socket');
const default_redirect_url = require('../../common/url').default_redirect_url;
const url_for              = require('../../common/url').url_for;
const url_for_static       = require('../../common/url').url_for_static;
const template             = require('../../common/utility').template;

const TNCApproval = (function() {
    'use strict';

    const hidden_class = 'invisible';
    const btn_accept   = '#btn-accept';

    const load = () => {
        $('#tnc-loading').addClass(hidden_class);
        $('#tnc_image').attr('src', url_for_static('images/protection-icon.svg'));
        $('#tnc_approval').removeClass(hidden_class);
        const $tnc_msg = $('#tnc-message');
        const tnc_message = template($tnc_msg.html(), [
            Client.get('landing_company_fullname'),
            url_for('terms-and-conditions'),
        ]);
        $tnc_msg.html(tnc_message).removeClass(hidden_class);
        $(btn_accept).text('OK').on('click', function (e) { approveTNC(e); });
    };

    const approveTNC = (e) => {
        e.preventDefault();
        e.stopPropagation();
        ChampionSocket.send({ tnc_approval: '1' }).then((response) => {
            if (!Object.prototype.hasOwnProperty.call(response, 'error')) {
                ChampionSocket.send({ get_settings: 1 }, true).then(() => {
                    Notify.updateNotifications();
                });
                window.location.href = default_redirect_url();
            } else {
                $('#err_message').html(response.error.message).removeClass(hidden_class);
            }
        });
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
