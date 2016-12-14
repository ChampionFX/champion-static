(function() {

    var socket,
        buffered = [],
        message_callback;

    function init(callback) {
        if (typeof callback === 'function') {
            message_callback = callback;
        }
        connect();
    }

    function getAppId() {
        return localStorage.getItem('config.app_id') ? localStorage.getItem('config.app_id') : '1';
    }

    function getSocketURL() {
        var server = 'www.binaryqa14.com';
        var params = [
            'brand=champion',
            'app_id='+getAppId()
        ];

        return 'wss://'+server+'/websockets/v3'+(params.length ? '?'+params.join('&') : '');
    }

    function connect() {
        socket = new WebSocket(getSocketURL());
        socket.onopen    = onOpen;
        socket.onmessage = onMessage;

    }

    function isReady() {
        return socket && socket.readyState === 1;
    }

    function isClosed() {
        return !socket || socket.readyState === 2 || socket.readyState === 3;
    }

    function send(data) {
        if (isReady()) {
            socket.send(JSON.stringify(data));
        } else {
            buffered.push(data);
            if (isClosed()) {
                connect();
            }
        }
    }

    function onOpen() {
        if (typeof message_callback === 'function') {
            message_callback();
        }
    }

    function onMessage(message) {
        var response = JSON.parse(message.data);
        if (typeof message_callback === 'function') {
            message_callback(response);
        }
    }


    function onClose() {

    }

    window.ChampionSocket = {
        init: init,
        send: send
    }
})();