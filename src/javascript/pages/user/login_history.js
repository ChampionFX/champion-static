const ChampionSocket   = require('../../common/socket');
const moment      = require('moment');

const LoginHistory = (() => {
    'use strict';

    const hidden_class = 'invisible';

    const load = () => {
        const req = {
            login_history: 1,
            limit        : 50,
        };

        ChampionSocket.send(req).then((response) => {
            $('.barspinner').addClass(hidden_class);
            if (response.error) {
                $('#error-msg').html(response.error.message);
            } else {
                handleResponse(response);
            }
        });
    };

    const handleResponse = (response) => {
        const histories   = response.login_history;
        const length      = histories.length;
        const parsed_data = [];
        for (let i = 0; i < length; i++) {
            const data = parse(histories[i]);
            parsed_data.push(data);
        }
        render(parsed_data);
    };

    const render = (data) => {
        const rows = data.map(history => (
            `<tr><td>${history.time}</td>
                 <td>${history.action}</td>
                 <td>${history.browser.name} ${history.browser.version}</td>
                 <td>${history.ip_addr}</td>
                 <td>${history.status}</td></tr>`)).join('');

        const header = `<th>Date and time</th>
                        <th>Action</th>
                        <th>Browser</th>
                        <th>IP address</th>
                        <th>Status</th>`;

        const table = `<table><tr>${header}</tr>${rows}</table>`;

        $('#fx-login-history').append(table);
    };

    const parseUA = (user_agent) => {
        // Table of UA-values (and precedences) from:
        //  https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent
        // Regexes stolen from:
        //  https://github.com/biggora/express-useragent/blob/master/lib/express-useragent.js
        const lookup = [
            { name: 'Edge',      regex: /Edge\/([\d\w\.\-]+)/i },
            { name: 'SeaMonkey', regex: /seamonkey\/([\d\w\.\-]+)/i },
            { name: 'Opera',     regex: /(?:opera|opr)\/([\d\w\.\-]+)/i },
            { name: 'Chromium',  regex: /(?:chromium|crios)\/([\d\w\.\-]+)/i },
            { name: 'Chrome',    regex: /chrome\/([\d\w\.\-]+)/i },
            { name: 'Safari',    regex: /version\/([\d\w\.\-]+)/i },
            { name: 'IE',        regex: /msie\s([\d\.]+[\d])/i },
            { name: 'IE',        regex: /trident\/\d+\.\d+;.*[rv:]+(\d+\.\d)/i },
            { name: 'Firefox',   regex: /firefox\/([\d\w\.\-]+)/i },
        ];
        for (let i = 0; i < lookup.length; i++) {
            const info = lookup[i];
            const match = user_agent.match(info.regex);
            if (match !== null) {
                return {
                    name   : info.name,
                    version: match[1],
                };
            }
        }
        return null;
    };

    const parse = (response) => {
        const env        = response.environment;
        const ip_address = env.split(' ')[2].split('=')[1];
        const user_agent = env.match('User_AGENT=(.+) LANG')[1];
        const utc_time   = moment.unix(response.time).utc().format('YYYY-MM-DD HH:mm:ss').replace(' ', '\n');
        const status     = response.status === 1 ? 'Successful' : 'Failed';
        return {
            time   : `${utc_time} GMT`,
            action : response.action,
            status : status,
            browser: parseUA(user_agent),
            ip_addr: ip_address,
        };
    };

    const unload = () => {
        $('#fx-login-history').empty(); // cleanup
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = LoginHistory;
