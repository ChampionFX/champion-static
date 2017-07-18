require('jquery.scrollto');

$(document).ready(function() {
    const $home   = $('#home');
    const $faq    = $('#faq');
    const $navbar = $('.navbar-fixed-top');
    const navbarHeight = 55;

    $('.barspinner').fadeOut(500);
    $home.fadeIn(1000);

    // Handle form submission
    if (window.location.hash === '#done') {
        $('.notice-msg').removeClass('invisible');
        $('form').addClass('invisible');
        if (window.history.pushState) {
            window.history.pushState('', '/', window.location.pathname);
        } else {
            window.location.hash = '';
        }
        const to = $('#coming-soon').offset().top;
        $(document).scrollTo(to, 1000);
    }

    // Toggle mobile menu
    $('#toggle-menu').click(function(e) {
        $navbar.toggleClass('expand');
        e.stopPropagation();
    });

    // Scroll to section
    $('.page-scroll').click(function(e) {
        const to = $(`${$(e.target).attr('href')}`).offset().top - navbarHeight;
        $navbar.removeClass('expand');
        if ($home.hasClass('invisible')) {
            $faq.addClass('invisible');
            $home.removeClass('invisible');
        }
        $(document).scrollTo(to, 1000);
        e.preventDefault();
    });

    $('#faq-btn').click(function(e) {
        $faq.removeClass('invisible');
        $home.addClass('invisible');
        $(document).scrollTo(0, 1000);
        e.preventDefault();
    });

    $('#close-btn').click(function() {
        const $iframe = $(document).find('iframe');
        const src = $iframe.attr('src');
        $iframe.attr('src', '/empty.html');
        $iframe.attr('src', src);
    });

    initializeSlider();
    window.onscroll = showHideButton;
    window.onresize = initializeSlider;
});

function showHideButton() {
    if (window.scrollY - $('.form-container').offset().top > 30) {
        $('#subscribe-btn').removeClass('btn--hide');
        $('.scroll-btn').removeClass('scroll-btn--hide');
    } else {
        $('#subscribe-btn').addClass('btn--hide');
        $('.scroll-btn').addClass('scroll-btn--hide');
    }
}

function initializeSlider() {
    const mq = window.matchMedia('(min-width: 768px)');
    const isSlickInitialized = $('.slick-initialized').length;
    if (!isSlickInitialized && !mq.matches) {
        $(document).find('.slider').slick({
            infinite    : true,
            dots        : true,
            arrows      : false,
            slidesToShow: 1,
            lazyLoad    : 'progressive',
            autoplay    : true,
        });
    } else if (isSlickInitialized && mq.matches) {
        $('.slider').slick('unslick');
    }
}
