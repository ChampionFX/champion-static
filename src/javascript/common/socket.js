const Cookies     = require('../lib/js-cookie');
const getLanguage = require('./language').getLanguage;
const Client      = require('./client');
const Header      = require('./header');
const State       = require('./storage').State;

const ChampionSocket = (function() {
    'use strict';

    let socket,
        req_id = 0,
        message_callback,
        socket_resolved = false,
        socketResolve,
        socketReject;

    const buffered = [],
        registered_callbacks = {},
        priority_requests = { authorize: false, balance: false, get_settings: false, website_status: false };

    const promise = new Promise((resolve, reject) => {
        socketResolve = resolve;
        socketReject = reject;
    });

    const socketMessage = (message) => {
        if (!message) { // socket just opened
            const token = Cookies.get('token');
            if (token) {
                ChampionSocket.send({ authorize: token });
            } else {
                Header.userMenu();
            }
            ChampionSocket.send({ website_status: 1 });
        } else {
            let country_code;
            State.set(['response', message.msg_type], message);
            switch (message.msg_type) {
                case 'authorize':
                    if (message.error || message.authorize.loginid !== Client.get_value('loginid')) {
                        ChampionSocket.send({ logout: '1' });
                        socketReject();
                    } else {
                        Client.response_authorize(message);
                        ChampionSocket.send({ balance: 1, subscribe: 1 });
                        ChampionSocket.send({ get_settings: 1 });
                        Header.userMenu();
                        $('#btn_logout').click(() => { // TODO: to be moved from here
                            ChampionSocket.send({ logout: 1 });
                        });
                        priority_requests.authorize = true;
                    }
                    break;
                case 'logout':
                    Client.do_logout(message);
                    break;
                case 'balance':
                    Header.updateBalance(message);
                    priority_requests.balance = true;
                    break;
                case 'get_settings':
                    if (message.error) {
                        socketReject();
                        return;
                    }
                    country_code = message.get_settings.country_code;
                    if (country_code) {
                        Client.set_value('residence', country_code);
                        ChampionSocket.send({ landing_company: country_code });
                    }
                    priority_requests.get_settings = true;
                    break;
                case 'website_status':
                    priority_requests.website_status = true;
                // no default
            }
            if (!socket_resolved && Object.keys(priority_requests).every(c => priority_requests[c])) {
                socketResolve();
                Client.check_tnc();
                socket_resolved = true;
            }
        }
    };

    const init = (callback = socketMessage) => {
        if (typeof callback === 'function') {
            message_callback = callback;
        }
        connect();
    };

    const getAppId = () => (localStorage.getItem('config.app_id') ? localStorage.getItem('config.app_id') : '2472');

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
        if (typeof callback === 'function') {
            let msg_type = '';
            Object.keys(priority_requests).some((c) => {
                if (c in data) {
                    msg_type = c;
                    return true;
                }
                return false;
            });
            const exist_in_state = State.get(['response', msg_type]);
            if (exist_in_state) {
                callback(exist_in_state);
                return;
            }
            registered_callbacks[++req_id] = {
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
        const response = JSON.parse(message.data);
        const this_req_id = response.req_id;
        const reg = this_req_id ? registered_callbacks[this_req_id] : null;

        if (reg && typeof reg.callback === 'function') {
            reg.callback(response);
            if (!reg.subscribe) {
                delete registered_callbacks[this_req_id];
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
        promise  : promise,
    };
})();

module.exports = ChampionSocket;
