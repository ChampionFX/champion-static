const ChampionSocket = require('./../../common/socket');

const CashierPaymentMethods = (function() {
    'use strict';

    const SCROLL_STEP = 5,
        hidden_class = 'invisible';

    let isVertical = $(window).innerWidth() < 767,
        scrolledTabs = 1; // scrolledTabs = tab number

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
                isVertical = $(window).innerWidth() < 767;
            });

            $('#payment_methods').removeClass(hidden_class);
            scrollTabContents();
            $('.scroll-right-button').unbind('click').click(scrollHandler(true));
            $('.scroll-left-button').unbind('click').click(scrollHandler(false));
            $('.scrollable-tabs').scrollEnd(toggleNextAndPrevious, 50);
        });
    };

    const scrollTabContents = () => {
        const $tab_content = $('.tab-content-wrapper');
        $('.scrollable-tabs li').click(function(e) {
            e.preventDefault();
            const val = $(this).find('a').attr('rel');
            $(this).parent().find('.tab-selected').removeClass('tab-selected');
            $(this).addClass('tab-selected');
            if (val && isVertical) {
                $tab_content.animate({ scrollTop: $tab_content.scrollTop() + $(val).position().top }, 350);
            } else {
                $tab_content.animate({ scrollLeft: $tab_content.scrollLeft() + $(val).position().left }, 500);
            }
        });
    };

    const scrollHandler = isNextButton => (e) => {
        e.preventDefault();
        scrolledTabs = incrementScrolledTabs(isNextButton);
        if (isThereChildrenToScroll()) {
            scroll(isVertical);
        }
    };

    function toggleNextAndPrevious () {
        if (isVertical) {
            const height = Math.ceil($('.scrollable-tabs').height());

            if ($('.scrollable-tabs :nth-child(1)').position().top === 0) {
                hideButton($('.scroll-left-button'));
            } else if ($(this).get(0).scrollHeight - $(this).scrollTop() === height) {
                hideButton($('.scroll-right-button'));
            } else {
                showBothButtons();
                makeScrollTabsSmall(true);
            }
        } else {
            const width = Math.ceil($('.scrollable-tabs').width());
            if ($('.scrollable-tabs :nth-child(1)').position().left === 0) {
                hideButton($('.scroll-left-button'));
            } else if (Math.abs($(this).get(0).scrollWidth - $(this).scrollLeft() - width) < 5) {
                hideButton($('.scroll-right-button'));
            } else {
                showBothButtons();
                makeScrollTabsSmall(false);
            }
        }
    }

    const hideButton = (element) => {
        element.siblings('div.col-md-10').removeClass('col-md-10').addClass('col-md-11');
        element.siblings().removeClass(hidden_class);
        element.addClass(hidden_class);
        $('.scrollable-tabs').removeClass('in-the-middle');
    };

    const incrementScrolledTabs = (isDirectionForward = true) => {
        const num_of_tabs = $('.scrollable-tabs').children().length;

        if (num_of_tabs > 5) {
            return isDirectionForward ? scrolledTabs + SCROLL_STEP : scrolledTabs - SCROLL_STEP;
        }

        return isDirectionForward ? scrolledTabs + num_of_tabs : scrolledTabs - num_of_tabs;
    };

    const isThereChildrenToScroll = () => {
        const num_of_tabs = $('.scrollable-tabs').children().length;
        return scrolledTabs < num_of_tabs && scrolledTabs > 0;
    };

    const scroll = () => {
        if (isThereChildrenToScroll()) {
            if (isVertical) {
                $('.scrollable-tabs').animate({ scrollTop: $('.scrollable-tabs').scrollTop() + $(`.scrollable-tabs :nth-child(${scrolledTabs})`).position().top }, 500);
            } else {
                $('.scrollable-tabs').animate({ scrollLeft: $('.scrollable-tabs').scrollLeft() + $(`.scrollable-tabs :nth-child(${scrolledTabs})`).position().left }, 500);
            }
        }
    };

    const showBothButtons = () => {
        $('.scroll-left-button').removeClass(hidden_class);
        $('.scroll-right-button').removeClass(hidden_class);
    };

    const makeScrollTabsSmall = () => {
        if (isVertical) {
            $('.scrollable-tabs').addClass('in-the-middle');
        } else {
            $('.scrollable-tabs').parent().removeClass('col-md-11').addClass('col-md-10');
        }
    };

    return {
        load: load,
    };
})();

module.exports = CashierPaymentMethods;
