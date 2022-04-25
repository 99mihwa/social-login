//깃허브확인
const express = require("express");
const app = express();
const port = 3000;
const connect = require("./schemas");
// const authMiddleware = require("./middleware/authMiddleWare");
const cors = require("cors");
connect();

app.use(cors());

// router
const usersRouter = require("./routes/login");
const resisterRouter = require("./routes/register");
const kakaoRouter = require('./routes/kakaoLogin');

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/user', [usersRouter, resisterRouter]);
app.use('', [kakaoRouter] )


// app.get("/", async (req, res) => {
//  console.log("main_page")    
//  res.sendFile(__dirname + "/index.html");
// });



//서버 열기
app.listen(port, () => {
    console.log(port, "포트로 서버가 켜졌어요!");
  });
  
module.exports = app
