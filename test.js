/*
 * (C) 2015 Seth Lakowske
 */

var test  = require('tape');
var pg    = require('pg');
var pgReq = require('./');

test('can create a request table', function(t) {

    var connection = 'postgres://slakowske@localhost/request'

    var client = new pg.Client(connection);

    client.connect(function(err) {

        if (err) {
            return console.error('error fetching client from pool', err);
        }

        pgReq.requestTable(client, function(err, result) {

            t.notOk(err);

            pgReq.deleteRequestTable(client, function(err, result) {
                t.notOk(err)
                console.log(result);
                client.end();
                t.end();
            })


        })

    })

})
