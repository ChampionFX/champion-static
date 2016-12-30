const getLanguage = require('./language').getLanguage;

/**
 * Router module for ChampionFX
 * Some code was borrowed from pjax lib
 * https://github.com/defunkt/jquery-pjax
 */
const ChampionRouter = (function() {
    'use strict';

    let xhr;
    const params   = {},
        defaults = {
            timeout : 650,
            type    : 'GET',
            dataType: 'html',
        },
        cache = {};

    const init = (container, content_selector) => {
        if (!(window.history && window.history.pushState && window.history.replaceState &&
            // pushState isn't reliable on iOS until 5.
            !navigator.userAgent.match(/((iPod|iPhone|iPad).+\bOS\s+[1-4]\D|WebApps\/.+CFNetwork)/))) {
            console.error('Unable to initialize router');
            return;
        }

        container = $(container);

        if (!container.length) {
            console.error('Could not find container');
            return;
        }

        if (!(content_selector && content_selector.length)) {
            console.error('No content selector provided');
            return;
        }

        params.container = container;
        params.content_selector = content_selector;

        const url = window.location.href;
        const title = document.title;
        const content = container.find(content_selector);

        // put current content to cache, so we won't need to load it again
        if (title && content && content.length) {
            cachePut(url, {
                title  : title,
                content: content,
            });
            window.history.replaceState({ url: url }, title, url);
            params.container.trigger('champion:after', content);
        }

        $(document).on('click', 'a', handleClick);
        $(window).on('popstate', handlePopstate);
    };

    const handleClick = (event) => {
        const link = event.currentTarget,
            url = link.href;

        if (url.length <= 0) {
            return;
        }
        // Middle click, cmd click, and ctrl click should open
        // links in a new tab as normal.
        if (event.which > 1 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        // Ignore cross origin links
        if (location.protocol !== link.protocol || location.hostname !== link.hostname) {
            return;
        }

        // Ignore event with default prevented
        if (event.isDefaultPrevented()) {
            return;
        }

        event.preventDefault();
        // check if url is not same as current
        if (location.href !== url) {
            processUrl(url);
        }
    };

    const processUrl = (url, replace) => {
        const cached_content = cacheGet(url);
        if (cached_content) {
            replaceContent(url, cached_content, replace);
        } else {
            load(url, replace);
        }
    };

    /**
     * Load url from server
     */
    const load = (url, replace) => {
        const lang = getLanguage();
        const options = $.extend(true, {}, $.ajaxSettings, defaults, {
            url: url.replace(new RegExp(`\/${lang}\/`, 'i'), `/${lang.toLowerCase()}/pjax/`) });

        options.success = (data) => {
            const result = {};

            result.title   = $(data).find('title').text().trim();
            result.content = $('<div/>', { html: data }).find(params.content_selector);

            // If failed to find title or content, load the page in traditional way
            if (result.title.length === 0 || result.content.length === 0) {
                locationReplace(url);
                return;
            }

            cachePut(url, result);
            replaceContent(url, result, replace);
        };

        // Cancel the current request if we're already loading some page
        abortXHR(xhr);

        xhr = $.ajax(options);
    };

    const handlePopstate = (e) => {
        const url = e.originalEvent.state ? e.originalEvent.state.url : window.location.href;
        if (url) {
            processUrl(url, true);
        }
        return false;
    };

    const replaceContent = (url, content, replace) => {
        window.history[replace ? 'replaceState' : 'pushState']({ url: url }, content.title, url);

        params.container.trigger('champion:before');

        document.title = content.title;
        params.container.find(params.content_selector).remove();
        params.container.append(content.content);

        params.container.trigger('champion:after', content.content);
    };

    const abortXHR = (xhrObj) => {
        if (xhrObj && xhrObj.readyState < 4) {
            xhrObj.abort();
        }
    };

    const cachePut = (url, content) => {
        cache[url] = content;
    };

    const cacheGet = url => cache[url];

    const locationReplace = (url) => {
        window.history.replaceState(null, '', url);
        window.location.replace(url);
    };

    return {
        init   : init,
        forward: processUrl,
    };
})();

module.exports = ChampionRouter;
