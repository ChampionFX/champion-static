(function() {
    var _passwd_regex = /(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])/;
    var _code_regex = /.{48}/;

    var _input_code,
        _input_pass,
        _input_rpass,
        _input_country,
        _submit_btn;

    var _code_error,
        _pass_error_short,
        _pass_error_char,
        _pass_error_nomatch;

    function show(container) {
        _input_code    = container.find('#verification-code');
        _input_pass    = container.find('#password');
        _input_rpass   = container.find('#r-password');
        _input_country = container.find('#residence');
        _submit_btn    = container.find('#btn-submit');

        _code_error         = container.find('#error-code');
        _pass_error_short   = container.find('#error-pass-short');
        _pass_error_char    = container.find('#error-pass-char');
        _pass_error_nomatch = container.find('#error-pass-nomatch');

        _input_code.on('input', validateCode);
        _input_pass.on('input', validatePass);
        _input_rpass.on('input', validateRpass);
        _submit_btn.on('click', validateRpass);
    }

    function hide() {

    }

    function validateCode() {
        var value = _input_code.val();

        _code_error.addClass('hidden');
        if (value.length < 48) {
            _code_error.removeClass('hidden');
            return false;
        }
        return true;
    }

    function validatePass() {
        var value = _input_pass.val();

        _pass_error_short.addClass('hidden');
        _pass_error_char.addClass('hidden');

        if (value.length < 6) {
            _pass_error_short.removeClass('hidden');
            return false;
        } else if (!_passwd_regex.test(value)) {
            _pass_error_char.removeClass('hidden');
            return false;
        }

        return true;
    }

    function validateRpass() {

    }

    function validateAll() {

    }

    window.ChampionCreateaccount = {
        show: show,
        hide: hide
    }
})();