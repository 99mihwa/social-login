const express = require("express");
const User = require("../schemas/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const authMiddleWare = require("../middleware/authMiddleWare");
// const{ KEY } = process.env.KEY;
const dotenv = require("dotenv").config();
const router = express.Router();


// login page
router.post("/login", async (req, res) => {
    console.log('login api');
    const{ userId, userPw } = req.body;
    console.log('body->',userId, userPw);
    const user = await User.findOne({userId});
    console.log('user-->',user);

    // body passowrd = unHashPassword -->true
    const unHashPw = await bcrypt.compareSync(userPw, user.userPw);
    console.log('unHashPw->',unHashPw) // true or false
    // userId, password 없는경우
    if(user.userId !== userId || unHashPw==false) {
        res.status(400).send({
            errorMessage : "아이디 또는 비밀번호가 틀렸습니다."
        });
        return;
    };

    const token = jwt.sign({ userId : user.userId }, `${process.env.KEY}`);
    // console.log('webtoken-->',token)
    res.status(200).send({
        token,
        userId,
    });
});

// 새로고침 login check
router.get("/loginCheck", authMiddleWare, (req, res) => {
    const { user } = res.locals;
    console.log('loginCheck user-->',user);
    const userId = user[0].userId;
    const userNick = user[0].userNick;
    console.log('userId-->',userId);
    console.log('userNick-->',userNick);
    res.status(200).send({
        userId : userId,
        userNick : userNick
    });
});

module.exports = router;
