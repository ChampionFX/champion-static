const ChampionSocket = require('../common/socket');
const DatePicker     = require('../components/date_picker').DatePicker;
const moment         = require('moment');

const TradingTimes = (() => {
    'use strict';

    const today = moment.utc().format('YYYY-MM-DD'),
        hidden_class = 'invisible';

    let active_symbols;

    const load = () => {
        const date_picker = new DatePicker('#trading-date'); // create datepicker
        date_picker.show({
            minDate: 'today',
            maxDate: 365,
        });

        const $date = $('#trading-date').val(today);
        $date.change(() => {
            unload();
            getTradingTimes($date.val());
        });

        ChampionSocket.send({ active_symbols: 'brief' }).then((response) => {
            $('.barspinner').addClass(hidden_class);
            if (response.error) {
                $('#error-msg').html(response.error.message);
            } else {
                active_symbols = response.active_symbols.slice(0);
                getTradingTimes('today');
            }
        });
    };

    const getTradingTimes = (date) => {
        ChampionSocket.send({ trading_times: date || 'today' }).then((response) => {
            $('.barspinner').addClass(hidden_class);
            if (response.error) {
                $('#error-msg').html(response.error.message);
            } else {
                createTable(response.trading_times);
            }
        });
    };

    const createTable = (data) => {
        const submarket_subheader =
            `<tr><th class="asset">Asset</th> 
                 <th class="opens">Opens</th>
                 <th class="closes">Closes</th>
                 <th class="settles">Settles</th>
                 <th class="upcomingevents">Upcoming events</th></tr>`; // constant subheader

        const markets = data.markets.slice(0);
        const tabs = createTabs(markets);
        const market_tabs = `<ul>${tabs}</ul>`; // create market tabs, wrap tab items in <ul>
        const market_contents = markets.map((market, index) => {
            if (market.name === 'Volatility Indices') {
                return null;
            }
            const market_table = market.submarkets.map((submarket) => {
                const submarket_header  = createTableHeader(submarket.name); // create header row
                const submarket_symbols = createTableRow(submarket.symbols); // create symbol rows
                return `<table>
                            ${submarket_header}
                            ${submarket_subheader}
                            ${submarket_symbols}
                        </table>`; // create market table
            }).join('');
            return `<div id="market_${index++}">
                        ${market_table}
                    </div>`; // create market contents, wrap market table in <div>
        }).join('');

        $('#fx-trading-times')
            .html(`${market_tabs}${market_contents}`)
            .tabs();
    };

    const createTabs = tabs => (tabs.map((tab, index) =>
        (tab.name === 'Volatility Indices' ? null : `<li><a href="#market_${index++}">${tab.name}</a></li>`)).join(''));

    const createTableHeader = title => (`<tr><th colspan="5" class="center-text">${title}</th></tr>`);

    const createTableRow = symbols => (
        symbols.map((symbol) => {
            if (getSymbolInfo(symbol, active_symbols)) {
                return `<tr><td class="asset">${symbol.name}</td>
                            <td class="opens">${symbol.times.open.join('<br>')}</td>
                            <td class="closes">${symbol.times.close.join('<br>')}</td>
                            <td class="settles">${symbol.times.settlement}</td>
                            <td class="upcomingevents">${createEventsText(symbol.events)}</td></tr>`;
            }
            return '';
        }).join('')
    );

    const createEventsText = (events) => {
        let result = '';
        for (let i = 0; i < events.length; i++) {
            if (i) result += '<br>';
            result += `${events[i].descrip}: ${events[i].dates}`;
        }
        return result.length > 0 ? result : '--';
    };

    const getSymbolInfo = symbol => active_symbols.filter(obj => (obj.symbol === symbol));

    const unload = () => {
        $('#fx-trading-times')
            .empty()
            .tabs('destroy'); // return to pre-init state
        $('.barspinner').removeClass(hidden_class);
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = TradingTimes;
