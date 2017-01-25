const Cookies     = require('../lib/js-cookie');
const getLanguage = require('./language').getLanguage;
const Client      = require('./client');
const Header      = require('./header');
const State       = require('./storage').State;

const ChampionSocket = (function() {
    'use strict';

    let socket,
        req_id = 0,
        promise,
        message_callback,
        keep_alive_timeout,
        socket_resolved,
        socketResolve,
        socketReject;

    const buffered = [];
    const registered_callbacks = {};
    const priority_requests = {
        authorize         : false,
        get_settings      : false,
        website_status    : false,
        get_account_status: false,
    };
    const no_duplicate_requests = ['get_account_status', 'get_financial_assessment'];

    const initPromise = () => {
        socket_resolved = false;
        promise = promise || new Promise((resolve, reject) => {
            socketResolve = resolve;
            socketReject  = reject;
        });
    };

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
            switch (message.msg_type) {
                case 'authorize':
                    if (message.error || message.authorize.loginid !== Client.get('loginid')) {
                        ChampionSocket.send({ logout: '1' });
                        socketReject();
                    } else {
                        Client.response_authorize(message);
                        ChampionSocket.send({ balance: 1, subscribe: 1 });
                        ChampionSocket.send({ get_settings: 1 });
                        ChampionSocket.send({ get_account_status: 1 });
                        const country_code = message.authorize.country;
                        if (country_code) {
                            Client.set('residence', country_code);
                            ChampionSocket.send({ landing_company: country_code });
                        }
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
                    break;
                case 'get_settings':
                    if (message.error) {
                        socketReject();
                        return;
                    }
                    priority_requests.get_settings = true;
                    break;
                case 'website_status':
                    priority_requests.website_status = true;
                    break;
                case 'get_account_status':
                    priority_requests.get_account_status = true;
                    if (message.get_account_status && message.get_account_status.risk_classification === 'high') {
                        priority_requests.get_financial_assessment = false;
                        ChampionSocket.send({ get_financial_assessment: 1 });
                    }
                    break;
                case 'get_financial_assessment':
                    priority_requests.get_financial_assessment = true;
                    break;
                // no default
            }
            if (!socket_resolved && Object.keys(priority_requests).every(c => priority_requests[c])) {
                socketResolve();
                Client.check_tnc();
                socket_resolved = true;
            }

            clearTimeout(keep_alive_timeout);
            keep_alive_timeout = setTimeout(() => {
                send({ ping: 1 });
            }, 60000);
        }
    };

    const init = (callback = socketMessage) => {
        if (typeof callback === 'function') {
            message_callback = callback;
        }
        connect();
    };

    const getAppId = () => (localStorage.getItem('config.app_id') ? localStorage.getItem('config.app_id') :
        (/^\/beta\//i.test(window.location.pathname) ? '2586' : '2472'));

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

    const isReady = () => (socket && socket.readyState === 1);

    const isClosed = () => (!socket || socket.readyState === 2 || socket.readyState === 3);

    const send = (data, callback, subscribe) => {
        if (typeof callback === 'function') {
            const msg_type = Object.keys(priority_requests)
                .concat(no_duplicate_requests)
                .find(c => c in data);
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

    const waiting_list = {
        items: {},
        add  : (msg_type, promise_obj) => {
            if (!waiting_list.items[msg_type]) {
                waiting_list.items[msg_type] = [];
            }
            waiting_list.items[msg_type].push(promise_obj);
        },
        resolve: (response) => {
            const msg_type = response.msg_type;
            const promises = waiting_list.items[msg_type];
            if (promises && promises.length) {
                promises.forEach((pr) => {
                    if (!waiting_list.another_exists(pr, msg_type)) {
                        pr.resolve(response);
                    }
                });
                waiting_list.items[msg_type] = [];
            }
        },
        another_exists: (pr, msg_type) => (
            Object.keys(waiting_list.items)
                .some(type => (
                    type !== msg_type &&
                    $.inArray(pr, waiting_list.items[type]) >= 0
                ))
        ),
    };
    class PromiseClass {
        constructor() {
            this.promise = new Promise((resolve, reject) => {
                this.reject = reject;
                this.resolve = resolve;
            });
        }
    }
    const wait = (...msg_types) => {
        const promise_obj = new PromiseClass();
        let is_resolved = true;
        msg_types.forEach((msg_type) => {
            const prev_response = State.get(['response', msg_type]);
            if (!prev_response) {
                waiting_list.add(msg_type, promise_obj);
                is_resolved = false;
            } else if (msg_types.length === 1) {
                promise_obj.resolve(prev_response);
            }
        });
        if (is_resolved) {
            promise_obj.resolve();
        }
        return promise_obj.promise;
    };

    const onClose = () => {
        promise = undefined;
        clearTimeout(keep_alive_timeout);
    };

    const onOpen = () => {
        if (typeof message_callback === 'function') {
            message_callback();
        }
        if (isReady()) {
            promise.then(() => {
                while (buffered.length > 0) {
                    send(buffered.shift());
                }
            });
        }
    };

    const onMessage = (message) => {
        const response = JSON.parse(message.data);
        State.set(['response', response.msg_type], response);
        waiting_list.resolve(response);
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

    const connect   = () => {
        initPromise();
        Object.keys(priority_requests).forEach((key) => { priority_requests[key] = false; });

        socket = new WebSocket(getSocketURL());
        socket.onopen    = onOpen;
        socket.onclose   = onClose;
        socket.onmessage = onMessage;
    };

    return {
        init     : init,
        send     : send,
        wait     : wait,
        getAppId : getAppId,
        getServer: getServer,
        promise  : () => promise,
    };
})();

module.exports = ChampionSocket;
