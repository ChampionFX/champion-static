module.exports = function (grunt) {
    var colors = {
        error: '\\033[0;31m',
        info : '\\033[0;32m',
        warn : '\\033[1;33m',
        reset: '\\033[0m',
    };
    var prompt = (message, type) => (`echo "${colors[type || 'info']}>>${colors.reset} ${message}"`);
    var ghpagesCommand = () => (
        [
            `cd ${process.cwd()}/.grunt/grunt-gh-pages/gh-pages/all`,
            prompt('Updating...'),
            'git fetch origin gh-pages --quiet',
            'git reset --hard origin/gh-pages --quiet'
        ].join(' && ')
    );

    return {
        compile_dev: {
            command: global.compileCommand('-f -d'),
            options: {
                stdout: true
            }
        },
        compile_production: {
            command: global.compileCommand('-f'),
            options: {
                stdout: true
            }
        },
        sitemap: {
            command: 'cd ' + process.cwd() + '/scripts && carton exec perl sitemap.pl',
            options: {
                stdout: true
            }
        },
        make_cname: {
            command: 'git config --get remote.origin.url',
            options: {
                callback: function (err, stdout, stderr, cb) {
                    if(!err) {
                        if(grunt.option('cleanup') || grunt.option('reset')) {
                            var origin = stdout.replace('\n', ''),
                                CNAME;
                            if (origin === global.repo_info.origin) {
                                CNAME = global.repo_info.CNAME;
                            }
                            if (CNAME) {
                                grunt.file.write(global.dist + '/CNAME', CNAME + "\n");
                                grunt.log.ok('CNAME file created: ' + CNAME);
                            } else {
                                grunt.log.error('CNAME file is not created: remote origin does not match.');
                            }
                        }
                    }
                    cb();
                },
                stdout: false
            }
        },
        check_origin: {
            command: 'git config --get remote.origin.url',
            options: {
                callback: function (err, stdout, stderr, cb) {
                    if(!err) {
                        var origin = stdout.replace('\n', '');
                        grunt.log.ok('Remote origin: ' + origin);
                        if (global.release_target) {
                            if (origin !== global.repo_info.origin) {
                                grunt.fail.fatal('Your remote origin does not match the repository.');
                            }
                        } else {
                            grunt.fail.fatal('Target is required: use --beta or --production or --translations to do a release.');
                        }
                    }
                    cb();
                },
                stdout: false
            }
        },
        check_branch: {
            command: 'git symbolic-ref --short HEAD',
            options: {
                callback: function (err, stdout, stderr, cb) {
                    if(!err) {
                        var branch = stdout.replace('\n', '');
                        grunt.log.ok('Current branch: ' + branch);
                        if (global.release_target) {
                            if (branch !== global.release_info[global.release_target].branch) {
                                grunt.fail.fatal('Current branch is not correct.\nIn order to release to ' + global.release_target.toUpperCase() + ', please checkout the "' + global.release_info[global.release_target].branch + '" branch.');
                            }
                        } else {
                            grunt.fail.fatal('Target is required: use --beta or --production or --translations to do a release.');
                        }
                    }
                    cb();
                },
                stdout: false
            }
        },
        reset_ghpages: {
            command: grunt.option('reset') ?
                [
                    ghpagesCommand(),
                    prompt('Resetting to the first commit...'),
                    'git reset $(git rev-list --max-parents=0 --abbrev-commit HEAD) --quiet',
                    prompt('Pushing to origin...'),
                    'git push origin gh-pages -f --quiet',
                    prompt('Cleaning up...'),
                    'git reset --hard origin/gh-pages --quiet'
                ].join(' && ') :
                prompt('Reset runs only when --reset is available.', 'warn'),
            options: {
                stdout: true
            }
        },
        remove_folder: {
            command: grunt.option('folder') ?
                [
                    ghpagesCommand(),
                    prompt('Removing folders...'),
                    `rm -rf ${grunt.option('folder').split(',').join(' ')}`,
                    prompt('Committing...'),
                    'git commit -a -m "Remove folders" --quiet',
                    prompt('Pushing to origin...'),
                    'git push origin gh-pages --quiet'
                ].join(' && ') :
                prompt('Need to specify folders to remove: --folder=br_fix,br_beta,...', 'warn'),
            options: {
                stdout: true
            }
        },
    }
};
