function isEmptyObject(obj) {
    let isEmpty = true;
    if (obj && obj instanceof Object) {
        Object.keys(obj).forEach(function(key) {
            if (key in obj) isEmpty = false;
        });
    }
    return isEmpty;
}

module.exports = {
    isEmptyObject: isEmptyObject,
};
