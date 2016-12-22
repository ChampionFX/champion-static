module.exports = function (grunt) {
    var is_cleanup   = !!grunt.option('cleanup'),
        cleanup_only = global.branch ? [global.branch_prefix + global.branch + '/.'] : (global.release_target ? ['.', '!beta/.', '!translations/.'] : ['.']),
        source       = global.branch ? [global.branch_prefix + global.branch + '/**'] : ['**/*', '!' + (global.branch_prefix || 'br_') + '*/**', '!translations/**', '!beta/**'];

    return {
        all: {
            options: {
                base   : 'dist',
                add    : (is_cleanup ? false : true),
                only   : cleanup_only,
                message: 'Auto-generated commit',
            },
            src: source
        }
    }
};
