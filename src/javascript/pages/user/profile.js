const Client              = require('../../common/client');
const showLoadingImage    = require('../../common/utility').showLoadingImage;
const FinancialAssessment = require('./financial_assessment');
const PersonalDetails     = require('./personal_details');

const Profile = (() => {
    'use strict';

    const load = () => {
        showLoadingImage($('<div/>', { id: 'loading', class: 'center-text' }).insertAfter('#heading'));

        $('.tabs-vertical').tabs();

        let hash = window.location.hash.substring(1);
        if (Client.is_virtual()) {
            hash = '#details';
            $(`a[href="${hash}"]`).click();
            loadContent(hash);
        } else {
            loadContent(hash);
            let active_tab = $('.ui-tabs-active a').attr('href');

            $('.tabs-vertical li').on('click', () => {
                active_tab = $('.ui-tabs-active a').attr('href');
                loadContent(active_tab);
            });
        }
    };

    const loadContent = (hash) => {
        if (/assessment/.test(hash)) {
            PersonalDetails.unload();
            FinancialAssessment.load();
        } else {
            PersonalDetails.load();
            FinancialAssessment.unload();
        }

        $('.barspinner').addClass('invisible');
        $('#fx-profile').removeClass('invisible');
    };

    const unload = () => {};

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = Profile;
