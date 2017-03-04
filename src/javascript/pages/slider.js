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
    const height = $('.fx-slider-footer').innerHeight();
    setTimeout(function () {
        $('.fx-slider-footer').css('bottom', height);
        $('.slick-dots').css('bottom', height + 40);
        $('.fx-slider-text').css('margin-bottom', height);
    }, 10);
};

$(document).ready(
    function() {
        positionFooterAndDots();
        $(window).resize(positionFooterAndDots);
    });
module.exports = Slider;
