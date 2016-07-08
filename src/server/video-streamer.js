var fs = require('fs'),
    fspath = require('path');

function bindVideoStreamerTo(app) {
    app.get('/media/**', getVideoFile);
}

function getVideoFile(req, res) {
    console.log("Media file " + req.path);

    var path = __dirname + "/../../" + req.path;

    if (!fs.existsSync(path)) {
        res.status(404).send('Not found');
        console.log('not found');
    }

    var stat = fs.statSync(path);
    var total = stat.size;
    var file;

    if (req.headers.range) {   // meaning client (browser) has moved the forward/back slider
        // which has sent this request back to this server logic ... cool
        var range = req.headers.range;
        var parts = range.replace(/bytes=/, "").split("-");
        var partialStart = parts[0];
        var partialEnd = parts[1];

        var start = parseInt(partialStart, 10);
        var end = partialEnd ? parseInt(partialEnd, 10) : total-1;
        var chunkSize = (end-start)+1;
        console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunkSize);

        file = fs.createReadStream(path, {start: start, end: end});
        res.writeHead(206, {
            'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/' + getMimeType(path)
        });
        file.pipe(res);

    } else {
        console.log('ALL: ' + total);

        res.writeHead(200, {
            'Content-Length': total,
            'Content-Type': 'video/' + getMimeType(path)
        });
        fs.createReadStream(path).pipe(res);
    }
}

function getMimeType(path) {
    var extension = fspath.extname(path).substr(1);

    if (extension === 'mp4') {
        return 'mp4';
    } else if (extension === 'ogv') {
        return 'ogg';
    } else {
        return extension;
    }
}

module.exports = {
    bindVideoStreamerTo: bindVideoStreamerTo
};