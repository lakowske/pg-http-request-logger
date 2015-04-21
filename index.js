/*
 * (C) 2015 Seth Lakowske
 */

var through2 = require('through2');
var uuid     = require('node-uuid');

function request() {

    var dbify       = this.reqPersister.dbify();

    return function(req, res) {
        var millis                   = Date.now();
        var reqDescription           = req.headers;
        reqDescription.url           = req.url;
        reqDescription.time          = millis;
        reqDescription.remoteAddress = req.connection.remoteAddress;
        reqDescription.method        = req.method;

        dbify.write(reqDescription);
    };

}

/*
 * Create a request stream.  The callback is passed an error if the table could not be
 * verified or created.  Otherwise, a stream usable stream is passed to the callback.
 */
function dbify(client, callback) {

    requestTable(client, function(err, result) {

        if (err) {
            console.log('error while verifying/creating request table:', err);
            callback(err);
            return;
        }

        callback(null, through2.obj(function(request, enc, cb) {
            var self = this;

            insertRequest(client, request, function(err, result) {
                if (err) {
                    console.log('error while inserting request:', err)
                    cb();
                    return;
                }

                self.push(request);

                cb();

            });

        }));

    })
}

/*
 * If a request table does not exist, create the table.
 */
function requestTable(client, callback) {

    uuidExtension(client, function(err, result) {

        var createRequests = 'create table if not exists requests ('
            + 'request_id text primary key,'
            + 'request_time timestamptz DEFAULT current_timestamp,'
            + 'host text,'
            + 'cookie text,'
            + 'remoteAddress text not null,'
            + 'method text not null,'
            + 'url text not null,'
            + 'user_agent text'
            + ')'

        console.log(createRequests);

        client.query(createRequests, callback);

    })

}

function insertRequest(client, request, callback) {

    var insertRequest = 'insert into requests (request_id, host, cookie, remoteAddress, method, url, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7);';

    var id = request.request_id;

    if (id === undefined) id = uuid.v4();

    client.query(insertRequest,
                 [id,
                  request.host,
                  request.cookie,
                  request.remoteAddress,
                  request.method,
                  request.url,
                  request['user-agent']],
                 function (err, result) {
                     callback(err, result, id);
                 }
                )

    return id;
}

function dropRequestTable(client, callback) {

    var dropRequests = 'drop table requests cascade'

    client.query(dropRequests, callback);

}

function uuidExtension(client, callback) {

    var extension = 'CREATE EXTENSION "uuid-ossp";';

    client.query(extension, callback);

}

module.exports.uuidExtension      = uuidExtension;
module.exports.requestTable       = requestTable;
module.exports.insertRequest      = insertRequest;
module.exports.dropRequestTable   = dropRequestTable;
module.exports.dbify              = dbify;
