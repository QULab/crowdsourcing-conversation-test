const path = require("path");
const fs = require("fs");
const express = require("express");
const app = express();
const router = express.Router();
const cors = require('cors');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const redis = require('redis');
const redisStore = require('connect-redis')(session);
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
const { Parser } = require('json2csv');
const redisClient = redis.createClient(6379, "webrtc-redis");
// const redisClient = redis.createClient();
let sessionID;

const port = process.env.PORT || 3000;
let ipAddress;
let fileName;
// TODO session management
app.set('view engine', 'ejs');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

// change for server docker
// mongoose.connect('mongodb://mongo:27017/webrtc', {
//   useNewUrlParser: true
// });

mongoose.connect('mongodb+srv://pavan:bitnance210@cluster0.0il5v.mongodb.net/webtrc?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true 
});

// redis 
redisClient.on('error', (err) => {
  console.log('Redis error: ', err);
});

app.use(session({
  genid: (req) => {
    return uuidv4();
  },
  store: new redisStore({ host: 'redis', port: 6379, client: redisClient }),
  name: 'webrtc',
  secret: "54F962E6ECF99",
  resave: false,
  cookie: { secure: false, maxAge: 60 * 60 * 24 }, // Set to secure:false and expire in 1 minute for demo purposes
  saveUninitialized: true
}));

app.use((req, res, next) => {
  sessionID = req.sessionID
  console.info(req.sessionID);
  let fileP = req.query.fileName;
  if(fileP != null){
  fileP = streamSwitcher(fileP);
  if(fileP == "file not found"){
    res.sendFile('404.html', { root: "public" });
  }
}
  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.use('/user-test', express.static('public/user-test'));

app.use('/delay', express.static('public/delay'));

//app.use('/newapp', express.static('public/restructure-html'));

app.use('/user-user', express.static('public/user-user'));

app.get('/stream', (req, res) => {
  console.log(req.query);
  fileName = req.query.fileName;
  console.log(fileName);
  let filePath = streamSwitcher(fileName.toString());
  let stat = fs.statSync(filePath);

  let chunkSize = 1024 * 1024;
  if (stat.size > chunkSize * 2) {
    chunkSize = Math.ceil(stat.size * 1);
  }
  let range = (req.headers.range) ? req.headers.range.replace(/bytes=/, "").split("-") : [];

  range[0] = range[0] ? parseInt(range[0], 10) : 0;
  range[1] = range[1] ? parseInt(range[1], 10) : range[0] + chunkSize;
  if (range[1] > stat.size - 1) {
    range[1] = stat.size - 1;
  }
  range = { start: range[0], end: range[1] };
  console.log(filePath);
  res.writeHead(200, {
    'Content-Type': 'audio/wav',
    'Content-Range': 'bytes ' + range.start + '-' + range.end + '/' + stat.size,
    'Content-Length': range.end - range.start,
  });
  fs.createReadStream(filePath).pipe(res);
});

function streamSwitcher(fileName) {
  switch (fileName) {
    case '01_2':

      return './public/assets/sup23_selected_1min/01_2.wav';
    case '17_2':

      return './public/assets/sup23_selected_1min/17_2.wav';
    case '21_2':

      return './public/assets/sup23_selected_1min/21_2.wav';
    case '32_2':

      return './public/assets/sup23_selected_1min/32_2.wav';
    case '46_2':

      return './public/assets/sup23_selected_1min/46_2.wav';
    default:
      return 'file not found';
  }
}

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
  ipAddress: { type: String },
  testDuration: { type: Number },
  sessionID: { type: String }
});

// let statSchema = new mongoose.Schema({},
//   {strict:false }
// );

let statModel = mongoose.model("stats", statSchema);

// post to mongodb

app.post('/stats', async (req, res) => {

  let ipAddress = req.connection.remoteAddress;

  let browserType = req.get('user-agent');
  console.log('Got body:', req.body);
  let body = req.body;
  const stats = new statModel(req.body);

  try {
    stats.ipAddress = ipAddress;
    stats.sessionID = sessionID;
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

  // statModel.find({}).sort({ timestamp: 'desc' }).lean().exec({}).then(data => {
  //   json2csv.json2csv({ data: data }, function (err, csvStr) {
  //     if (err) {
  //       console.log(err);
  //       res.statusCode = 500;
  //       return res.end(err.message);
  //     }
  //     res.setHeader('Content-Type', 'text/csv');
  //     res.setHeader("Content-Disposition", 'attachment; filename=' + filename);
  //     res.status(200).send(csvStr);
  //   })
  // }).catch(res.status(500));

    statModel.find().lean().exec({}, function (err, stats) {
      const json2csv = new Parser({});
      const csv = json2csv.parse(stats);
      res.header('Content-Type', 'text/csv');
      res.attachment(filename);
      return res.send(csv);
    });

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
