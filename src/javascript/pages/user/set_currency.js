const Client           = require('../../common/client');
const ChampionSocket   = require('../../common/socket');
const getCurrencyName  = require('../../common/currency').getCurrencyName;
const isCryptocurrency = require('../../common/currency').isCryptocurrency;
const localize         = require('../../common/localize').localize;
const State            = require('../../common/storage').State;
const Url              = require('../../common/url');

const SetCurrency = (() => {
    let is_new_account;

    const onLoad = () => {
        is_new_account = localStorage.getItem('is_new_account');
        localStorage.removeItem('is_new_account');
        const el = is_new_account ? 'show' : 'hide';
        $(`#${el}_new_account`).setVisibility(1);

        if (Client.get('currency')) {
            if (is_new_account) {
                $('#set_currency_loading').remove();
                $('#has_currency, #set_currency').setVisibility(1);
            }
            return;
        }

        ChampionSocket.wait('payout_currencies').then((response) => {
            const payout_currencies = response.payout_currencies;
            const $fiat_currencies  = $('<div/>');
            const $cryptocurrencies = $('<div/>');
            payout_currencies.forEach((c) => {
                (isCryptocurrency(c) ? $cryptocurrencies : $fiat_currencies)
                    .append($('<div/>', { class: `${isCryptocurrency(c) ? 'col-md-4' : 'col-md-3'} col-xs-6 currency_wrapper`, id: c })
                        .append($('<div/>', { class: 'currency-box' })
                        .append($('<div/>').append($('<img/>', { src: Url.url_for_static(`images/set_currency/${c.toLowerCase()}.svg`) })))
                        .append($('<div/>', { class: 'currency-name', html: (isCryptocurrency(c) ? `${getCurrencyName(c)}<br />(${c})` : c) }))));
            });
            const fiat_currencies = $fiat_currencies.html();
            if (fiat_currencies) {
                $('#fiat_currencies').setVisibility(1);
                $('#fiat_currency_list').html(fiat_currencies);
            }
            const crytpo_currencies = $cryptocurrencies.html();
            if (crytpo_currencies) {
                $('#crypto_currencies').setVisibility(1);
                $('#crypto_currency_list').html(crytpo_currencies);
            }

            $('#set_currency_loading').remove();
            $('#set_currency, .select_currency').setVisibility(1);

            const $currency_list = $('.currency_list');
            $('.currency_wrapper').on('click', function () {
                $currency_list.find('> div').removeClass('selected');
                $(this).addClass('selected');
            });

            const $form  = $('#frm_set_currency');
            const $error = $form.find('.error-msg');
            $form.on('submit', (evt) => {
                evt.preventDefault();
                $error.setVisibility(0);
                const $selected_currency = $currency_list.find('.selected');
                if ($selected_currency.length) {
                    ChampionSocket.send({ set_account_currency: $selected_currency.attr('id') }).then((response_c) => {
                        if (response_c.error) {
                            $error.text(response_c.error.message).setVisibility(1);
                        } else {
                            Client.set('currency', response_c.echo_req.set_account_currency);
                            ChampionSocket.send({ balance: 1 });
                            ChampionSocket.send({ payout_currencies: 1 }, { forced: true });

                            let redirect_url;
                            if (is_new_account) {
                                if (Client.isAccountOfType('financial')) {
                                    const get_account_status = State.getResponse('get_account_status');
                                    if (!/authenticated/.test(get_account_status.status)) {
                                        redirect_url = Url.url_for('user/authenticate');
                                    }
                                }
                                if (!redirect_url && !/^(iom)$/i.test(Client.get('landing_company_shortcode'))) {
                                    redirect_url = Url.url_for('cashier');
                                }
                            }
                            if (redirect_url) {
                                window.location.href = redirect_url; // load without pjax
                            } else {
                                window.location.reload();
                            }
                        }
                    });
                } else {
                    $error.text(localize('Please choose a currency')).setVisibility(1);
                }
            });
        });
    };

    return {
        load: onLoad,
    };
})();

module.exports = SetCurrency;
