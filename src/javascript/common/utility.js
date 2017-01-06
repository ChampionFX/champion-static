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

module.exports = {
    isEmptyObject   : isEmptyObject,
    animateAppear   : animateAppear,
    animateDisappear: animateDisappear,
    addComma        : addComma,
};
