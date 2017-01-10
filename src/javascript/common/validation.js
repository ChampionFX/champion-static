const Validation = (function() {
    'use strict';

    const forms = {};
    const error_class  = 'errorfield';
    const hidden_class = 'hidden';

    const events_map = {
        input : 'input',
        select: 'change',
    };

    const initForm = (form_selector, fields) => {
        const $form = $(`${form_selector}:visible`);
        if ($form.length && Array.isArray(fields) && fields.length) {
            forms[form_selector] = { fields: fields };
            fields.forEach((field) => {
                field.$ = $form.find(field.selector);
                if (!field.$.length) return;

                if (field.msg_element) {
                    field.$error = $form.find(field.msg_element);
                } else {
                    field.$.parent().append($('<p/>', { class: `${error_class} ${hidden_class}` }));
                    field.$error = field.$.parent().find(`.${error_class}`);
                }

                const event = events_map[field.$.get(0).localName];
                field.$.on(event, () => {
                    checkField(field);
                });
            });
        }
    };

    // ------------------------------
    // ----- Validation Methods -----
    // ------------------------------
    const validReq = field => field.$.val().length;

    const validEmail = field => /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/.test(field.$.val());

    const validators_map = {
        req  : { func: validReq,   message: 'This field is required' },
        email: { func: validEmail, message: 'Invalid email address' },
    };

    // --------------------
    // ----- Validate -----
    // --------------------
    const checkField = (field) => {
        let all_is_ok = true,
            validator,
            message;

        field.validations.some((valid) => {
            if (typeof valid === 'string') {
                validator = validators_map[valid].func;
            }
            if (validator) {
                field.is_ok = validator(field);
                if (!field.is_ok) {
                    message = validators_map[valid].message;
                    all_is_ok = false;
                    return true;
                }
            }
            return false;
        });

        if (!all_is_ok) {
            showError(field, message);
        } else {
            clearError(field);
        }

        return all_is_ok;
    };

    const clearError = (field) => {
        field.$error.addClass(hidden_class);
    };

    const showError = (field, message) => {
        clearError(field);
        field.$error.text(message).removeClass(hidden_class);
    };

    const validate = (form_selector) => {
        const form = forms[form_selector];
        form.is_ok = form.fields.every(field => checkField(field));
        return form.is_ok;
    };

    return {
        init    : initForm,
        validate: validate,
    };
})();

module.exports = Validation;
