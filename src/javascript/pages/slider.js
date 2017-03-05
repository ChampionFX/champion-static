require('./../lib/slick');

const Slider = (() => {
    const init = function() {
        $('.slider').slick({
            infinite    : true,
            dots        : true,
            arrows      : false,
            slidesToShow: 1,
        });
    };
    return {
        init: init,
    };
})();

const positionFooterAndDots = function() {
    const height = -$('.slider-footer').innerHeight();
    const dotsMargin = height - 40;
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
};

$(document).ready(
    function() {
        positionFooterAndDots();
        $(window).resize(positionFooterAndDots);
    });
module.exports = Slider;
