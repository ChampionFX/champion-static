require('jquery');
require('babel-polyfill');

window.$ = window.jQuery = require('jquery');

require('./pages/contact');

const Champion = require('./common/champion');

$(window).on('load', Champion.init);
