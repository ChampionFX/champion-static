const Cookies     = require('../lib/js-cookie');
const getLanguage = require('./language').getLanguage;
const Client      = require('./client');

const ChampionSocket = (function() {
    'use strict';

    let socket,
        message_callback;

    const buffered = [],
        registered_callbacks = {};

    const socketMessage = (message) => {
        if (!message) { // socket just opened
            const token = Cookies.get('token');
            if (token) {
                ChampionSocket.send({ authorize: token });
            }
            ChampionSocket.send({ website_status: 1 });
        } else {
            switch (message.msg_type) {
                case 'authorize':
                    if (message.error || message.authorize.loginid !== Client.get_value('loginid')) {
                        ChampionSocket.send({ logout: '1' });
                    } else {
                        Client.response_authorize(message);
                    }
                    break;
                // no default
            }
            console.log(message);
        }
    };

    const init = (callback = socketMessage) => {
        if (typeof callback === 'function') {
            message_callback = callback;
        }
        connect();
    };

    const getAppId = () => (localStorage.getItem('config.app_id') ? localStorage.getItem('config.app_id') : '1');

    const getServer = () => (localStorage.getItem('config.server_url') || 'ws.binaryws.com');

    const getSocketURL = () => {
        const server = getServer();
        const params = [
            'brand=champion',
            `app_id=${getAppId()}`,
            `l=${getLanguage()}`,
        ];

        return `wss://${server}/websockets/v3${params.length ? `?${params.join('&')}` : ''}`;
    };

    const connect = () => {
        socket = new WebSocket(getSocketURL());
        socket.onopen    = onOpen;
        socket.onmessage = onMessage;
    };

    const isReady = () => (socket && socket.readyState === 1);

    const isClosed = () => (!socket || socket.readyState === 2 || socket.readyState === 3);

    const send = (data, callback, subscribe) => {
        let req_id;

        if (typeof callback === 'function') {
            req_id = new Date().getTime();
            registered_callbacks[req_id] = {
                callback : callback,
                subscribe: subscribe,
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
    };

    const onOpen = () => {
        if (typeof message_callback === 'function') {
            message_callback();
        }
        if (isReady()) {
            while (buffered.length > 0) {
                send(buffered.shift());
            }
        }
    };

    const onMessage = (message) => {
        const response = JSON.parse(message.data),
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
    };

    return {
        init     : init,
        send     : send,
        getAppId : getAppId,
        getServer: getServer,
    };
})();

module.exports = ChampionSocket;
