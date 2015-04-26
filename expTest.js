/*
 * (C) 2015 Seth Lakowske
 */

var test    = require('tape');
var reqExp  = require('./requestExpansion');

test('can flaten and preserve', function(t) {

    var obj = { a : { b : 'hello', c : 'wisconsin' }, b : 'goodbye'}

    reqExp.flatten(obj, obj, '', reqExp.preserve);
    console.log(obj);
    t.end();
})

test('can flaten and remove', function(t) {

    var obj = { a : { b : 'hello', c : 'wisconsin' }, b : 'goodbye'}

    reqExp.flatten(obj, obj, '', reqExp.flattenAndRemove);
    console.log(obj);
    t.end();
})
