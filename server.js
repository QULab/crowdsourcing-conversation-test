const path = require("path");
const fs = require("fs");
const express = require("express");
const app = express();
const cors = require('cors');
const session = require('express-session');
// const https = require("https");
const http = require("http");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const DeviceDetector = require("device-detector-js");
let filePath = './public/user-test/StarWars60.wav';
// const server = https.createServer(
//   {
//     key: fs.readFileSync(path.join(__dirname, "keys", "server.key")),
//     cert: fs.readFileSync(path.join(__dirname, "keys", "server.cert"))
//   },
//   app
// );
const server = http.createServer(app);
const io = require("socket.io")(server);
const basicAuth = require('express-basic-auth')
const port = process.env.PORT || 3000;
// TODO session management
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());


//app.use(express.static(path.join(__dirname, "public")));

app.use('/audio', express.static('public/user-test'));

app.use('/newapp', express.static('public/restructure-html'));

app.use('/user-user', express.static('public/user-user'));

app.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'audio/wav',
  });

  fs.createReadStream(filePath).pipe(res);
})

// change for server docker
mongoose.connect('mongodb://localhost:27017/webrtc', {
  useNewUrlParser: true
});

// mongodb connection
const schema = mongoose.Schema;

let statSchema = new schema({
  verificationCode: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  browser: { type: JSON },
  statistics: {type: JSON, required: true},
  type: { type: String, required: true },
});

// let statSchema = new mongoose.Schema({},
//   {strict:false }
// );

let statModel = mongoose.model("stats", statSchema);

// post to mongodb

app.post('/stats', async (req, res) => {

  let browserType = req.get('user-agent');
  console.log('Got body:', req.body);
  let body = req.body;
  const stats = new statModel(req.body);
  const deviceDetector = new DeviceDetector();
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36";
  const device = deviceDetector.parse(userAgent);

  // console.log(device);
  try {
    stats.browser = device;
    await stats.save();
    res.send(stats);
  } catch (err) {
    res.status(500).send(err);
  }
  // console.log(req.headers);
  // console.log(req.get('user-agent'));
});

// get from mongodb

app.get('/stats', basicAuth({
  challenge: true,
  users: { 'admin': 'supersecret' }
}) ,async (req, res) => {
   // console.log(device);
   try {
    statModel.find({}, function(err, data){
      res.send(data);
    })
    //res.send(stats);
  } catch (err) {
    res.status(500).send(err);
  }
})

let rooms = [];

io.on("connection", function (socket) {
  console.log("a user connected");

  socket.on("create or join", function (room) {
    console.log("create or join to room ", room);

    let myRoom = io.sockets.adapter.rooms[room] || { length: 0 };
    let numClients = myRoom.length;

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

  socket.on("ready", function (room) {
    socket.broadcast.to(room).emit("ready");
  });

  socket.on("candidate", function (event) {
    socket.broadcast.to(event.room).emit("candidate", event);
  });

  socket.on("offer", function (event) {
    socket.broadcast.to(event.room).emit("offer", event.sdp);
  });

  socket.on("answer", function (event) {
    socket.broadcast.to(event.room).emit("answer", event.sdp);
  });
});

server.listen(port);
console.log(`Server running at http://localhost:${port}`);