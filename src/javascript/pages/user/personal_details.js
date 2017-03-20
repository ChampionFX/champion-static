const Client           = require('../../common/client');
const ChampionSocket   = require('../../common/socket');
const Validation       = require('../../common/validation');
const moment = require('moment');
require('select2');

const PersonalDetails = (() => {
    'use strict';

    const form_selector = '#details_form';
    const hidden_class  = 'invisible';
    const editable_fields = {};

    let residence,
        get_settings_data,
        place_of_birth_value,
        tax_residence_values;

    const load = () => {
        $(form_selector).on('submit', (event) => {
            event.preventDefault();
            submitForm();
        });

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
            } else {
                $('.is-real').addClass(hidden_class);
            }
        });
    };

    const getSettingsResponse = (data) => {
        const get_settings = $.extend({}, data);
        get_settings.name  = `${get_settings.salutation} ${get_settings.first_name} ${get_settings.last_name}`;
        get_settings.date_of_birth = get_settings.date_of_birth ? moment.utc(new Date(get_settings.date_of_birth * 1000)).format('YYYY-MM-DD') : '';

        return displayGetSettingsData(get_settings);
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

        Object.keys(data).forEach((key) => {
            $key        = $(`${form_selector} #${key}`);
            $lbl_key    = $(`#${key}`);
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

    const isChanged = data => (
        Object.keys(editable_fields).some(key => (
            (key in data && editable_fields[key] !== data[key])
        ))
    );

    const populateResidence = (response) => {
        const residence_list = response.residence_list,
            $place_of_birth  = $(`${form_selector} #place_of_birth`),
            $tax_residence   = $(`${form_selector} #tax_residence`);

        if (residence_list && residence_list.length > 0) {
            let options = '';
            Object.keys(residence_list).forEach((res) => {
                const value = residence_list[res].value;
                const text  = residence_list[res].text;
                options += `<option value=${value}>${text}</option>`;
            });
            $place_of_birth.html(options);
            $('.select2').remove();
            $tax_residence.html(options).promise().done(() => {
                setTimeout(() => {
                    $tax_residence.select2()
                        .val(tax_residence_values).trigger('change')
                        .removeClass('invisible');
                }, 500);
            });
            $place_of_birth.val(place_of_birth_value || residence);
        }
    };

    const populateStates = (response) => {
        const states_list = response.states_list;
        let $address_state = $(`${form_selector} #address_state`);

        if (states_list && states_list.length > 0) {
            let option = '<option value=\'\'>Please select</option>';
            Object.keys(states_list).forEach((state) => {
                const value = states_list[state].value;
                const text  = states_list[state].text;
                option += `<option value=${value}>${text}</option>`;
            });
            $address_state.append(option);
        } else {
            $address_state.replaceWith('<input/>', { id: '#address_state'.replace('#', ''), name: 'address_state', type: 'text', maxlength: '35' });
            $address_state = $(`${form_selector} #address_state`);
        }
        $address_state.val(get_settings_data.address_state);

        Validation.init(form_selector, getValidations());
    };

    const getValidations = () => (
        [
            { selector: '#address_line_1',   validations: ['req', 'address', ['length', { min: 1, max: 70 }]] },
            { selector: '#address_line_2',   validations: ['address', ['length', { min: 0, max: 70 }]] },
            { selector: '#address_city',     validations: ['req', 'letter_symbol', ['length', { min: 1, max: 35 }]] },
            { selector: '#address_state',    validations: $('#address_state').prop('nodeName') === 'SELECT' ? '' : ['letter_symbol'] },
            { selector: '#address_postcode', validations: ['postcode', ['length', { min: 0, max: 20 }]] },
            { selector: '#phone',            validations: ['phone', ['length', { min: 6, max: 35, exclude: /^\+/ }]] },

            { selector: '#place_of_birth', validations: '' },
            { selector: '#tax_residence',  validations: '' },
            { selector: '#tax_identification_number', validations: ['postcode', ['length', { min: 0, max: 20 }]] },
        ]
    );

    const submitForm = () => {
        const $msg = $('#error-update-details');
        $msg.empty();

        if (Validation.validate(form_selector)) {
            const req = { set_settings: 1 };
            Object.keys(get_settings_data).forEach((key) => {
                const $frm_el = $(`${form_selector} #${key}`);
                if (/(SELECT|INPUT)/.test($frm_el.prop('nodeName'))) {
                    req[key] = $frm_el.val();
                    if (/tax_residence/.test(key)) {
                        req[key] = $frm_el.val().join();
                    }
                }
            });

            if (!isChanged(req)) {
                showMessage($msg, 'You did not change anything.');
                return;
            }

            ChampionSocket.send(req).then((response) => {
                const is_error = response.set_settings !== 1;
                showMessage($msg, is_error ? response.error.message : 'Your settings have been updated successfully.', !is_error);
                if (!is_error) {
                    ChampionSocket.send({ get_settings: 1 }, true).then((data) => {
                        getSettingsResponse(data.get_settings);
                    });
                }
            });
        }
    };

    const showMessage = function($msg_el, msg_text, is_success) {
        $msg_el.attr('class', is_success ? 'success-msg' : 'error-msg').css('display', 'block')
            .html(msg_text)
            .delay(5000)
            .fadeOut(1000);
    };

    const unload = () => {
        $(form_selector).off('submit', submitForm);
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = PersonalDetails;
