const path = require("path");
const fs = require("fs");
const express = require("express");
const app = express();
// const https = require("https");
const http = require("http");
// const server = https.createServer(
//   {
//     key: fs.readFileSync(path.join(__dirname, "keys", "server.key")),
//     cert: fs.readFileSync(path.join(__dirname, "keys", "server.cert"))
//   },
//   app
// );
const server = http.createServer(app);
const io = require("socket.io")(server);
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.use('/audio', express.static('public/bot-test'));

let rooms = [];

io.on("connection", function(socket) {
  console.log("a user connected");

  socket.on("create or join", function(room) {
    console.log("create or join to room ", room);

    var myRoom = io.sockets.adapter.rooms[room] || { length: 0 };
    var numClients = myRoom.length;

    console.log(room, " has ", numClients, " clients");

    if (numClients === 0) {
      socket.join(room);
      socket.emit("created", room);
      
      rooms.push(room);
    } else if (numClients === 1) {
      socket.join(room);
      socket.emit("joined", room);
    } else {
      socket.emit("full", `Sorry room '${room}' are full.`);
    }
  });

  socket.on("ready", function(room) {
    socket.broadcast.to(room).emit("ready");
  });

  socket.on("candidate", function(event) {
    socket.broadcast.to(event.room).emit("candidate", event);
  });

  socket.on("offer", function(event) {
    socket.broadcast.to(event.room).emit("offer", event.sdp);
  });

  socket.on("answer", function(event) {
    socket.broadcast.to(event.room).emit("answer", event.sdp);
  });
});

server.listen(port);
console.log(`Server running at http://localhost:${port}`);