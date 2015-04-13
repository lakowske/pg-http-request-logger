/*
 * (C) 2015 Seth Lakowske
 */

var through2 = require('through2');

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

            var insertRequest = 'insert into requests (host, cookie, remoteAddress, method, url, user_agent) VALUES ($1, $2, $3, $4, $5, $6);';

             client.query(insertRequest,
                         [request.host,
                          request.cookie,
                          request.remoteAddress,
                          request.method,
                          request.url,
                          request['user-agent']],
                         function(err, result) {

                             if (err) {
                                 console.log('error while inserting request:', err)
                                 cb();
                                 return;
                             }

                             self.push(request);

                             cb();

                         })

        }))

    })
}

/*
 * If a request table does not exist, create the table.
 */
function requestTable(client, callback) {

    uuidExtension(client, function(err, result) {

        var createRequests = 'create table if not exists requests ('
            + 'request_id uuid primary key default uuid_generate_v4(),'
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

function deleteRequestTable(client, callback) {

    var deleteRequests = 'drop table requests'

    client.query(deleteRequests, callback);

}

function uuidExtension(client, callback) {

    var extension = 'CREATE EXTENSION "uuid-ossp";';

    client.query(extension, callback);

}

module.exports.requestTable       = requestTable;
module.exports.deleteRequestTable = deleteRequestTable;
module.exports.dbify              = dbify;
