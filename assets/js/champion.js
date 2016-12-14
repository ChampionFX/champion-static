(function(){

    var _authenticated = false;

    var _container;
    var _signup;

    function init() {
        _container = $('#champion-container');
        _signup = $('#signup');
        _container.on('champion:before', beforeContentChange);
        _container.on('champion:after', afterContentChange);
        ChampionRouter.init(_container, '#champion-content');
    }

    function beforeContentChange() {
        ChampionSignup.hide();
        console.log('before');
    }

    function afterContentChange(e, content) {
        var tag = content.getAttribute('data-tag');
        console.log(content, tag);
        if (tag === 'create') {
            ChampionCreateaccount.show(_container);
        } else if (!_authenticated) {
            var form = _container.find('#verify-email-form');
            ChampionSignup.show(form.length ? form : _signup);
        }
        console.log('after');
    }

    function socketMessage(message) {
        if (!message) { // socket just opened
            var token = $.cookie('token');
            if (token) {
                ChampionSocket.send({authorize: token});
            }
        } else {
            switch (message.msg_type) {
                case 'authenticate':
                    break;
                case 'verify_email':
                    break;
            }
            console.log(message);
        }
    }

    $(window).on('load', init);

    ChampionSocket.init(socketMessage);

    window.Champion = {

    }

})();