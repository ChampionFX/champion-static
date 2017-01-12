require('jquery.scrollto');

function isEmptyObject(obj) {
    let isEmpty = true;
    if (obj && obj instanceof Object) {
        Object.keys(obj).forEach(function(key) {
            if (key in obj) isEmpty = false;
        });
    }
    return isEmpty;
}

function animateDisappear(element) {
    element.animate({ opacity: 0 }, 100, function() {
        element.css({ visibility: 'hidden', display: 'none' });
    });
}

function animateAppear(element) {
    element.css({ visibility: 'visible', display: 'block' })
        .animate({ opacity: 1 }, 100);
}

const addComma = function(num, decimal_points) {
    num = String(num || 0).replace(/,/g, '') * 1;
    return num.toFixed(decimal_points || 2).toString().replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
        return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, '$&,');
    });
};

// function used on any page that has tab menu to
// show the correct tab/content if hash is changed in url
const handleActive = function () {
    const hash = window.location.hash,
        menu = '.tab-menu-wrap',
        content = '.tab-content-wrapper';
    if (menu && content) {
        // tabListener is called from binary-style
        // to init when page loaded with pjax
        tabListener();
        if (hash) {
            $.scrollTo($(hash), 500, { offset: -5 });
            const parent_active = 'first active',
                child_active = 'first a-active',
                hidden_class = 'invisible';
            /* eslint-disable newline-per-chained-call */
            $(menu).find('li').removeClass(parent_active).find('a').removeClass(child_active)
                .end().end().find(hash).addClass(parent_active).find('a').addClass(child_active);
            $(content).find('> div').addClass(hidden_class)
                .end().find(`div${hash}-content`).removeClass(hidden_class);
            /* eslint-enable newline-per-chained-call */
        }
    }
};

module.exports = {
    isEmptyObject   : isEmptyObject,
    animateAppear   : animateAppear,
    animateDisappear: animateDisappear,
    addComma        : addComma,
    handleActive    : handleActive,
};
