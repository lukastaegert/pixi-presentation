var express = require('express'),
    http = require('http'),
    path = require('path'),
    minimist = require('minimist'),
    process = require('process');

var videoStreamer = require('./video-streamer'),
    liveEditingServer = require('./live-editing-server');

var serverMainDirectory = path.resolve(__dirname + "/../..");
process.chdir(serverMainDirectory);

var args = minimist(process.argv.slice(2));
var port = args.port || 8000;

var app = express();
var server = http.createServer(app);
liveEditingServer.createSocketIoServer(server);
server.listen(port);

videoStreamer.bindVideoStreamerTo(app);
app.use(express.static(serverMainDirectory));

console.log("Server listening on localhost:" + port);

