const moment               = require('moment');
const ChampionSocket       = require('../../common/socket');
const Client               = require('../../common/client');
const State                = require('../../common/storage').State;
const Utility              = require('../../common/utility');
const default_redirect_url = require('../../common/url').default_redirect_url;
const Validation           = require('../../common/validation');
const DatePicker           = require('../../components/date_picker').DatePicker;

const ChampionNewRealAccount = (function() {
    'use strict';

    const form_selector = '#frm_new_account_real';

    let client_residence,
        residences = null,
        states     = null;

    let container,
        btn_submit,
        ddl_residence,
        ddl_state;

    const fields = {
        ddl_title          : '#ddl_title',
        txt_fname          : '#txt_fname',
        txt_lname          : '#txt_lname',
        txt_birth_date     : '#txt_birth_date',
        ddl_residence      : '#ddl_residence',
        txt_address1       : '#txt_address1',
        txt_address2       : '#txt_address2',
        txt_city           : '#txt_city',
        ddl_state          : '#ddl_state',
        txt_state          : '#txt_state',
        txt_postcode       : '#txt_postcode',
        txt_phone          : '#txt_phone',
        ddl_secret_question: '#ddl_secret_question',
        txt_secret_answer  : '#txt_secret_answer',
        chk_tnc            : '#chk_tnc',
        btn_submit         : '#btn_submit',
    };

    const load = () => {
        ChampionSocket.promise().then(() => {
            if (!Client.is_logged_in() || Client.has_real()) {
                window.location.href = default_redirect_url();
                return;
            }

            container        = $('#champion-container');
            client_residence = Client.get_value('residence');
            populateResidence();
            populateState();
            attachDatePicker();

            btn_submit = container.find(fields.btn_submit);
            btn_submit.on('click dblclick', submit);
        });
    };

    const unload = () => {
        if (btn_submit) {
            btn_submit.off('click', submit);
        }
    };

    const initValidation = () => {
        Validation.init(form_selector, [
            { selector: fields.txt_fname,           validations: ['req', 'general', ['min', { min: 2 }]] },
            { selector: fields.txt_lname,           validations: ['req', 'general', ['min', { min: 2 }]] },
            { selector: fields.txt_birth_date,      validations: ['req'] },
            { selector: fields.ddl_residence,       validations: ['req'] },
            { selector: fields.txt_address1,        validations: ['req', 'general'] },
            { selector: fields.txt_address2,        validations: ['general'] },
            { selector: fields.txt_city,            validations: ['req', 'general'] },
            { selector: fields.txt_state,           validations: ['general'] },
            { selector: fields.txt_postcode,        validations: ['postcode'] },
            { selector: fields.txt_phone,           validations: ['req', 'phone', ['min', { min: 6 }]] },
            { selector: fields.ddl_secret_question, validations: ['req'] },
            { selector: fields.txt_secret_answer,   validations: ['req', ['min', { min: 4 }]] },
            { selector: fields.chk_tnc,             validations: ['req'] },
        ]);
    };

    const populateResidence = () => {
        ddl_residence = container.find(fields.ddl_residence);
        residences = State.get(['response', 'residence_list']);
        const renderResidence = () => {
            Utility.dropDownFromObject(ddl_residence, residences, client_residence);
        };
        if (!residences) {
            ChampionSocket.send({ residence_list: 1 }, (response) => {
                residences = response.residence_list;
                renderResidence();
            });
        } else {
            renderResidence();
        }
    };

    const populateState = () => {
        ddl_state = container.find(fields.ddl_state);
        states = State.get(['response', 'states_list']);
        const renderState = () => {
            if (states && states.length) {
                Utility.dropDownFromObject(ddl_state, states);
            } else {
                ddl_state.replaceWith($('<input/>', { type: 'text', id: fields.txt_state.replace('#', ''), class: 'text', maxlength: '35' }));
            }
            initValidation();
        };
        if (!states) {
            ChampionSocket.send({ states_list: client_residence }, (response) => {
                states = response.states_list;
                renderState();
            });
        } else {
            renderState();
        }
    };

    const attachDatePicker = () => {
        const datePickerInst = new DatePicker(fields.txt_birth_date);
        datePickerInst.hide();
        datePickerInst.show({
            minDate  : -100 * 365,
            maxDate  : (-18 * 365) - 5,
            yearRange: '-100:-18',
        });
        $(fields.txt_birth_date)
            .attr('data-value', Utility.toISOFormat(moment()))
            .change(function() {
                return Utility.dateValueChanged(this, 'date');
            });
    };

    const submit = (e) => {
        e.preventDefault();
        btn_submit.attr('disabled', 'disabled');
        if (Validation.validate(form_selector)) {
            const data = {
                new_account_real: 1,
                salutation      : $(fields.ddl_title).val(),
                first_name      : $(fields.txt_fname).val(),
                last_name       : $(fields.txt_lname).val(),
                date_of_birth   : $(fields.txt_birth_date).val(),
                residence       : $(fields.ddl_residence).val(),
                address_line_1  : $(fields.txt_address1).val(),
                address_line_2  : $(fields.txt_address2).val(),
                address_city    : $(fields.txt_city).val(),
                address_state   : $(fields.ddl_state).val() || $(fields.txt_state).val(),
                address_postcode: $(fields.txt_postcode).val(),
                phone           : $(fields.txt_phone).val(),
                secret_question : $(fields.ddl_secret_question).val(),
                secret_answer   : $(fields.txt_secret_answer).val(),
            };
            ChampionSocket.send(data, (response) => {
                if (response.error) {
                    $('#error-create-account').removeClass('hidden').text(response.error.message);
                    btn_submit.removeAttr('disabled');
                } else {
                    const acc_info = response.new_account_real;
                    Client.process_new_account(Client.get_value('email'), acc_info.client_id, acc_info.oauth_token);
                    ChampionSocket.send({ set_account_currency: 'USD ' });
                    window.location.href = default_redirect_url();
                }
            });
        }
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = ChampionNewRealAccount;
