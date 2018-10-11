const ChampionSocket = require('../../common/socket');

const Limits = (() => {
    'use strict';

    let $trading_limits,
        $withdrawal_limits;

    const hidden_class = 'invisible';

    const load = () => {
        $trading_limits    = $('#fx-trading-limits');
        $withdrawal_limits = $('#fx-withdrawal-limits');

        ChampionSocket.send({ get_limits: 1 }).then((response) => {
            if (response.error) {
                $('#error-msg').html(response.error.message);
            } else {
                handleResponse(response.get_limits);
            }
        });
    };

    const handleResponse = (data) => {
        // Trading limits
        const trading_limits_header   = '<tr><th>Item</th><th>Limits</th></tr><tr>';
        const trading_limits_contents =
                    `<tr><td>Maximum number of open positions</td>
                         <td>${data.open_positions}</td></tr>
                     <tr><td>Maximum account cash balance</td>
                         <td>${formatNumbers(data.account_balance)}</td></tr>
                     <tr><td>Maximum aggregate payouts on open positions</td>
                         <td>${formatNumbers(data.payout)}</td></tr>`;
        $trading_limits.append(`<table>${trading_limits_header}${trading_limits_contents}</table><br>`);

        const market_specific = data.market_specific;
        const market_specific_header = '<tr><th>Maximum daily turnover</th><th>Limits</th></tr>';
        let market_specific_contents = '';
        Object.keys(market_specific).forEach((market) => {
            const submarkets = market_specific[market];
            const market_header = `<tr><td class='market' colspan='2'>${market}</td></tr>`;
            const market_rows   = submarkets.map(submarket => (
                `<tr><td class='submarket'>${submarket.name}</td>
                      <td class='limit'>${formatNumbers(submarket.turnover_limit)}</td></tr>`
            )).join('');
            market_specific_contents += `${market_header}${market_rows}`;
        });

        const hint = '<p class="hint">Stated limits are subject to change without prior notice.</p>';
        $trading_limits.append(`<table>${market_specific_header}${market_specific_contents}</table>${hint}`);

        // Withdrawal limits
        let withdrawal_msg = '';
        if (data.lifetime_limit === 99999999 && data.num_of_days_limit === 99999999) {
            withdrawal_msg = '<p>Your account is fully authenticated and your withdrawal limits have been lifted.</p>';
        } else {
            const days_limit = data.num_of_days_limit;
            const withdrawn  = data.withdrawal_since_inception_monetary;
            const remainder  = data.remainder;

            withdrawal_msg = `<p>Your withdrawal limit is &dollar;${days_limit}.</p>
                              <p>You have already withdrawn &dollar;${withdrawn}.</p>
                              <p>Therefore your current immediate maximum withdrawal
                                 (subject to your account having sufficient funds) is &dollar;${remainder}.</p>`;
        }
        $withdrawal_limits.append(withdrawal_msg);

        $('.barspinner').addClass(hidden_class);
        $('#fx-limits').removeClass(hidden_class);
    };

    const formatNumbers = (num, decimal_points) => {
        num = String(num || 0).replace(/,/g, '') * 1;
        return num.toFixed(decimal_points).toString().replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
            return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, '$&,');
        });
    };

    const unload = () => {
        $trading_limits.empty();
        $withdrawal_limits.empty();
        $('.barspinner').removeClass(hidden_class);
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = Limits;
