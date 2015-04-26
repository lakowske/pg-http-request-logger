/*
 * (C) 2015 Seth Lakowske
 */

var test       = require('tape');
var pg         = require('pg');
var through2   = require('through2');
var pgReq      = require('./');
var expText    = require('./expTest');

test('can create a request table', function(t) {

    var user = process.env['USER'];
    var connection = 'postgres://'+user+'@localhost/request';

    var client = new pg.Client(connection);

    client.connect(function(err) {

        if (err) {
            return console.error('error fetching client from pool', err);
        }

        pgReq.requestTable(client, function(err, result) {

            t.notOk(err);

            pgReq.dropRequestTable(client, function(err, result) {
                t.notOk(err)
                client.end();
                t.end();
            })


        })

    })

})

test('can insert a request', function(t) {

    var user = process.env['USER'];
    var connection = 'postgres://'+user+'@localhost/request';

    var client = new pg.Client(connection);

    client.connect(function(err) {

        pgReq.dbify(client, function(err, dbify) {

            var gotObj = false;

            var recorder = through2.obj(function(result, enc, cb) {
                console.log(result);
                if (result) {
                    gotObj = true;
                }

                this.push(result);

                cb();
            })

            recorder.on('finish', function() {
                t.ok(gotObj);
                client.end();
                t.end();
            })


            dbify.pipe(recorder);


            dbify.write({host:'sethlakowske.com', cookie:'yum', remoteAddress:'10.0.0.1',
                         method:'GET', url:'/', 'user-agent':'secret agent man'})

            dbify.end();
        })


    })
})
