const Slider = require('./../pages/slider');

const Home = (function() {
    'use strict';

    const load = () => {
        Slider.init();
        const hash = window.location.hash.substring(1);
        if (hash === 'signup') {
            setTimeout(() => { $.scrollTo($('#verify-email-form'), 500); }, 500);
        }
    };

    const unload = () => {
        Slider.destroy();
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = Home;
