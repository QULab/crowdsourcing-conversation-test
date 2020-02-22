const fs = require('fs');
const http = require('http');

let filePath = './public/assets/StarWars60.wav';
let stat = fs.statSync(filePath);

//const musicStream = fs.createReadStream(process.argv[2]);

http
  .createServer((request, response) => {
    //var queryData = url.parse(request.url, true).query;
    // const skip = typeof(queryData.skip) == 'undefined' ? 0 : queryData.skip;
    // const startByte = stat.size * skip;

    response.writeHead(200, {
        'Content-Type': 'audio/wav',
    });

    // We replaced all the event handlers with a simple call to util.pump()
    fs.createReadStream(filePath).pipe(response);
  })
  .listen(8080);