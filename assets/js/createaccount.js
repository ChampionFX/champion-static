(function() {
    var _passwd_regex = /(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])/;
    var _code_regex = /.{48}/;

    var _residences = null;

    var _active = false;

    var _input_code,
        _input_pass,
        _input_rpass,
        _input_country,
        _submit_btn,
        _input_residence;

    var _code_error,
        _pass_error_short,
        _pass_error_char,
        _pass_error_nomatch,
        _create_acc_error;

    function show(container) {
        _input_code      = container.find('#verification-code');
        _input_pass      = container.find('#password');
        _input_rpass     = container.find('#r-password');
        _input_country   = container.find('#residence');
        _input_residence = container.find('#residence');
        _submit_btn      = container.find('#btn-submit');

        _code_error         = container.find('#error-code');
        _pass_error_short   = container.find('#error-pass-short');
        _pass_error_char    = container.find('#error-pass-char');
        _pass_error_nomatch = container.find('#error-pass-nomatch');
        _create_acc_error   = container.find('#error-create-account');

        _input_code.on('input', validateCode);
        _input_pass.on('input', validatePass);
        _input_rpass.on('input', validateRpass);
        _submit_btn.on('click', submit);

        if (!_residences) {
            ChampionSocket.send({residence_list: 1}, function(response) {
                _residences = response.residence_list;
                renderResidences();
            });
        } else {
            renderResidences();
        }
        _active = true;
    }

    function renderResidences() {
        _input_residence.empty();
        _residences.forEach(function(res) {
            var option = $('<option></option>');
            option.text(res.text);
            option.attr('value', res.value);
            if (res.disabled) {
                option.attr('disabled', '1');
            }
            _input_residence.append(option);
        });
    }

    function hide() {
        _input_code.off('input', validateCode);
        _input_pass.off('input', validatePass);
        _input_rpass.off('input', validateRpass);
        _submit_btn.off('click', submit);

        _code_error.addClass('hidden');
        _pass_error_short.addClass('hidden');
        _pass_error_char.addClass('hidden');
        _pass_error_nomatch.addClass('hidden');
        _create_acc_error.addClass('hidden');

        _input_code.val('');
        _input_pass.val('');
        _input_rpass.val('');
        _input_country.val('');
        _input_residence.empty();
        _active = false;
    }

    function validateCode() {
        var value = _input_code.val();

        _create_acc_error.addClass('hidden');
        _code_error.addClass('hidden');
        if (value.length < 48) {
            _code_error.removeClass('hidden');
            return false;
        }
        return true;
    }

    function validatePass() {
        var value = _input_pass.val();

        _create_acc_error.addClass('hidden');
        _pass_error_short.addClass('hidden');
        _pass_error_char.addClass('hidden');

        if (value.length < 6) {
            _pass_error_short.removeClass('hidden');
            return false;
        } else if (!_passwd_regex.test(value)) {
            _pass_error_char.removeClass('hidden');
            return false;
        }

        validateRpass();

        return true;
    }

    function validateRpass() {
        _pass_error_nomatch.addClass('hidden');
        if (_input_pass.val() !== _input_rpass.val()) {
            _pass_error_nomatch.removeClass('hidden')
            return false;
        }
        return true;
    }

    function submit() {
        if (_active && validateCode() && validatePass()) {
            var data = {
                new_account_virtual: 1,
                verification_code  : _input_code.val(),
                client_password    : _input_pass.val(),
                residence          : _input_residence.val()
            };
            ChampionSocket.send(data, function(response) {
                console.log(response);
                if (response.error) {
                    _create_acc_error.removeClass('hidden').text(response.error.message);
                }
            });
        }
    }

    window.ChampionCreateaccount = {
        show: show,
        hide: hide
    }
})();