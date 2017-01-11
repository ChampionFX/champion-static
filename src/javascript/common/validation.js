const Validation = (function() {
    'use strict';

    const forms = {};
    const error_class  = 'error-msg';
    const hidden_class = 'hidden';

    const events_map = {
        input : 'input',
        select: 'change',
    };

    const initForm = (form_selector, fields) => {
        const $form = $(`${form_selector}:visible`);
        if ($form.length && Array.isArray(fields) && fields.length) {
            forms[form_selector] = { fields: fields, $form: $form };
            fields.forEach((field) => {
                field.$ = $form.find(field.selector);
                if (!field.$.length) return;

                if (field.msg_element) {
                    field.$error = $form.find(field.msg_element);
                } else {
                    const $parent = field.$.parent();
                    if ($parent.find(`div.${error_class}`).length === 0) {
                        $parent.append($('<div/>', { class: `${error_class} ${hidden_class}` }));
                    }
                    field.$error = $parent.find(`.${error_class}`);
                }

                const event = events_map[field.$.get(0).localName];
                field.$.unbind(event).on(event, () => {
                    checkField(field);
                });
            });
        }
    };

    // ------------------------------
    // ----- Validation Methods -----
    // ------------------------------
    const validRequired = value => value.length;

    const validEmail = value => /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/.test(value);

    const validPassword = value => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]+/.test(value);

    const validLength = (value, options) => (
        (options.min ? value.length >= options.min : true) &&
        (options.max ? value.length <= options.max : true)
    );

    const validCompare = (value, options) => value === $(options.to).val();

    const validators_map = {
        req     : { func: validRequired, message: 'This field is required' },
        email   : { func: validEmail,    message: 'Invalid email address' },
        password: { func: validPassword, message: 'Password should have lower and uppercase letters with numbers.' },
        length  : { func: validLength,   message: 'You should enter [_1] characters.' },
        compare : { func: validCompare,  message: 'The two passwords that you entered do not match.' },
    };

    const pass_length = { min: 6, max: 25 };

    // --------------------
    // ----- Validate -----
    // --------------------
    const checkField = (field) => {
        let all_is_ok = true,
            message;

        field.validations.some((valid) => {
            let type,
                options = {};

            if (typeof valid === 'string') {
                type = valid;
            } else {
                type    = valid[0];
                options = valid[1];
            }

            if (type === 'password' && !validLength(field.$.val(), pass_length)) {
                field.is_ok = false;
                type = 'length';
                options = pass_length;
            } else {
                const validator = validators_map[type].func;
                field.is_ok = validator(field.$.val(), options);
            }

            if (!field.is_ok) {
                message = options.message || validators_map[type].message;
                if (type === 'length') {
                    message = message.replace('[_1]', options.min === options.max ? options.min : `${options.min}-${options.max}`);
                }
                all_is_ok = false;
                return true;
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
        form.is_ok = true;
        form.fields.forEach((field) => { if (!checkField(field)) form.is_ok = false; });
        return form.is_ok;
    };

    return {
        init    : initForm,
        validate: validate,
    };
})();

module.exports = Validation;
