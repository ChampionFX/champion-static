const Slider         = require('./../pages/slider');
const ChampionSignup = require('./signup');

const Home = (function() {
    'use strict';

    const load = () => {
        Slider.init();
        const hash = window.location.hash.substring(1);
        if (hash === 'signup') {
            ChampionSignup.showModal();
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
