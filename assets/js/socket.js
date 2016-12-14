(function() {

    var socket,
        buffered = [],
        message_callback,
        registered_callbacks = {};

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

    function send(data, callback, subscribe) {
        var req_id;

        if (typeof callback === 'function') {
            req_id = new Date().getTime();
            registered_callbacks[req_id] = {
                callback: callback,
                subscribe: subscribe
            };
            data.req_id = req_id;
        }

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
        if (isReady()) {
            while (buffered.length > 0) {
                send(buffered.shift());
            }
        }
    }

    function onMessage(message) {
        var response = JSON.parse(message.data),
            req_id = response.req_id,
            reg =  req_id ? registered_callbacks[req_id] : null;

        if (reg && typeof reg.callback === 'function') {
            reg.callback(response);
            if (!reg.subscribe) {
                delete registered_callbacks[req_id];
            }
        } else if (typeof message_callback === 'function') {
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