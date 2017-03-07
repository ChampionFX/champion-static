const moment         = require('moment');
require('select2');

const Client         = require('../../common/client');
const ChampionSocket = require('../../common/socket');
const Validation     = require('../../common/validation');

const Details = (() => {
    'use strict';

    let residence,
        get_settings_data,
        place_of_birth_value,
        tax_residence_values;

    const form_selector = '#frm_personal_details',
        editable_fields = {};

    const load = () => {
        $(form_selector).on('submit', onSubmit);
        ChampionSocket.send({ get_settings: 1 }).then((response) => {
            get_settings_data = response.get_settings;
            residence = response.get_settings.country_code;

            getSettingsResponse(get_settings_data);

            if (!Client.is_virtual()) {
                ChampionSocket.send({ residence_list: 1 }).then((residence_list_response) => {
                    populateResidence(residence_list_response);
                });
                if (residence) {
                    ChampionSocket.send({ states_list: residence }).then((states_list_response) => {
                        populateStates(states_list_response);
                    });
                }
            } else $('.fx-real-acc').addClass('hidden');
        });
    };

    const getSettingsResponse = (data) => {
        const get_settings = $.extend({}, data);
        get_settings.name  = `${get_settings.salutation} ${get_settings.first_name} ${get_settings.last_name}`;
        get_settings.date_of_birth = get_settings.date_of_birth ? moment.utc(new Date(get_settings.date_of_birth * 1000)).format('YYYY-MM-DD') : '';

        displayGetSettingsData(get_settings);
    };

    const displayGetSettingsData = (data, populate = true) => {
        if (data.tax_residence) {
            tax_residence_values = data.tax_residence.split(',');
        }
        if (data.place_of_birth) {
            place_of_birth_value = data.place_of_birth;
        }

        let $key,
            $lbl_key,
            data_key,
            has_key,
            has_lbl_key;

        $.each(data, (key) => {
            $key        = $(`${form_selector} #${key}`);
            $lbl_key    = $(`#txt_${key}`);
            has_key     = $key.length > 0;
            has_lbl_key = $lbl_key.length > 0;

            $key = has_key && has_lbl_key ? $key : (has_key ? $key : $lbl_key);
            if ($key.length > 0) {
                data_key = data[key] || '';
                editable_fields[key] = data_key;
                if (populate) {
                    if ($key.is(':checkbox')) {
                        $key.prop('checked', !!data_key);
                    } else if (/(SELECT|INPUT)/.test($key.prop('nodeName'))) {
                        $key.val(data_key.split(',')).trigger('change');
                    } else {
                        $key.text(data_key || '-');
                    }
                }
            }
        });
    };

    const populateResidence = (response) => {
        const residence_list = response.residence_list,
            $place_of_birth  = $(`${form_selector} #place_of_birth`),
            $tax_residence   = $(`${form_selector} #tax_residence`);

        if (residence_list && residence_list.length > 0) {
            $.each(residence_list, (idx) => {
                $place_of_birth.append($('<option/>', { value: residence_list[idx].value, text: residence_list[idx].text }));
                $tax_residence.append($('<option/>', { value: residence_list[idx].value, text: residence_list[idx].text }));
            });
            $place_of_birth.val(place_of_birth_value || residence);
        }

        $tax_residence.select2()
            .val(tax_residence_values).trigger('change')
            .removeClass('invisible');
    };

    const populateStates = (response) => {
        const states_list = response.states_list,
            $address_state = $(`${form_selector} #address_state`);

        if (states_list && states_list.length > 0) {
            $address_state.append($('<option/>', { value: '', text: 'Please select' }));
            $.each(states_list, (idx) => {
                $address_state.append($('<option/>', { value: states_list[idx].value, text: states_list[idx].text }));
            });
        } else {
            $address_state.replaceWith('<input/>', { id: '#address_state'.replace('#', ''), name: 'address_state', type: 'text', maxlength: '35' });
        }

        Validation.init(form_selector, getValidations());
    };

    const getValidations = () => {
        let validations = [];

        validations = [
            { selector: '#address_line_1',   validations: ['req', 'general'] },
            { selector: '#address_line_2',   validations: ['general'] },
            { selector: '#address_city',     validations: ['req', 'letter_symbol'] },
            { selector: '#address_state',    validations: $('#address_state').prop('nodeName') === 'SELECT' ? '' : ['letter_symbol'] },
            { selector: '#address_postcode', validations: ['postcode', ['length', { min: 0, max: 20 }]] },
            { selector: '#phone',            validations: ['phone', ['length', { min: 6, max: 35 }]] },

            { selector: '#place_of_birth', validations: '' },
            { selector: '#tax_residence',  validations: '' },
        ];
        const tax_id_validation = { selector: '#tax_identification_number',  validations: ['postcode', ['length', { min: 0, max: 20 }]] };
        // if (Client.is_financial()) {
        //     tax_id_validation.validations[1][1].min = 1;
        //     tax_id_validation.validations.unshift('req');
        // }
        validations.push(tax_id_validation);

        return validations;
    };

    const onSubmit = (e) => {
        e.preventDefault();

        if (Validation.validate(form_selector)) {
            const req = { set_settings: 1 };
            $.each(get_settings_data, (key) => {
                const $frm_el = $(`${form_selector} #${key}`);
                if (/(SELECT|INPUT)/.test($frm_el.prop('nodeName'))) {
                    req[key] = $frm_el.val();
                }
            });

            ChampionSocket.send(req).then((response) => {
                if (response.error) {
                    $('#error-update-details').removeClass('hidden').html(response.error.message);
                } else {
                    $('#error-update-details').removeClass('hidden').html('Success');
                }
            });
        }
    };

    const unload = () => { $(form_selector).off('submit', onSubmit); };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = Details;
