/*
 * (C) 2015 Seth Lakowske
 */

function flatten(flat, object, prefix, callback) {
    var keys = Object.keys(object);

    for (var i = 0 ; i < keys.length ; i++) {
        var key = keys[i];
        var value = object[key];

        callback(key, value, (value instanceof Object), flat, object, prefix);

        if (value instanceof Object) {
            flatten(flat, value, prefix + key + '/', callback);
        }

    }

    return flat;
}

function preserve(key, value, isObject, flat, object, prefix) {
    var flatKey = prefix + key;
    flat[flatKey] = value;
}

function flattenAndRemove(key, value, isObject, flat, object, prefix) {
    var flatKey = prefix + key;
    if (value instanceof Object) {
        delete object[key];
    } else {
        flat[flatKey] = value;
    }
}

module.exports.flatten = flatten;
module.exports.preserve = preserve;
module.exports.flattenAndRemove = flattenAndRemove;
