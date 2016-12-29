module.exports = function (grunt) {

    global.repo_info = {
        origin: 'git@github.com:ChampionFX/champion-static.git',
        CNAME : 'www.champion-fx.com'
    };

    // map release parameters to required branch and target gh-pages subfolder
    global.release_info = {
        production  : {branch: 'master', target_folder: ''},
        beta        : {branch: 'beta'  , target_folder: 'beta'},
        translations: {branch: 'beta'  , target_folder: 'translations'},
    };

    Object.keys(global.release_info).forEach(function(target) {
        if (grunt.option(target)) {
            global.release_target = target;
        }
    });

    if (global.release_target) {
        global.branch_prefix = '';
        global.branch = global.release_info[global.release_target].target_folder;
    } else {
        global.branch_prefix = 'br_';
        global.branch = grunt.option('branch');
    }

    global.dist = 'dist' + (global.branch ? '/' + global.branch_prefix + global.branch : '');

    global.path = grunt.option('path');

    global.compileCommand = function(params) {
        return 'cd ' + process.cwd() + '/scripts && carton exec perl compile.pl ' + params + (global.branch ? ' -b ' + global.branch_prefix + global.branch : '') + (global.path ? ' -p ' + global.path : '') + ' && cd ..';
    };

    require('time-grunt')(grunt);

    require('load-grunt-config')(grunt, {
        configPath: process.cwd() + '/build',
        loadGruntTasks: {
            pattern: 'grunt-*',
            config: require('./package.json'),
            scope: 'devDependencies'
        }
    });

};
