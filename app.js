// const express = require("express");
// const app = express();
// const port = 3000;
// const connect = require("./schemas/index");
// connect();
//   //const Logins = require("./schemas/logins"); //logins DB 연결하기
// const cors = require("cors");
// app.use(cors());
 const socket = require("socket.io");
// const moment = require('moment'); 
// require('moment-timezone');
// moment.tz.setDefault("Asia/Seoul");
// const authMiddleWare = require("./middleware/authMiddleWare");

// // 동선님 코드
const http = require("http");
// const SocketIO = require("socket.io");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { SocketAddress } = require("net");
const app = express();
const port = 3000;

const requestMiddleware = (req, res, next) => {
  console.log(
    "[Ip address]:",
    req.ip,
    "[method]:",
    req.method,
    "Request URL:",
    req.originalUrl,
    " - ",
    new Date()
  );
  next();
};



// router
// const usersRouter = require("./routes/login");
// const resisterRouter = require("./routes/register");
// const kakaoRouter = require('./routes/kakaoLogin');


//middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use('/user', [usersRouter, resisterRouter]);
// app.use('', [kakaoRouter] )
app.use(express.static("public"));
// app.use(cors({ credentials: true }));
// app.use(authMiddleWare)

// 각종 미들웨어(동선님 코드)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());
app.use(requestMiddleware);
app.use(express.urlencoded({ extended: false }));

const httpServer = http.createServer(app);
//const io = SocketIO(httpServer, { cors: { origin: "*" } });



//서버 열기
let server = app.listen(port, () => {
    console.log(port, "포트로 서버가 켜졌어요!");
  });
  
//   //Upgrades the server to accept websockets.
  
  let io = socket(server, {
    cors : {
        origin:"*", //여기에 명시된 서버만 호스트만 내서버로 연결을 허용할거야
        methods: ["GET","POST"],
    },
  })
  
  //Triggered when a client is connected.
  
  io.on("connection", function (socket) {
    console.log("User Connected :" + socket.id);

    // 로그인 아이디 매핑 (로그인 ID -> 소켓 ID)
    var login_ids = {};

    // 'login' 이벤트를 받았을 때의 처리
    socket.on('login', function(login) {
        console.log('login 이벤트를 받았습니다.');
        console.log(login)
        console.dir(login);

        // 기존 클라이언트 ID가 없으면 클라이언트 ID를 맵에 추가
        console.log('접속한 소켓의 ID : ' + socket.id);
        login_ids[login.userid] = socket.id;
        socket.login_id = login.userid;

        console.log('접속한 클라이언트 ID 갯수 : %d', Object.keys(login_ids).length);


        // 응답 메시지 전송
        //sendResponse(socket, 'login', '200', '로그인되었습니다.');
    });
  
    //Triggered when a peer hits the join room button.
  
    socket.on("join", function (roomName) {
      console.log("푸쉬한 룸네임은?????",roomName)
      userId = res.locals.user.userId
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

    let rooms = [];

    // 방참여 요청
    socket.on('req_join_room', async (msg) => {
      let roomName = 'Room_' + msg.roomName;
      if(!rooms.includes(roomName)) {
        rooms.push(roomName);
      }else{        
        // does nothing
      }
      socket.join(roomName);
      io.to(roomName).emit('noti_join_room', "방에 입장하였습니다.");
    });


  });


//동선님코드
// let rooms = [];

// io.on("connection", (socket) => {
//   console.log("connection: ", socket.id);

//   io.emit("roomList", rooms);

//   socket.on("main", (id) => {
//     console.log(`아이디 받아오기: ${id}`);
//     socket.userId = id;
//   });

//   socket.on("msg", (msg, id) => {
//     console.log(`msg: ${msg}, id: ${id}`);
//     io.to(socket.roomId).emit("msg", { msg, id });
//   });

//   socket.on("joinRoom", (roomSocketId) => {
//     console.log(`${socket.userId}님이 입장하셨습니다.`);
//     for (let i = 0; i < rooms.length; i++) {
//       if (rooms[i].socketId === roomSocketId) {
//         socket.join(rooms[i].socketId);
//         socket.roomId = rooms[i].socketId;
//         break;
//       }
//     }
//   });

//   socket.on("createRoom", (userId, roomTitle, roomPeople, password) => {
//     const socketId = socket.id;
//     const room = {
//       socketId,
//       userId,
//       roomTitle,
//       roomPeople,
//       password,
//     };
//     rooms.push(room);
//     console.log(
//       `방 만들기: ${room.socketId}, ${room.userId}, ${room.roomTitle}, ${room.roomPeople}, ${room.password}`
//     );
//     socket.emit("roomData", room);
//   });

//   socket.on("disconnect", function () {
//     console.log("disconnect: ", socket.id);
//   });
// });

// // 서버 열기
// httpServer.listen(port, () => {
//   console.log(port, "포트로 서버가 켜졌어요!");
// });  




module.exports = app
