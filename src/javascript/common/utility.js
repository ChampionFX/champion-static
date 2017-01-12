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

function addComma(num, decimal_points) {
    num = String(num || 0).replace(/,/g, '') * 1;
    return num.toFixed(decimal_points || 2).toString().replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
        return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, '$&,');
    });
}

// function used on any page that has tab menu to
// show the correct tab/content if hash is changed in url
function handleActive() {
    const hash = window.location.hash,
        menu = '.tab-menu-wrap',
        content = '.tab-content-wrapper';
    if (menu && content && hash) {
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

function range(start, end) {
    return Array.from(Array((end - start) + 1).keys()).map(i => i + start);
}

function initDropDown($ddl, first) {
    if (!$ddl.length) return false;
    $ddl.empty();
    if (first) {
        $ddl.append($('<option/>', { text: first, value: '' }));
    }
    return true;
}

function dropDownNumbers($ddl, start, end, first) {
    if (!initDropDown($ddl, first)) return;
    range(start, end).forEach((n) => {
        $ddl.append($('<option/>', { text: n, value: n }));
    });
}

function dropDownMonths($ddl, first) {
    if (!initDropDown($ddl, first)) return;
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        .forEach((m, i) => {
            $ddl.append($('<option/>', { text: m, value: i + 1 }));
        });
}

function dropDownFromObject($ddl, obj_array, default_value, first) {
    if (!initDropDown($ddl, first)) return;
    obj_array.forEach((obj) => {
        const $option = $('<option/>', { text: obj.text, value: obj.value });
        if (default_value === obj.value) {
            $option.attr('selected', 'selected');
        }
        if (obj.disabled) {
            $option.attr('disabled', '1');
        }
        $ddl.append($option);
    });
}

function isValidDate(day, month, year) {
    // Assume not leap year by default (note zero index for Jan)
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // If evenly divisible by 4 and not evenly divisible by 100,
    // or is evenly divisible by 400, then a leap year
    if (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)) {
        daysInMonth[1] = 29;
    }
    return day <= daysInMonth[--month];
}

function padLeft(text, len, char) {
    text = String(text || '');
    return text.length >= len ? text : `${Array((len - text.length) + 1).join(char)}${text}`;
}

module.exports = {
    isEmptyObject     : isEmptyObject,
    animateAppear     : animateAppear,
    animateDisappear  : animateDisappear,
    addComma          : addComma,
    handleActive      : handleActive,
    dropDownNumbers   : dropDownNumbers,
    dropDownMonths    : dropDownMonths,
    dropDownFromObject: dropDownFromObject,
    isValidDate       : isValidDate,
    padLeft           : padLeft,
};
