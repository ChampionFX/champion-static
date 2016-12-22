module.exports = function (grunt) {
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
                        if(grunt.option('cleanup')) {
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
        }
    }
};
