(function() {

    var _active = false;

    var _element,
        _input,
        _error_empty,
        _error_email,
        _button;

    var _email_regex = /[^@]+@[^@\.]+\.[^@]+/;
    // var _email_regex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/;


    var _validate_delay = 500,
        _timeout;


    function show(element) {
        _element     = element;
        _input       = _element.find('input');
        _error_empty = _element.find('#signup_error_empty');
        _error_email = _element.find('#signup_error_email');
        _button      = _element.find('button');

        _element.removeClass('hidden');
        _input.on('input', inputChanged);
        _button.on('click', submitClicked);

        _active = true;
    }

    function hide() {
        if (_active) {
            _element.addClass('hidden');
            _input.off('input', inputChanged);
            _button.off('click', submitClicked);
            _input.val('');
            _error_empty.addClass('hidden');
            _error_email.addClass('hidden');
            if (_timeout) {
                clearTimeout(_timeout);
            }
        }
        _active = false;
    }

    function inputChanged(e) {
        if (_timeout) {
            clearTimeout(_timeout);
        }
        _timeout = setTimeout(validate, _validate_delay);

    }

    function validate() {
        var value,
            error = true;
        if (_active) {
            value = _input.val();
            _error_empty.addClass('hidden');
            _error_email.addClass('hidden');
            if (!value || value.length < 1) {
                _error_empty.removeClass('hidden');
            } else if (!_email_regex.test(value)) {
                _error_email.removeClass('hidden');
            } else {
                error = false;
            }
        }
        return !error;
    }


    function submitClicked(e) {
        e.preventDefault();
        if (_active && validate()) {
            ChampionSocket.send({
                verify_email: _input.val(),
                type: 'account_opening'
            }, function(response) {
                if (response.verify_email) {
                    var lang = localStorage.getItem('lang'),
                        a = document.createElement('a');
                    a.setAttribute('href', '/' + lang + '/createaccount');
                    ChampionRouter.forward(a.href);
                }
            });
        }
    }

    window.ChampionSignup = {
        show: show,
        hide: hide
    }
})();