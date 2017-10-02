(function ($) {
    $.fn.setVisibility = function(make_visible) {
        this[(make_visible ? 'remove' : 'add') + 'Class']('invisible');
        return this;
    };
})(jQuery);
