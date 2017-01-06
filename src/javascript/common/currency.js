const addComma    = require('./utility').addComma;
const getLanguage = require('./language').getLanguage;

function formatMoney(currencyValue, amount) {
    let money;
    if (amount) amount = String(amount).replace(/,/g, '');
    if (typeof Intl !== 'undefined' && currencyValue && currencyValue !== '' && amount && amount !== '') {
        const options = { style: 'currency', currency: currencyValue },
            language = typeof window !== 'undefined' ? getLanguage().toLowerCase() : 'en';
        money = new Intl.NumberFormat(language.replace('_', '-'), options).format(amount);
    } else {
        const updatedAmount = addComma(parseFloat(amount).toFixed(2));
        const symbol = formatCurrency(currencyValue);
        if (symbol === undefined) {
            money = `${currencyValue} ${updatedAmount}`;
        } else {
            money = symbol + updatedAmount;
        }
    }
    return money;
}

function formatCurrency(currency) {
    // Taken with modifications from:
    //    https://github.com/bengourley/currency-symbol-map/blob/master/map.js
    // When we need to handle more currencies please look there.
    const currency_map = {
        USD: '$',
        GBP: '£',
        AUD: 'A$',
        EUR: '€',
        JPY: '¥',
    };

    return currency_map[currency];
}

module.exports = {
    formatMoney: formatMoney,
};
