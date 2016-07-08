var fs = require('fs'),
    path = require('path'),
    io = require('socket.io'),
    childProcess = require('child_process');

function createSocketIoServer(server) {
    var socket = io.listen(server);

    createListeners(socket);
}

function createListeners(socket) {
    var clients = [];

    socket.on('connection', function (client) {
        addClient(client);

        function sendToAllClients(eventName, data) {
            for (var i = 0; i < clients.length; i++) {
                clients[i].emit(eventName, data)
            }
        }

        client.on('file', function (data, callback) {
            fs.readFile(data.fileName, function (err, fileData) {
                if (err) {
                    console.log("File " + data.fileName + " not present");
                } else {
                    callback({fileName: data.fileName, content: fileData.toString()});
                }
            });
        });

        client.on('changeFile', function (data) {
            fs.writeFile(data.fileName, data.content);
            sendToAllClients('file', data);
        });

        client.on('execute', function (data, callback) {
            childProcess.exec(data.command, function (error, stdout) {
                data = {fileName: data.fileName, output: error == null ? stdout : error.toString()};

                callback(data);
                sendToAllClients('executionResult', data);
            });
        });

        client.on('disconnect', function () {
            removeClient(client);
        });
    });

    function addClient(client) {
        clients.push(client);
    }

    function removeClient(client) {
        var index = clients.indexOf(client);
        if (index != -1) {
            clients.splice(index, 1);
        }
    }
}

module.exports = {
    createSocketIoServer: createSocketIoServer
};