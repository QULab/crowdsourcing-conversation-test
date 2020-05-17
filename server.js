const path = require("path");
const fs = require("fs");
const express = require("express");
const app = express();
const router = express.Router();
const cors = require('cors');
const session = require('express-session');
const http = require("http");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const server = http.createServer(app);
const io = require("socket.io")(server);
const basicAuth = require('express-basic-auth');
// let filePath = './public/assets/sup23_selected_1min/01_2.wav';
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36";
const moment = require('moment');
// const csv = require('csv-express');
const json2csv = require('json-2-csv');
const port = process.env.PORT || 3000;
let ipAdress;
let fileName;
// TODO session management
app.set('view engine', 'ejs');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());


app.use(express.static(path.join(__dirname, "public")));

app.use('/user-test', express.static('public/user-test'));

//app.use('/newapp', express.static('public/restructure-html'));

app.use('/user-user', express.static('public/user-user'));

app.get('/stream', (req, res) => {
  console.log(req.query);
  fileName = req.query.fileName;
  console.log(fileName);
  res.writeHead(200, {
    'Content-Type': 'audio/wav',
  });
  let filePath = streamSwitcher(fileName.toString());
  console.log(filePath);
  fs.createReadStream(filePath).pipe(res);
});

function streamSwitcher(fileName) {
  switch (fileName) {
    case '01_2.wav':

      return './public/assets/sup23_selected_1min/01_2.wav';
    case '17_2.wav':

      return './public/assets/sup23_selected_1min/17_2.wav';
    case '21_2.wav':

      return './public/assets/sup23_selected_1min/21_2.wav';
    case '32_2.wav':

      return './public/assets/sup23_selected_1min/32_2.wav';
    case '46_2.wav':

      return './public/assets/sup23_selected_1min/46_2.wav';
    default:
      return 'file not found';
  }
}

// change for server docker
// mongoose.connect('mongodb://mongo:27017/webrtc', {
//   useNewUrlParser: true
// });

mongoose.connect('mongodb://localhost:27017/webrtc', {
  useNewUrlParser: true
});


// mongodb connection
const schema = mongoose.Schema;

let statSchema = new schema({
  url: { type: String },
  roomNumber: { type: Number },
  verificationCode: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  browser: { type: String },
  os: { type: String },
  statistics: { type: JSON, required: true },
  type: { type: String, required: true },
  rating: { type: String },
  fileName: { type: String },
  ipAdress: { type: Number },
  testDuration: { type: Number }
});

// let statSchema = new mongoose.Schema({},
//   {strict:false }
// );

let statModel = mongoose.model("stats", statSchema);

// post to mongodb

app.post('/stats', async (req, res) => {

  ipAdress = req.connection.remoteAddress;

  let browserType = req.get('user-agent');
  console.log('Got body:', req.body);
  let body = req.body;
  const stats = new statModel(req.body);

  try {
    //stats.browser = device;
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
}), async (req, res) => {
  // console.log(device);

  statModel.find().sort({ timestamp: 'desc' }).then(data => {
    res.render('data.ejs', { data: data, moment: moment });
  }).catch(res.status(500));
});

app.get('/exporttocsv', basicAuth({
  challenge: true,
  users: { 'admin': 'supersecret' }
}), async (req, res) => {
    var ts = Date.now();
    var date = new Date(ts);
    var filename = date.toISOString() + "-conversationtest.csv";
    var dataArray;
  
  statModel.find({}).sort({ timestamp: 'desc' }).lean().exec({}).then(data => {
    json2csv.json2csv({ data: data }, function (err, csvStr) {
      if (err) {
        console.log(err);
        res.statusCode = 500;
        return res.end(err.message);
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader("Content-Disposition", 'attachment; filename=' + filename);
      res.status(200).send(csvStr);
    })
  }).catch(res.status(500));
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