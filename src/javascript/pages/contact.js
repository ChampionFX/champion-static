const urlForStatic = require('../common/url').url_for_static;
const loadCSS      = require('../lib/loadCSS');
const loadJS       = require('../lib/loadJS');

const ChampionContact = (function() {
    'use strict';

    const load = () => {
        $('#cs_telephone_number').on('change', function() {
            $('#phone-result').html($(this).val());
        });
        showLiveChatIcon();
    };

    const showLiveChatIcon = () => {
        if (typeof DESK === 'undefined') {
            loadCSS('https://d3jyn100am7dxp.cloudfront.net/assets/widget_embed_191.cssgz?1367387331');
            loadJS('https://d3jyn100am7dxp.cloudfront.net/assets/widget_embed_libraries_191.jsgz?1367387332');
        }

        const desk_load = setInterval(() => {
            if (typeof DESK !== 'undefined') {
                renderDeskWidget();
                changeChatIcon();
                clearInterval(desk_load);
            }
        }, 100);
    };

    const renderDeskWidget = () => {
        new DESK.Widget({
            version    : 1,
            site       : 'champion.desk.com',
            port       : '80',
            type       : 'chat',
            id         : 'live_chat_icon',
            displayMode: 0, // 0 for popup, 1 for lightbox
            features   : {
                offerAlways                : true,
                offerAgentsOnline          : false,
                offerRoutingAgentsAvailable: false,
                offerEmailIfChatUnavailable: false,
            },
        }).render();
    };

    const changeChatIcon = () => {
        const $chat_icon = $('#live_chat_icon');
        if ($chat_icon.length > 0) {
            let timer = null;
            const updateIcon = () => {
                const $desk_widget = $('.a-desk-widget');
                const image_str = $desk_widget.css('background-image');
                if (image_str) {
                    $desk_widget.css({
                        'background-image': `url("${urlForStatic('images/symbols/cs.svg')}")`,
                        'background-size' : 'contain',
                        'min-width'       : 50,
                        'min-height'      : 50,
                    }).attr('href', `${'java'}${'script'}:;`);

                    if (image_str.match(/(none|cs\.svg)/g)) {
                        clearInterval(timer);
                        $chat_icon.removeClass('invisible');
                    }
                }
                $desk_widget.removeAttr('onmouseover onmouseout');
            };
            timer = setInterval(updateIcon, 500);
        }
    };

    const unload = () => {
        $('#cs_telephone_number').off('change');
    };

    return {
        load  : load,
        unload: unload,
    };
})();

module.exports = ChampionContact;
