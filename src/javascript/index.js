require('jquery');
require('babel-polyfill');

window.$ = window.jQuery = require('jquery');

require('./pages/contact');

var Champion = require('./pages/champion');

$(window).on('load', Champion.init);
