/*
 * (C) 2015 Seth Lakowske
 */

var pg       = require('pg');
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

            var insertRequest = 'insert into requests (host, cookie, remoteAddress, method, url, user_agent)'
            //TODO move data to string
            
            client.query(insertRequest, function(err, result) {

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

    var createRequests = 'create table if not exists requests (request_id uuid primary key default uuid_generate_v4(),'
        + 'request_time timestamp with timezone'
        + 'host text,'
        + 'cookie text,'
        + 'remoteAddress text not null,'
        + 'method text not null,'
        + 'url text not null,'
        + 'user_agent text'
    client.query(createRequests, callback);

}
