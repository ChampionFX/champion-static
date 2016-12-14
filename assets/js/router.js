/**
 * Router module for ChampionFX
 * Some code was borrowed from pjax lib
 * https://github.com/defunkt/jquery-pjax
 **/
(function() {

    var params = {};

    var defaults = {
        timeout: 650,
        type: 'GET',
        dataType: 'html'
    };

    var xhr;
    var cache = {};

    function init(container, content_selector) {
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

        var url = window.location.href;
        var title = document.title;
        var content = container.find(content_selector);

        // put current content to cache, so we won't need to load it again
        if (title && content && content.length) {
            cachePut(url, {
                title: title,
                content: content
            });
            window.history.replaceState({url: url}, title, url);
            params.container.trigger('champion:after', content);
        }

        $(document).on('click', 'a', handleClick);
        $(window).on('popstate', handlePopstate);
    }

    function handleClick(event) {
        var link = event.currentTarget,
            url = link.href;

        if (url.length <= 0) {
            return;
        }
        // Middle click, cmd click, and ctrl click should open
        // links in a new tab as normal.
        if ( event.which > 1 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey )
            return;

        // Ignore cross origin links
        if ( location.protocol !== link.protocol || location.hostname !== link.hostname )
            return;

        // Ignore event with default prevented
        if (event.isDefaultPrevented())
            return;

        event.preventDefault();
        // check if url is not same as current
        if (location.href !== url) {
            processUrl(url);
        }
    }

    function processUrl(url, replace) {
        var cached_content = cacheGet(url);
        if (cached_content) {
            replaceContent(url, cached_content, replace);
        } else {
            load(url, replace);
        }
    }

    /*
    * Load url from server
    * */
    function load(url, replace) {
        var options = $.extend(true, {}, $.ajaxSettings, defaults, {url: url});

        options.success = function(data) {
            var result = {},
                matched_head = data.match(/<head[^>]*>([\s\S.]*)<\/head>/i),
                matched_body = data.match(/<body[^>]*>([\s\S.]*)<\/body>/i);

            if (!(matched_head && matched_body)) {
                locationReplace(url);
                return;
            }
            // Attempt to parse response html into elements
            var head = $(matched_head[0]);
            var body = $(matched_body[0]);

            result.title = head.filter('title').last().text().trim();
            result.content = body.find(params.content_selector);

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
    }

    function handlePopstate(e) {
        var url = e.originalEvent.state ? e.originalEvent.state.url : window.location.href;
        if (url) {
            processUrl(url, true);
        }
        return false;
    }

    function replaceContent(url, content, replace) {
        window.history[replace ? 'replaceState' : 'pushState']({url: url}, content.title, url);

        params.container.trigger('champion:before');

        document.title = content.title;
        params.container.find(params.content_selector).remove();
        params.container.append(content.content);

        params.container.trigger('champion:after', content.content);
    }

    function abortXHR(xhr) {
        if (xhr && xhr.readyState < 4) {
            xhr.abort();
        }
    }

    function cachePut(url, content) {
        cache[url] = content;
    }

    function cacheGet(url) {
        return cache[url];
    }

    function locationReplace(url) {
        window.history.replaceState(null, "", url);
        window.location.replace(url);
    }

    window.ChampionRouter = {
        init: init,
        forward: processUrl
    }

})();