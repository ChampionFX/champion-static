require('./../lib/slick');

const Slider = (() => {
    const init = function() {
        $('.slider').slick({
            infinite    : true,
            dots        : true,
            arrows      : false,
            slidesToShow: 1,
            autoplay    : true,
        });
    };
    return {
        init: init,
    };
})();

const positionFooterAndDots = function() {
    const height = -$('.slider-footer').innerHeight();
    const dotsMargin = height - 40;
    if (window.matchMedia('(min-width: 796px)').matches) {
        setTimeout(function () {
        /*eslint-disable */
            $('.slider-footer').css({
                transform: 'translateY(' + height + 'px)',
            });
            $('.slick-dots').css({
                transform: 'translateY(' + dotsMargin + 'px)',
            });
            $('.slider-text').css('margin-bottom', -height + 'px');
        /*eslint-enable */
        }, 10);
    } else {
        setTimeout(function () {
            $('.slick-dots').css({
                transform: 'translateY(-40px)',
            });
        });
    }
};

$(document).ready(
    function() {
        positionFooterAndDots();
        $(window).resize(positionFooterAndDots);
    });
module.exports = Slider;
