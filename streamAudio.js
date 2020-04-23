const fs = require('fs');
const http = require('http');

let filePath = './public/bot-test/StarWars60.wav';
let stat = fs.statSync(filePath);

http
  .createServer((request, response) => {

    response.writeHead(200, {
        'Content-Type': 'audio/wav',
    });


    fs.createReadStream(filePath).pipe(response);
  })
  .listen(8080);