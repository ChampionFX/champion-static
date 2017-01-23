const ChampionSocket = require('./../../common/socket');
const Client         = require('./../../common/client');
// const Validation     = require('./../../common/validation');
const Login          = require('./../../common/login');

const DepositWithdrawal = (function() {
    'use strict';

    let btn_submit;
       // form_type;

    // const fields = {
    //     btn_submit: '#btn_submit',
    // };

    const views = {
        logged_out: 'logged_out',
        virtual   : 'virtual',
        real      : 'real',
        currency  : 'currency',
        deposit   : 'deposit',
        withdraw  : 'withdraw',
    };

    // const currencies = {
    //     USD: '$',
    //     GBP: '£',
    //     AUD: 'A$',
    //     EUR: '€',
    //     JPY: '¥',
    // };

    const load = () => {
        if (!Client.is_logged_in()) {
            renderView(views.logged_out);
        } else {
            ChampionSocket.promise.then(() => {
                if (Client.is_virtual()) {
                    renderView(views.virtual);
                } else {
                    if (!Client.get_value('currency')) {
                        ChampionSocket.send({ set_account_currency: 'USD' }); // set account currency to USD by default
                    }
                    renderView(views.real); // TODO: check for deposit / withdraw
                }
            });
        }
    };

    const renderView = (view, form) => {
        const $form = $(`#form_${form}`);

        if (view === views.logged_out) {
            $('#client_message').show()
                .find('.notice-msg').html('Please <a href="javascript:;">log in</a> to view this page.')
                .find('a')
                .on('click', () => {
                    Login.redirect_to_login();
                });
        } else if (view === views.virtual) {
            $('#client_message').show()
                .find('.notice-msg').html('This feature is not relevant to virtual-money accounts.');
        } else if (view === views.real) {
            $form.show();
        }
    };

    // TODO: init deposit / withdraw forms
    // const initForm = () => {
    //     const form_selector = `#form_${form_type}`,
    //         $form = $(form_selector);

    //     btn_submit = $form.find(fields.btn_submit);
    //     btn_submit.on('click', submit);
    // };

    const unload = () => {
        if (btn_submit) {
            btn_submit.off('click', submit);
        }
    };

    const submit = (e) => {
        e.preventDefault();

        // TODO: validate deposit / withdraw form

        // const form_selector = `#form_${form_type}`,
        //     $form = $(form_selector);

        // const req_val = $('#select-currency').val();

        // const data = {
        //     set_account_currency: req_val,
        // };

        // ChampionSocket.send(data, (response) => {
        //     if (response.error) {
        //         $('#error-set-currency').removeClass('hidden').text(response.error.message);
        //     } else {
        //         $form.hide();
        //         $('#client_message').show()
        //             .find('.notice-msg').text('Your account currency has been updated successfully.');
        //     }
        // });
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = DepositWithdrawal;
