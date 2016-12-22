module.exports = {
    all: {
        files: [
            {dest: global.dist + '/css/style.min.css', src: ['src/css/external/**/*.css', global.dist + '/css/style.css']},
        ]
    }
};
