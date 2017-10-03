require('jquery');
require('babel-polyfill');

window.$ = window.jQuery = require('jquery');

require('./lib/plugins');
require('./pages/contact');

const Champion = require('./common/champion');

$(window).on('load', Champion.init);

$.fn.scrollEnd = function(callback, timeout) {
    $(this).scroll(function(e) {
        const $this = $(this);
        if ($this.data('scrollTimeout')) {
            clearTimeout($this.data('scrollTimeout'));
        }
        $this.data('scrollTimeout', setTimeout(() => callback.call(this, e), timeout));
    });
};
