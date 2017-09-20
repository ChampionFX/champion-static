require('jquery.scrollto');

function showLoadingImage(container, theme = 'dark') {
    container.empty().append(`<div class="barspinner ${theme}"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div>`);
}

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
    if ($(menu).length > 0 && $(content).length > 0) {
        // tabListener is called from binary-style
        // to init when page loaded with pjax
        tabListener();
        if (hash) {
            const parent_active = 'active';
            const child_active  = 'a-active';
            const hidden_class  = 'invisible';

            $(menu)
                .find('li')
                .removeClass(parent_active)
                .find('span')
                .removeClass(child_active);

            let $tab_to_show = $(hash);
            // if hash is a subtab or has subtabs
            if ($tab_to_show.find('.tm-li-2').length > 0 || /tm-li-2/.test($(hash).attr('class'))) {
                $tab_to_show =
                    $tab_to_show
                        .find('.tm-a-2')
                        .first()
                        .addClass(child_active)
                        .closest('.tm-li');
            }
            $tab_to_show.addClass(parent_active);

            let content_to_show = `div${hash}-content`;
            if ($(content_to_show).length === 0) {
                content_to_show = `div#${$(hash).find('.tm-li-2').first().attr('id')}-content`;
            }
            $(content)
                .find('> div')
                .addClass(hidden_class)
                .end()
                .find(content_to_show)
                .removeClass(hidden_class);

            $.scrollTo($(hash), 500, { offset: getOffset(-5) });
        }
    }
}

function initDropDown($ddl, first) {
    if (!$ddl.length) return false;
    $ddl.empty();
    if (first) {
        $ddl.append($('<option/>', { text: first, value: '' }));
    }
    return true;
}

function dropDownFromObject($ddl, obj_array, default_value, first) {
    if (!initDropDown($ddl, first)) return;
    obj_array.forEach((obj) => {
        const $option = $('<option/>', { text: obj.text, value: obj.value });
        if (default_value === obj.value) {
            $option.prop('selected', true);
        }
        if (obj.disabled) {
            $option.attr('disabled', true);
        }
        $ddl.append($option);
    });
}

function padLeft(text, len, char) {
    text = String(text || '');
    return text.length >= len ? text : `${Array((len - text.length) + 1).join(char)}${text}`;
}

function toISOFormat(date) {
    return date.format('YYYY-MM-DD');
}

/*
 * function to check if browser supports the type date/time
 * send a wrong val in case browser 'pretends' to support
 */
function checkInput(type, wrongVal) {
    const input = document.createElement('input');
    input.setAttribute('type', type);
    input.setAttribute('value', wrongVal);
    return (input.value !== wrongVal);
}

/*
 * function to check if new date is selected using native picker
 * if yes, update the data-value. if no, return false.
 */
function dateValueChanged(element, type) {
    if (element.getAttribute('data-value') === element.value) {
        return false;
    }
    if (element.getAttribute('type') === type) {
        element.setAttribute('data-value', element.value);
    }
    return true;
}

function template(string, content) {
    return string.replace(/\[_(\d+)\]/g, function(s, index) {
        return content[(+index) - 1];
    });
}

function cloneObject(obj) {
    return !isEmptyObject(obj) ? $.extend({}, obj) : obj;
}

function getPropertyValue(obj, keys) {
    if (!Array.isArray(keys)) keys = [keys];
    if (!isEmptyObject(obj) && keys[0] in obj && keys && keys.length > 1) {
        return getPropertyValue(obj[keys[0]], keys.slice(1));
    }
    // else return clone of object to avoid overwriting data
    return obj ? cloneObject(obj[keys[0]]) : undefined;
}

function compareBigUnsignedInt(a, b) {
    a = numberToString(a);
    b = numberToString(b);
    const max_length = Math.max(a.length, b.length);
    a = padLeft(a, max_length, '0');
    b = padLeft(b, max_length, '0');
    return a > b ? 1 : (a < b ? -1 : 0); // lexicographical comparison
}

function numberToString(n) {
    return (typeof n === 'number' ? String(n) : n);
}

function slideIn(element) {
    element.addClass('slide-in').removeClass('slide-out')
        .animate({ opacity: 1 }, 100);
    setPosition($('body'), 'fixed');
}

function slideOut(element) {
    element.addClass('slide-out').removeClass('slide-in');
    setPosition($('body'), 'relative');
}

function setPosition(element, type) {
    element.css({ position: type });
}

function getOffset(offset = 0) {
    return -$('#top_group.logged-in').height() + (offset || -10);
}

function showLightBox(id, contents, has_close_button) {
    const $lightbox = $('<div/>', { id: id || '', class: 'lightbox' })
            .append($('<div/>', { class: 'lightbox-contents', html: contents }));

    if (has_close_button) {
        $lightbox.find('.lightbox-contents').prepend($('<div/>', { class: 'close' }));
        $lightbox.on('click', function(e) {
            if (e.target === this || $(e.target).hasClass('close')) {
                $lightbox.remove();
            }
        });
    }

    $('body').append($lightbox);
}

function showSuccessPopup(title, contents) {
    const $contents = $('<div/>', { class: 'center-text' }).append(
        $('<div/>', { class: 'main-image' }),
        $('<h3/>', { text: title }),
        $('<div/>', { class: 'success-contents', html: contents }));

    showLightBox('success_popup', $contents, true);
}

module.exports = {
    showLoadingImage  : showLoadingImage,
    isEmptyObject     : isEmptyObject,
    animateAppear     : animateAppear,
    animateDisappear  : animateDisappear,
    addComma          : addComma,
    handleActive      : handleActive,
    dropDownFromObject: dropDownFromObject,
    padLeft           : padLeft,
    toISOFormat       : toISOFormat,
    checkInput        : checkInput,
    dateValueChanged  : dateValueChanged,
    template          : template,
    getPropertyValue  : getPropertyValue,
    slideIn           : slideIn,
    slideOut          : slideOut,
    getOffset         : getOffset,
    showLightBox      : showLightBox,
    showSuccessPopup  : showSuccessPopup,

    compareBigUnsignedInt: compareBigUnsignedInt,
};
