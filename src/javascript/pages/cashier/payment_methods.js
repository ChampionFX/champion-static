const ChampionSocket = require('./../../common/socket');

const CashierPaymentMethods = (function() {
    'use strict';

    const hidden_class = 'invisible';
    const VIEWPORT_TABS = 6;

    let isVertical = $(window).innerWidth() < 767;
    let currentFirstTab = 1;

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
        currentFirstTab = updateCurrentFirstTab(isNextButton);
        if (isThereChildrenToScroll()) {
            scroll(isVertical);
        }
    };

    function toggleNextAndPrevious () {
        const $container = $('.scrollable-tabs');
        const $firstTab = $container.find(':nth-child(1)');
        const tabSize = isVertical ? $firstTab.height() : $firstTab.width();
        const $this = $(this);
        const MIN_DIFF = 5;
        const containerSize = Math.ceil(isVertical ? $container.height() : $container.width());
        const firstTabPosition = isVertical ? $firstTab.position().top : $firstTab.position().left;
        currentFirstTab = Math.ceil(Math.abs(firstTabPosition / tabSize));
        const viewportSize = $this.get(0).scrollHeight - $this.scrollTop();

        if (firstTabPosition === 0) {
            hideButton($('.scroll-left-button'));
        } else if (Math.abs(viewportSize - containerSize) < MIN_DIFF) {
            hideButton($('.scroll-right-button'));
        } else {
            showBothButtons();
            makeScrollTabsSmall(isVertical);
        }
    }

    const hideButton = (element) => {
        element.siblings('div.col-md-10').removeClass('col-md-10').addClass('col-md-11');
        element.siblings().removeClass(hidden_class);
        element.addClass(hidden_class);
        $('.scrollable-tabs').removeClass('in-the-middle');
    };

    const updateCurrentFirstTab = (isDirectionForward) => {
        const tabsCount = $('.scrollable-tabs').children().length;
        const end = currentFirstTab + (VIEWPORT_TABS - 1);
        const tabsRemainingInTheEnd = tabsCount - end;
        const tabsRemainingInTheBeginning = currentFirstTab - 1;
        const JUMP = VIEWPORT_TABS - 1;
        if (isDirectionForward) {
            if (tabsRemainingInTheEnd > JUMP) {
                return currentFirstTab + JUMP;
            }
            return currentFirstTab + tabsRemainingInTheEnd;
        }
        if (tabsRemainingInTheBeginning > JUMP) {
            return currentFirstTab - JUMP;
        }
        return currentFirstTab - tabsRemainingInTheBeginning;
    };

    const isThereChildrenToScroll = () => {
        const num_of_tabs = $('.scrollable-tabs').children().length;
        return currentFirstTab < num_of_tabs && currentFirstTab > 0;
    };

    const scroll = () => {
        if (isThereChildrenToScroll()) {
            if (isVertical) {
                $('.scrollable-tabs').animate({ scrollTop: $('.scrollable-tabs').scrollTop() + $(`.scrollable-tabs :nth-child(${currentFirstTab})`).position().top }, 500);
            } else {
                $('.scrollable-tabs').animate({ scrollLeft: $('.scrollable-tabs').scrollLeft() + $(`.scrollable-tabs :nth-child(${currentFirstTab})`).position().left }, 500);
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
