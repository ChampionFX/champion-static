require('./../lib/slick');

const Slider = (() => {
    const init = function() {
        $(function () {
            $(document).find('.slider').slick({
                infinite    : false,
                dots        : true,
                arrows      : false,
                slidesToShow: 1,
                appendDots  : $('#slider-dots'),
                lazyLoad    : 'progressive',
                autoplay    :  true,
            });
            positionFooterAndDots();
        });
    };

    const destroy = function () {
        $('#slider-dots').empty();
        $('.slider').slick('unslick');
    };

    const positionFooterAndDots = function() {
        const height = -$('.slider-footer').innerHeight();
        const dotsMargin = height - 40;
        if (window.matchMedia('(min-width: 797px)').matches) {
            /*eslint-disable */
            setTimeout(function () {
                $('.slider-footer').css({
                    transform: 'translateY(' + height + 'px)',
                });
                $('#slider-dots').css({
                    transform: 'translateY(' + dotsMargin + 'px)',
                });
                $('.slider-text, .large-slider-text').css('height', 500 + height + 'px');
            }, 10);

            /*eslint-enable */
        } else {
            setTimeout(function () {
                $('.slider-footer').css({
                    transform: 'translateY(0)',
                });
                $('#slider-dots').css({
                    transform: 'translateY(-40px)',
                });
                $('.slider-text, .large-slider-text').css('height', '100%');
            });
        }
    };

    $(function() {
        $(window).resize(positionFooterAndDots);
    });

    return {
        init                 : init,
        positionFooterAndDots: positionFooterAndDots,
        destroy              : destroy,
    };
})();

module.exports = Slider;
