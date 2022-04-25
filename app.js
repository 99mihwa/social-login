const express = require("express");
const app = express();
const port = 3000;
const connect = require("./schemas/index");
connect();
  //const Logins = require("./schemas/logins"); //logins DB 연결하기
const cors = require("cors");
app.use(cors());
const socket = require("socket.io");
const moment = require('moment'); 
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
const authMiddleWare = require("./middleware/authMiddleWare");

// router
const usersRouter = require("./routes/login");
const resisterRouter = require("./routes/register");
const kakaoRouter = require('./routes/kakaoLogin');


//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/user', [usersRouter, resisterRouter]);
app.use('', [kakaoRouter] )
app.use(express.static("public"));
app.use(cors({ credentials: true }));
app.use(authMiddleWare)


// app.get("/", async (req, res) => {
//  console.log("main_page")    
//  res.sendFile(__dirname + "/index.html");
// });


//서버 열기
let server = app.listen(port, () => {
    console.log(port, "포트로 서버가 켜졌어요!");
  });
  
//  유저 접속 정보 DB저장
app.post("/",  async (req, res) => {
  const { userId } = res.locals
  const connectedAt = moment().format('YYYY-MM-DD HH:mm:ss');
  const socketId = socket.id
  await Logins.create({ userId, connectedAt, socketId});
  res.send("접속 정보 DB저장 완료")
  console.log("접속 정보 DB저장 완료")
  });


  //Upgrades the server to accept websockets.
  
  let io = socket(server, {
    cors : {
        origin:"*", //여기에 명시된 서버만 호스트만 내서버로 연결을 허용할거야
        methods: ["GET","POST"],
    },
  })
  
  //Triggered when a client is connected.
  
  io.on("connection", function (socket) {
    console.log("User Connected :" + socket.id);
  
  
    socket.on("login", function(login) {
      console.log("서버가 login 이벤트를 받았습니다"); 
      const userId = socket.userId;
      const connectedAt = moment().format('YYYY-MM-DD HH:mm:ss');
      const socketId = socket.id
  
      console.log("userId:",userId,"connectedAt:",connectedAt,"socketId:",socketId); 
    });
  
  
    //Triggered when a peer hits the join room button.
  
    socket.on("join", function (roomName) {
      let rooms = io.sockets.adapter.rooms;
      let room = rooms.get(roomName);
  
      //room == undefined when no such room exists.
      if (room == undefined) {
        socket.join(roomName);
        socket.emit("created");
      } else if (room.size == 1) {
        //room.size == 1 when one person is inside the room.
        socket.join(roomName);
        socket.emit("joined");
      } else {
        //when there are already two people inside the room.
        socket.emit("full");
      }
      console.log(rooms);
    });
  
    //Triggered when the person who joined the room is ready to communicate.
    socket.on("ready", function (roomName) {
      socket.broadcast.to(roomName).emit("ready"); //Informs the other peer in the room.
    });
  
    //Triggered when server gets an icecandidate from a peer in the room.
  
    socket.on("candidate", function (candidate, roomName) {
      console.log(candidate);
      socket.broadcast.to(roomName).emit("candidate", candidate); //Sends Candidate to the other peer in the room.
    });
  
    //Triggered when server gets an offer from a peer in the room.
  
    socket.on("offer", function (offer, roomName) {
      socket.broadcast.to(roomName).emit("offer", offer); //Sends Offer to the other peer in the room.
    });
  
    //Triggered when server gets an answer from a peer in the room.
  
    socket.on("answer", function (answer, roomName) {
      socket.broadcast.to(roomName).emit("answer", answer); //Sends Answer to the other peer in the room.
    });
  });





module.exports = app
