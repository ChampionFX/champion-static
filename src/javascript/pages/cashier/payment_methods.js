const ChampionSocket = require('./../../common/socket');
const Client         = require('../../common/client');

require('../../components/scrollTabs/jquery.scrolltabs');
require('../../components/scrollTabs/jquery.mousewheel');

const CashierPaymentMethods = (function() {
    'use strict';

    const hidden_class = 'invisible';

    const load = () => {
        ChampionSocket.wait('authorize').then(() => {
            $('#accordion').accordion({
                heightStyle : 'content',
                collapsible : true,
                active      : false
            });
            $('.scrollable-tab').scrollTabs({
                scroll_distance: 350,
                scroll_duration: 350,
                left_arrow_size: 40,
                right_arrow_size: 40,
                click_callback: function(e){
                    var val = $(this).find('a').attr('rel');
                    if (val) {
                        //$('.tab-content').find('.tab-content-wrapper > div').addClass('invisible');
                        //$(val).removeClass('invisible');
                        $('.tab-content-wrapper').animate({scrollLeft: $('.tab-content-wrapper').scrollLeft() + $(val).position().left}, 500);
                        //scrollLeft($(val).position().left)
                    }
                }
            });
            // $('.tab-content-wrapper').slick();
            // $('.has-tabs').tabs().removeClass('invisible');

            const container = $('.fx-payment-methods');
            if (!Client.is_logged_in()) {
                container.find('#btn-open-account').removeClass(hidden_class);
            } else if (!Client.is_virtual()) {
                container.find('#btn-deposit, #btn-withdraw').removeClass(hidden_class);
                ChampionSocket.send({ cashier_password: 1 }).then((response) => {
                    if (!response.error && response.cashier_password === 1) {
                        container.find('#btn-deposit, #btn-withdraw').addClass('button-disabled');
                    }
                });
            }
        });
    };

    return {
        load: load,
    };
})();

module.exports = CashierPaymentMethods;
