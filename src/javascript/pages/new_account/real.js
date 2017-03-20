const moment               = require('moment');
const ChampionSocket       = require('../../common/socket');
const Client               = require('../../common/client');
const Utility              = require('../../common/utility');
const default_redirect_url = require('../../common/url').default_redirect_url;
const Validation           = require('../../common/validation');
const DatePicker           = require('../../components/date_picker').DatePicker;

const ChampionNewRealAccount = (function() {
    'use strict';

    const form_selector = '#frm_new_account_real';

    let client_residence;

    let container,
        btn_submit,
        datePickerInst;

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
        if (Client.has_real()) {
            window.location.href = default_redirect_url();
            return;
        }

        container        = $('#champion-container');
        client_residence = Client.get('residence');
        populateResidence();
        populateState();
        attachDatePicker();

        btn_submit = container.find(fields.btn_submit);
        btn_submit.on('click dblclick', submit);
    };

    const unload = () => {
        if (btn_submit) {
            btn_submit.off('click', submit);
        }
        if (datePickerInst) {
            datePickerInst.hide();
        }
    };

    const initValidation = () => {
        Validation.init(form_selector, [
            { selector: fields.txt_fname,           validations: ['req', 'letter_symbol', ['min', { min: 2 }]] },
            { selector: fields.txt_lname,           validations: ['req', 'letter_symbol', ['min', { min: 2 }]] },
            { selector: fields.txt_birth_date,      validations: ['req'] },
            { selector: fields.ddl_residence,       validations: ['req'] },
            { selector: fields.txt_address1,        validations: ['req', 'general'] },
            { selector: fields.txt_address2,        validations: ['general'] },
            { selector: fields.txt_city,            validations: ['req', 'letter_symbol'] },
            { selector: fields.txt_state,           validations: ['letter_symbol'] },
            { selector: fields.txt_postcode,        validations: ['postcode'] },
            { selector: fields.txt_phone,           validations: ['req', 'phone', ['min', { min: 6 }]] },
            { selector: fields.ddl_secret_question, validations: ['req'] },
            { selector: fields.txt_secret_answer,   validations: ['req', ['min', { min: 4 }]] },
            { selector: fields.chk_tnc,             validations: ['req'] },
        ]);
    };

    const populateResidence = () => {
        ChampionSocket.send({ residence_list: 1 }).then((response) => {
            const $ddl_residence = container.find(fields.ddl_residence);
            Utility.dropDownFromObject($ddl_residence, response.residence_list, client_residence);
            container.find('#residence_loading').remove();
            $ddl_residence.removeClass('hidden');
            const country_obj = response.residence_list.find(r => r.value === client_residence);
            if (country_obj && country_obj.phone_idd) {
                $(fields.txt_phone).val(`+${country_obj.phone_idd}`);
            }
        });
    };

    const populateState = () => {
        ChampionSocket.send({ states_list: client_residence }).then((response) => {
            const $ddl_state = container.find(fields.ddl_state);
            const states = response.states_list;
            container.find('#state_loading').remove();
            if (states && states.length) {
                Utility.dropDownFromObject($ddl_state, states);
                $ddl_state.removeClass('hidden');
            } else {
                $ddl_state.replaceWith($('<input/>', { type: 'text', id: fields.txt_state.replace('#', ''), class: 'text', maxlength: '35' }));
            }
            initValidation();
        });
    };

    const attachDatePicker = () => {
        datePickerInst = new DatePicker(fields.txt_birth_date);
        datePickerInst.show({
            minDate  : -100 * 365,
            maxDate  : (-18 * 365) - 5,
            yearRange: '-100:-18',
        });
        $(fields.txt_birth_date)
            .attr('data-value', Utility.toISOFormat(moment()))
            .change(function() {
                return Utility.dateValueChanged(this, 'date');
            })
            .val('');
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
            if (Client.get('affiliate_token')) {
                data.affiliate_token = Client.get('affiliate_token');
            }
            ChampionSocket.send(data).then((response) => {
                if (response.error) {
                    $('#msg_form').removeClass('hidden').text(response.error.message);
                    btn_submit.removeAttr('disabled');
                } else {
                    const acc_info = response.new_account_real;
                    Client.process_new_account(Client.get('email'), acc_info.client_id, acc_info.oauth_token);
                    window.location.href = default_redirect_url();
                }
            });
        } else {
            btn_submit.removeAttr('disabled');
        }
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = ChampionNewRealAccount;
