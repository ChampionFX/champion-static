const Slider = require('./../pages/slider');

const Home = (function() {
    'use strict';

    const load = () => {
        Slider.init();
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
