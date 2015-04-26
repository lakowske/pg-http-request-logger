/*
 * (C) 2015 Seth Lakowske
 */

var through2     = require('through2');
var uuid         = require('node-uuid');
var useragent    = require('useragent');
var cookieparser = require('cookieparser');
var url          = require('url');
var reqExp       = require('./requestExpansion');

function request(req, res) {
    var agent = useragent.lookup(req.headers['user-agent']);
    var parsedAgent              = agent.toJSON();
    var cookie = cookieparser.parse(req.headers['cookie']);
    var urlParts = url.parse(req.url, true);
    var reqDescription           = req.headers;
    reqDescription.url           = req.url;
    reqDescription.remoteAddress = req.connection.remoteAddress;
    reqDescription.method        = req.method;
    reqDescription.agent         = parsedAgent;
    reqDescription.cookieparser  = cookie;
    reqDescription.urlparse      = urlParts;
    var flat = reqExp.flatten(reqDescription, reqDescription, '', reqExp.flattenAndRemove);
    return flat;
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

    var createRequests = 'create table if not exists requests ('
        + 'request_id text primary key,'
        + 'request_time timestamptz DEFAULT current_timestamp,'
        + 'host text,'
        + 'cookie text,'
        + 'remoteAddress text not null,'
        + 'method text not null,'
        + 'url text not null,'
        + 'user_agent text,'
        + 'json text not null DEFAULT \'\''
        + ')'

    console.log(createRequests);

    client.query(createRequests, callback);

}

function insertRequest(client, request, callback) {

    var insertRequest = 'insert into requests (request_id, host, cookie, remoteAddress, method, url, user_agent, json) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);';

    var id = request.request_id;

    if (id === undefined) id = uuid.v4();
    var json = JSON.stringify(request);
    client.query(insertRequest,
                 [id,
                  request.host,
                  request.cookie,
                  request.remoteAddress,
                  request.method,
                  request.url,
                  request['user-agent'],
                  json
                 ],
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

module.exports.request            = request;
module.exports.requestTable       = requestTable;
module.exports.insertRequest      = insertRequest;
module.exports.dropRequestTable   = dropRequestTable;
module.exports.dbify              = dbify;
