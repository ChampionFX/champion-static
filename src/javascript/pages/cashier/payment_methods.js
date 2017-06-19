const ChampionSocket = require('./../../common/socket');

const CashierPaymentMethods = (function() {
    'use strict';

    const hidden_class = 'invisible';
    let mobile = $(window).innerWidth() < 767;

    const load = () => {
        ChampionSocket.wait('authorize').then(() => {
            const icons = {
                header      : 'ui-arrow-down',
                activeHeader: 'ui-arrow-up',
            };
            $('#payment_methods_accordian').accordion({
                heightStyle: 'content',
                collapsible: true,
                active     : false,
                icons      : icons,
            });

            $(window).on('orientationchange resize', () => {
                mobile = $(window).innerWidth() < 767;
            });

            $('#payment_methods').removeClass(hidden_class);
            scrollContentHandler();
            clickToScrollHandler();
            swipeToScrollHandler();
        });
    };

    const scrollContentHandler = () => {
        $('.scrollable-tabs li').click(function(e) {
            e.preventDefault();
            const val = $(this).find('a').attr('rel');
            $(this).parent().find('.tab-selected').removeClass('tab-selected');
            $(this).addClass('tab-selected');
            if (val && mobile) {
                $('.tab-content-wrapper').animate({ scrollTop: $('.tab-content-wrapper').scrollTop() + $(val).position().top }, 350);
            } else {
                $('.tab-content-wrapper').animate({ scrollLeft: $('.tab-content-wrapper').scrollLeft() + $(val).position().left }, 500);
            }
        });
    };

    const clickToScrollHandler = () => {
        let n = 1; // n = tab number
        const num_of_tabs = $('.scrollable-tabs').children().length;
        $('.scroll-right-button').unbind('click').click(function(e) {
            e.preventDefault();
            if (num_of_tabs > 5) {
                n += 5;
            } else {
                n += num_of_tabs;
            }
            if (n < num_of_tabs) {
                $('.scroll-left-button').removeClass(hidden_class);
                $(this).siblings('.col-md-11').removeClass('col-md-11').addClass('col-md-10');
                if (mobile) {
                    $('.scrollable-tabs').animate({ scrollTop: 30 + $('.scrollable-tabs').scrollTop() + $(`.scrollable-tabs :nth-child(${n})`).position().top }, 500);
                } else {
                    $('.scrollable-tabs').animate({ scrollLeft: 30 + $('.scrollable-tabs').scrollLeft() + $(`.scrollable-tabs :nth-child(${n})`).position().left }, 500);
                }
            }
            swipeToScrollHandler();
        });
        $('.scroll-left-button').unbind('click').click(function(e) {
            e.preventDefault();
            if (num_of_tabs > 5) {
                n -= 5;
            } else {
                n -= num_of_tabs;
            }
            n = n < 0 ? 1 : n;
            if (n < num_of_tabs) {
                $('.scroll-left-button').removeClass(hidden_class);
                $(this).siblings('.col-md-11').removeClass('col-md-11').addClass('col-md-10');
                if (mobile) {
                    $('.scrollable-tabs').animate({ scrollTop: -15 + $('.scrollable-tabs').scrollTop() + $(`.scrollable-tabs :nth-child(${n})`).position().top }, 500);
                } else {
                    $('.scrollable-tabs').animate({ scrollLeft: -15 + $('.scrollable-tabs').scrollLeft() + $(`.scrollable-tabs :nth-child(${n})`).position().left }, 500);
                }
            }
        });
    };

    const swipeToScrollHandler = () => {
        const height = Math.ceil($('.scrollable-tabs').height());
        const width = Math.floor($('.scrollable-tabs').width());
        $('.scrollable-tabs').scroll(function() {
            if (mobile) {
                if ($('.scrollable-tabs :nth-child(1)').position().top === 0) {
                    hideButton($('.scroll-left-button'));
                } else if ($(this).get(0).scrollHeight - $(this).scrollTop() === height) {
                    hideButton($('.scroll-right-button'));
                }
            } else if ($('.scrollable-tabs :nth-child(1)').position().left === 0) {
                hideButton($('.scroll-left-button'));
            } else if ($(this).get(0).scrollWidth - $(this).scrollLeft() === width) {
                hideButton($('.scroll-right-button'));
            }
        });
    };

    const hideButton = (element) => {
        element.siblings('div.col-md-10').removeClass('col-md-10').addClass('col-md-11');
        element.siblings().removeClass(hidden_class);
        element.addClass(hidden_class);
    };

    return {
        load: load,
    };
})();

module.exports = CashierPaymentMethods;
