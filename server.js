const path = require("path");
const fs = require("fs");
const express = require("express");
const app = express();
const router = express.Router();
const cors = require("cors");
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");
const redis = require("redis");
const redisStore = require("connect-redis")(session);
const http = require("http");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const server = http.createServer(app);
const io = require("socket.io")(server);
const basicAuth = require("express-basic-auth");
const multer = require("multer");
// let filePath = './public/assets/sup23_selected_1min/01_2.wav';
const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36";
const moment = require("moment");
// const csv = require('csv-express');
// const json2csv = require("json-2-csv");
const json2csv = require("json2csv");
const { Parser } = require('json2csv');
// const redisClient = redis.createClient(6379, "webrtc-redis");
const redisClient = redis.createClient();
const dotenv = require("dotenv").config();
let sessionID;
const jobConfigController = require("./controllers/jobConfigController");

const port = process.env.PORT || 3000;
let ipAdress;
let fileName;

// TODO session management
app.set("view engine", "ejs");
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(router);


let connectionUrl = "mongodb+srv://" + process.env.DB_USER + ":" +
  process.env.DB_PASS + "@" + process.env.HOST_NAME + "/"
  + process.env.DB_NAME + "?retryWrites=true&w=majority";

mongoose.connect(connectionUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// redis
redisClient.on("error", (err) => {
  console.log("Redis error: ", err);
});

app.use(
  session({
    genid: (req) => {
      return uuidv4();
    },
    store: new redisStore({ host: "redis", port: 6379, client: redisClient }),
    name: "webrtc",
    secret: "54F962E6ECF99",
    resave: false,
    cookie: { secure: false, maxAge: 60 * 60 * 24 }, // Set to secure:false and expire in 1 minute for demo purposes
    saveUninitialized: true,
  })
);


app.use((req, res, next) => {

  // if(sessionID != req.sessionID){
  //   console.log("[sessionID]:") ;
  //   console.log("               OLD:   ",sessionID);
  //   console.log("               NEW:   ",req.sessionID);
  // }
    sessionID = req.sessionID;
    //console.log("                                          ID:",sessionID)
  // console.info(req.sessionID);
  let fileP = req.query.fileName;
  if (fileP != null) {
    fileP = streamSwitcher(fileP);
    if (fileP == "file not found") {
      res.sendFile("404.html", { root: "public" });
    }
  }
  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.use("/user-test", express.static("public/user-test"));

app.use("/delay", express.static("public/delay"));

// app.use("/scenarios/scenario1/caller", express.static("public/conversation-test/scenario1/caller.html"));

// app.use("/scenarios/scenario1/receiver", express.static("public/conversation-test/scenario1/receiver.html"));

//app.use('/newapp', express.static('public/restructure-html'));

app.use("/user-user", express.static("public/user-user"));

app.get("/stream", (req, res) => {
  console.log(req.query);
  fileName = req.query.fileName;
  console.log(fileName);
  let filePath = streamSwitcher(fileName.toString());
  let stat = fs.statSync(filePath);

  let chunkSize = 1024 * 1024;
  if (stat.size > chunkSize * 2) {
    chunkSize = Math.ceil(stat.size * 1);
  }
  let range = req.headers.range
    ? req.headers.range.replace(/bytes=/, "").split("-")
    : [];

  range[0] = range[0] ? parseInt(range[0], 10) : 0;
  range[1] = range[1] ? parseInt(range[1], 10) : range[0] + chunkSize;
  if (range[1] > stat.size - 1) {
    range[1] = stat.size - 1;
  }
  range = { start: range[0], end: range[1] };
  console.log(filePath);
  res.writeHead(200, {
    "Content-Type": "audio/wav",
    "Content-Range": "bytes " + range.start + "-" + range.end + "/" + stat.size,
    "Content-Length": range.end - range.start,
  });
  fs.createReadStream(filePath).pipe(res);
});

function streamSwitcher(fileName) {
  switch (fileName) {
    case "01_2":
      return "./public/assets/sup23_selected_1min/01_2.wav";
    case "17_2":
      return "./public/assets/sup23_selected_1min/17_2.wav";
    case "21_2":
      return "./public/assets/sup23_selected_1min/21_2.wav";
    case "32_2":
      return "./public/assets/sup23_selected_1min/32_2.wav";
    case "46_2":
      return "./public/assets/sup23_selected_1min/46_2.wav";
    default:
      return "file not found";
  }
}

// mongodb connection
const schema = mongoose.Schema;

let statSchema = new schema({
  url: { type: String },
  key:String,
  config: { type: JSON },
  roomNumber: { type: Number },
  verificationCode: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  browser: { type: String },
  os: { type: String },
  statistics: { type: JSON, required: true },
  type: { type: String, required: true },
  rating: { type: String },
  fileName: { type: String },
  ipAdress: { type: String },
  testDuration: { type: Number },
  sessionID: { type: String },
  scaleAnswer: { type: String },
  feedback: { type: JSON },
  callerAnswers: { type: JSON },
  receiverAnswers: { type: JSON },
  qualification_answers: { type: JSON },
}, { collection: process.env.STATISTICS_COL, timestamps: true, strict: false });


let statModel = mongoose.model("StatModel", statSchema);

let audioSchema = new schema({
  key:String,
  audio:
  {
    data:Buffer,
    contentType:String
  }
},{ collection: "audio", timestamps: true, strict: false  })

let audioModel = mongoose.model("AudioModel",audioSchema);

// post to mongodb

// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads')
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.fieldname + '-' + Date.now())
//   }
// })

var upload = multer({ dest: __dirname + '/uploads/' })
var type = upload.single('upl');
var file;


app.post('/audio',type,(req,res,next) => {
  console.log("[POST]  /audio");
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  //console.log(ip); // ip address of the user
  //console.log(req.headers)
  file = req.file
  try{
    if(!file){
      const error = new Error("Please Upload File")
      error.httpStatusCode = 400;
      return next(error)
    }
    else{
  
      //console.log(file)
    
      let audio = new audioModel({
        key:file.originalname,
        audio:
        {
          data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
          contentType:'audio/webm'

        }
      },(err)=>{if(err)console.log(err)})
      audio.save((err)=>{if(err)console.log(err)})
      console.log("      Saved in DB, Key:",file.originalname);
    }
    
    fs.unlink(path.join(__dirname + '/uploads/' + req.file.filename),(err)=>{if(err)console.log(err)});
    res.status(200).send({message:"Success"})
  }
  catch(e){
    console.log(e);
    res.status(400).send({message:"Failed"})
  }
  

})

app.get('/audio', async (req,res)=>{
  console.log("[GET]   /audio")

  let dir =path.join(__dirname + '/audioDB/')
  fs.readdir(dir, (err, files) => {
    if (err) throw err;
  
    for (const file of files) {
      fs.unlink(path.join(dir, file), err => {
        if (err) throw err;
      });
    }
  });


  //let audio = await audioModel.find().sort({timestamp:'asc'})
  audioModel.find((err,audioAll)=>{
    res
    .status(200)
    .json({
      data: audioAll,
      message:"success"
    });
    audioAll.map((audioFile)=>{
      let buffer = Buffer.from(audioFile.audio.data);

      if(audioFile.name != "") {
        fs.writeFile(path.join(__dirname + '/audioDB/' + audioFile.name)+".webm",audioFile.audio.data,function(err){
          if(err)console.log(err)
        })
      }
    })
  })
  console.log("      Audio retrieved")
});

app.post("/stats", async (req, res) => {
  ipAdress = req.connection.remoteAddress;
  
  let browserType = req.get("user-agent");
  console.log("[POST]    /stats");
  let body = req.body;
  body.ipAdress = ipAdress;
  body.sessionID = sessionID;

  let stats = new statModel(body);


  try {

    await stats.save();
    console.log("      Saved in DB, Key:",body.key);
    res.status(200).send({
      message: 'Success'
    });
  
  } catch (err) {
    console.log("Saving went wrong",err)
    res.status(500).send(err);
  }
  // console.log(req.headers);
  // console.log(req.get('user-agent'));
});

// get from mongodb

app.get(
  "/stats",
  basicAuth({
    challenge: true,
    users: { admin: process.env.SECRET },
  }),
  async (req, res) => {
    // console.log(device);

    statModel
      .find()
      .sort({ timestamp: "desc" })
      .then((data) => {
        res.render("data.ejs", { data: data, moment: moment });
      })
      .catch(res.status(500));
  }
);

// const fields = ['field1', 'field2', 'field3'];
// const opts = { fields };



app.get(
  "/exporttocsv",
  basicAuth({
    challenge: true,
    users: { admin: process.env.SECRET },
  }),
  async (req, res) => {
    var ts = Date.now();
    var date = new Date(ts);
    var filename = date.toISOString() + "-conversationtest.csv";
    var dataArray;

    statModel
      .find({})
      .sort({ timestamp: "desc" })
      .lean()
      .exec({})
      .then((data) => {
        // json2csv.json2csv({ data: data }, function (err, csvStr) {
        //   if (err) {
        //     console.log(err);
        //     res.statusCode = 500;
        //     return res.end(err.message);
        //   }
        //   res.setHeader("Content-Type", "text/csv");
        //   res.setHeader(
        //     "Content-Disposition",
        //     "attachment; filename=" + filename
        //   );
        //   res.status(200).send(csvStr);
        // });
        try {
          const parser = new Parser();
          const csv = parser.parse(data);
          // console.log(csv);
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + filename
          );
          res.status(200).send(csv);
        } catch (err) {
          console.error(err);
        }
      })
      .catch(res.status(500));
  }
);

router.get("/jobConfig", jobConfigController.getJobConfig);
router.post("/jobConfig", jobConfigController.createJobConfig);
router.delete("/jobConfig",jobConfigController.deleteJobConfig);


app.post("/scenarioAnswers", async (req, res) => {
  console.log("Got query:", req.query);
  console.log("Got body", req.body);
})

// rooms and socket IO





function randomConfig(){
  let conf = ["testServerTE1","testServerChristian"];
  conf = "testServerNoGain"

  let min = Math.ceil(0);
  let max = Math.floor(conf.length-1);
  let config = conf[Math.floor(Math.random() * (max - min +1)) + min]
  //console.log("CONFIG:",config)
  return config
}
function setRoom(){
  let room = 1; 
  while(io.sockets.adapter.rooms[room]!=undefined){
    room ++;
  }
  //console.log("NEXTROOM:",room)
  return room;
}
// let keysSession;
// let keysDB;
// audioModel.find().select("key -_id").exec(function(err,val){
//   if(err)console.log(err)
//   else{
//     console.log(typeof(val))
//     for(e in val){
//       console.log(e)
//     }
//   }
// })

// function keyDouble(key){
//   console.log(keysDB)
//   for (var e in keysDB){
//     console.log(e)
//   }

 
//   return false
  
// }
// async function setKey(){
//   var newkey = uuidv4()
//   while(keyDouble(newkey) == true ){
//     newkey = uuidv4();
//   }
//   console.log("KEY:",newkey)
//   return newkey;
// }


let nextroom = setRoom();
let nextconfig = randomConfig();


io.on("connection", function (socket) {
  console.log("[CONNECTION]")

  socket.on("create or join", function () {
    let myRoom = io.sockets.adapter.rooms[nextroom] || { length: 0 }
    let numClients = myRoom.length;
    
    console.log("Room ",nextroom,"has ", numClients+1, " clients");

    if (numClients == 0) {
      // Dieser Socket ist einziger.
      // CREATE ROOM
      socket.join(nextroom);
      socket.emit("created",nextconfig,nextroom);
      
    } else if (numClients == 1) {
      // Dieser Socket ist der zweite.
      // JOIN ROOM
      let key = uuidv4();
      socket.join(nextroom);
      socket.emit("joined", nextconfig,nextroom,key);
      socket.broadcast.to(nextroom).emit("user_joined",key);
      nextconfig = randomConfig();
      nextroom = setRoom();
    } else {
      console.log("WTF??")
    }
  });
  socket.on("caller_ready", function (room) {
    socket.emit("called", room);
    socket.broadcast.to(room).emit("accept_call");
  })

  socket.on("ready", function (room) {
    socket.broadcast.to(room).emit("ready");
  });

  socket.on("hangup", function (room) {
    socket.broadcast.to(room).emit("endCall");
    socket.emit("endCall", room);
  })

  socket.on("candidate", function (event) {
    socket.broadcast.to(event.room).emit("candidate", event);
  });

  socket.on("offer", function (event) {
    socket.broadcast.to(event.room).emit("offer", event.sdp);
  });

  socket.on("answer", function (event) {
    socket.broadcast.to(event.room).emit("answer", event.sdp);
  });
  socket.on("disconnect",function(event){
    console.log("Disconnected");
  
  })
});

// io.on("connection", function (socket) {
//   console.log("[CONNECTION]");
//   socket.on("create or join", function (room) {
//     console.log("    Roomnumber:", room);

//     let myRoom = io.sockets.adapter.rooms[room] || { length: 0 };
//     let numClients = myRoom.length;

//     console.log("                 has ", numClients, " clients");

//     if (numClients === 0) {

      
//       socket.join(room);
//       socket.emit("created", room, {message:"test"});
//       rooms.push(room);
//       console.log("numclients New",io.sockets.adapter.rooms[room].length);
//     } else if (numClients === 1) {
//       let key = uuidv4();
//       socket.join(room);
//       socket.emit("joined", room,key);
//       socket.broadcast.to(room).emit("user_joined",key);
//     } else {
//       socket.emit("full", `Sorry room '${room}' are full.`);
//     }
//   });

//   socket.on("caller_ready", function (room) {
//     socket.emit("called", room);
//     socket.broadcast.to(room).emit("accept_call");
//   })

//   socket.on("ready", function (room) {
//     socket.broadcast.to(room).emit("ready");
//   });

//   socket.on("hangup", function (room) {
//     socket.broadcast.to(room).emit("endCall");
//     socket.emit("endCall", room);
//   })

//   socket.on("candidate", function (event) {
//     socket.broadcast.to(event.room).emit("candidate", event);
//   });

//   socket.on("offer", function (event) {
//     socket.broadcast.to(event.room).emit("offer", event.sdp);
//   });

//   socket.on("answer", function (event) {
//     socket.broadcast.to(event.room).emit("answer", event.sdp);
//   });
//   socket.on("disconnect",function(event){
//     console.log("Disconnected");
//   })
// });

server.listen(port);
console.log("[SERVER RUNNING]");

