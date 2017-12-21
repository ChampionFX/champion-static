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
    const hidden_class  = 'invisible';

    let client_residence;

    let $container,
        btn_submit,
        datePickerInst;

    const fields = {
        ddl_title          : '#ddl_title',
        txt_fname          : '#txt_fname',
        txt_lname          : '#txt_lname',
        txt_birth_date     : '#txt_birth_date',
        lbl_residence      : '#lbl_residence',
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
        chk_not_pep        : '#chk_not_pep',
        chk_tnc            : '#chk_tnc',
        btn_submit         : '#btn_submit',
        ddl_opening_reason : '#ddl_opening_reason',
    };

    const load = () => {
        if (Client.has_real()) {
            window.location.href = default_redirect_url();
            return;
        }

        $container       = $('#champion-container');
        client_residence = Client.get('residence');

        toggleForm();
        displayResidence();
        attachDatePicker();

        btn_submit = $container.find(fields.btn_submit);
        btn_submit.on('click dblclick', submit);
    };

    const hasResidence = () => Client.get('residence');

    const unload = () => {
        if (btn_submit) {
            btn_submit.off('click', submit);
        }
        if (datePickerInst) {
            datePickerInst.hide();
        }
    };

    const toggleForm = (is_upgrade = hasResidence()) => {
        $container.find('.hide-upgrade')[is_upgrade ? 'addClass' : 'removeClass'](hidden_class);
        $container.find('.show-upgrade')[is_upgrade ? 'removeClass' : 'addClass'](hidden_class);
    };

    const initValidation = () => {
        const validations = [
            { selector: fields.txt_fname,           validations: ['req', 'letter_symbol', ['min', { min: 2 }]] },
            { selector: fields.txt_lname,           validations: ['req', 'letter_symbol', ['min', { min: 2 }]] },
            { selector: fields.txt_birth_date,      validations: ['req'] },
            { selector: fields.txt_address1,        validations: ['req', 'address', ['length', { min: 1, max: 70 }]] },
            { selector: fields.txt_address2,        validations: ['address', ['length', { min: 0, max: 70 }]] },
            { selector: fields.txt_city,            validations: ['req', 'letter_symbol', ['length', { min: 1, max: 35 }]] },
            { selector: fields.txt_state,           validations: ['letter_symbol'] },
            { selector: fields.txt_postcode,        validations: ['postcode', ['length', { min: 0, max: 20 }]] },
            { selector: fields.txt_phone,           validations: ['req', 'phone', ['length', { min: 6, max: 35, exclude: /^\+/ }]] },
            { selector: fields.ddl_secret_question, validations: ['req'] },
            { selector: fields.txt_secret_answer,   validations: ['req', 'general', ['length', { min: 4, max: 50 }]] },
            { selector: fields.chk_tnc,             validations: ['req'] },
            { selector: fields.chk_not_pep,         validations: ['req'] },
            { selector: fields.ddl_opening_reason,  validations: ['req'] },
        ];
        if (!hasResidence()) {
            validations.push(
                { selector: fields.ddl_residence,         validations: ['req'] });
        }

        Validation.init(form_selector, validations);
    };

    const displayResidence = () => {
        ChampionSocket.send({ residence_list: 1 }).then((response) => {
            $container.find('#ddl_residence_loading, #lbl_residence_loading').remove();
            if (hasResidence()) {
                $container.find(fields.lbl_residence).text(setPhoneIdd(client_residence).text)
                    .parent().removeClass(hidden_class);
                populateState();
            } else {
                const $ddl_residence = $container.find(fields.ddl_residence);
                Utility.dropDownFromObject($ddl_residence, response.residence_list);
                $ddl_residence[0].addEventListener('change', residenceOnChange); // jQuery .on('change') doesn't work
                residenceOnChange();
                $ddl_residence.removeClass(hidden_class);
            }
        });
    };

    const residenceOnChange = () => {
        client_residence = $container.find(fields.ddl_residence).val();
        setPhoneIdd(client_residence);
        populateState(client_residence);
    };

    const setPhoneIdd = (country) => {
        const country_obj = State.get(['response', 'residence_list']).residence_list.find(r => r.value === country);
        $(fields.txt_phone).val(country_obj && country_obj.phone_idd ? `+${country_obj.phone_idd}` : '');
        return country_obj;
    };

    const populateState = (country = client_residence) => {
        ChampionSocket.send({ states_list: country }).then((response) => {
            const $ddl_state = $container.find(fields.ddl_state).length ?
                $container.find(fields.ddl_state) : $container.find(fields.txt_state);
            const states = response.states_list;
            $container.find('#state_loading').remove();
            if (states && states.length) {
                if (/INPUT/.test($ddl_state[0].nodeName)) {
                    $ddl_state.replaceWith($('<select/>', { id: fields.txt_state.replace('#', '') }));
                    populateState(country);
                }
                Utility.dropDownFromObject($ddl_state, states);
                $ddl_state.removeClass(hidden_class);
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
        if (!hasResidence()) {
            setResidence();
        }
        if (Validation.validate(form_selector)) {
            const data = {
                new_account_real      : 1,
                salutation            : $(fields.ddl_title).val(),
                first_name            : $(fields.txt_fname).val(),
                last_name             : $(fields.txt_lname).val(),
                date_of_birth         : $(fields.txt_birth_date).val(),
                residence             : client_residence,
                address_line_1        : $(fields.txt_address1).val(),
                address_line_2        : $(fields.txt_address2).val(),
                address_city          : $(fields.txt_city).val(),
                address_state         : $(fields.ddl_state).val() || $(fields.txt_state).val(),
                address_postcode      : $(fields.txt_postcode).val(),
                phone                 : $(fields.txt_phone).val(),
                secret_question       : $(fields.ddl_secret_question).val(),
                secret_answer         : $(fields.txt_secret_answer).val(),
                account_opening_reason: $(fields.ddl_opening_reason).val(),
            };
            if (Client.get('affiliate_token')) {
                data.affiliate_token = Client.get('affiliate_token');
            }
            ChampionSocket.send(data).then((response) => {
                if (response.error) {
                    $('#msg_form').removeClass(hidden_class).text(response.error.message);
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

    const setResidence = () => {
        const req = {
            set_settings: 1,
            residence   : client_residence,
        };
        ChampionSocket.send(req).then((response) => {
            if (response.error) {
                $('#msg_form').removeClass(hidden_class).text(response.error.message);
                btn_submit.removeAttr('disabled');
            }
        });
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = ChampionNewRealAccount;
