const Cookies     = require('../lib/js-cookie');
const getLanguage = require('./language').getLanguage;
const State       = require('./storage').State;

const ChampionSocket = (function() {
    'use strict';

    let socket,
        req_id = 0,
        client_is_logged_in,
        keep_alive_timeout;

    const buffered = [];
    const registered_callbacks = {};
    const no_duplicate_requests = [
        'authorize',
        'get_account_status',
        'get_financial_assessment',
        'get_settings',
        'residence_list',
        'website_status',
        'get_self_exclusion',
    ];
    const default_calls = {};

    const init = (defaults, is_logged_in) => {
        $.extend(default_calls, defaults);
        client_is_logged_in = is_logged_in;
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

    class PromiseClass {
        constructor() {
            this.promise = new Promise((resolve, reject) => {
                this.reject = reject;
                this.resolve = resolve;
            });
        }
    }

    const send = (data, force_send, promise_obj = new PromiseClass()) => {
        const msg_type = no_duplicate_requests.find(c => c in data);

        if (!force_send && msg_type) {
            const exist_in_state = State.get(['response', msg_type]);
            if (exist_in_state) {
                promise_obj.resolve(exist_in_state);
                return promise_obj.promise;
            }
        }

        registered_callbacks[++req_id] = {
            callback : (response) => { promise_obj.resolve(response); },
            subscribe: !!data.subscribe,
        };

        data.req_id = req_id;

        if (isReady()) {
            socket.send(JSON.stringify(data));
        } else {
            buffered.push({ request: data, promise: promise_obj });
            if (isClosed()) {
                connect();
            }
        }

        return promise_obj.promise;
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
    const wait = (...msg_types) => {
        const promise_obj = new PromiseClass();
        let is_resolved = true;
        msg_types.forEach((msg_type) => {
            const prev_response = State.get(['response', msg_type]);
            if (!prev_response) {
                if (msg_type !== 'authorize' || client_is_logged_in) {
                    waiting_list.add(msg_type, promise_obj);
                    is_resolved = false;
                }
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
        clearTimeout(keep_alive_timeout);
    };

    const onOpen = () => {
        if (isReady()) {
            const token = Cookies.get('token');
            if (token) {
                State.set(['response', 'authorize'], undefined);
                send({ authorize: token }, true);
            }
            send({ website_status: 1 });

            wait('authorize').then(() => {
                while (buffered.length > 0) {
                    const req_obj = buffered.shift();
                    send(req_obj.request, false, req_obj.promise);
                }
            });
        }
    };

    const onMessage = (message) => {
        const response = JSON.parse(message.data);
        State.set(['response', response.msg_type], $.extend({}, response));
        if (typeof default_calls[response.msg_type] === 'function') {
            default_calls[response.msg_type](response);
        }
        const this_req_id = response.req_id;
        const reg = this_req_id ? registered_callbacks[this_req_id] : null;

        // keep alive
        clearTimeout(keep_alive_timeout);
        keep_alive_timeout = setTimeout(() => {
            send({ ping: 1 });
        }, 60000);

        if (reg && typeof reg.callback === 'function') {
            reg.callback(response);
            if (!reg.subscribe) {
                delete registered_callbacks[this_req_id];
            }
        }

        waiting_list.resolve(response);
    };

    const connect   = () => {
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
    };
})();

module.exports = ChampionSocket;
