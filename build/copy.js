module.exports = {
    all: {
        files: [
            {
                expand: true,
                src: [
                    'index.html',
                    '404.html',
                    'sitemap.xml',
                    'robots.txt'
                ],
                dest: global.dist
            },
            { expand: true, cwd: 'src/images/', src: ['**'], dest: global.dist + '/images/', },
            { expand: true, cwd: 'src/download/', src: ['**'], dest: global.dist + '/download/' },
            { expand: true, cwd: 'src/css/external/', src: ['*.css'], dest: global.dist + '/css/' },
        ]
    }
};
