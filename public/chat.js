let socket = io.connect("http://localhost:3000");
let divVideoChatLobby = document.getElementById("video-chat-lobby");
let divVideoChat = document.getElementById("video-chat-room");
let joinButton = document.getElementById("join");
let userIdButton = document.getElementById("userId");
let roomInput = document.getElementById("roomName");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");
let roomName = []
let creator = false;
let rtcPeerConnection;
let userStream;

let loginButton = document.getElementById("login");
let userIdInput = document.getElementById("userId");
let userPwInput = document.getElementById("userPw");


//ICE(Interactive Connectivity Establishment) -> 프레임워크명, 
//   2개의 단말이 P2P연결을 가능하게 하도록 최적의 경로를 찾아줌
// Contains the stun server URL we will be using.
let iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

//addEventListener: 지정한 유형의 이벤트를 대상이 수신할 때마다 호출할 함수를 설정
loginButton.addEventListener("click", function () {
  if (userIdInput.value == "" || userPwInput.value == "") {
    alert("Please enter a Id ans Password");
  } else {
    userId = userIdInput.value;
    socket.emit("login", userId);
  }
});
/*로그인 버튼 클릭 시(이벤트 발생) 
  userIdInput이나 userPwInput이 빈값인 경우 alert를 띄우고
  아닌 경우 userId와 "login"이벤트 발생을 서버 측으로 전달
  -> DB의 user값과 대조하여 확인하는 부분 생략되어 보완 필요 */

joinButton.addEventListener("click", function () {
  if (roomInput.value == "") {
    alert("Please enter a room name");
  } else {
    roomName.push(socket.id)
    socket.emit("join", roomName);
  }
});
/*조인 버튼 클릭 시(이벤트 발생) 
  roomInput이 빈값인 경우 alert를 띄우고
  아닌 경우 roomName배열에 socket.id push 후
  roomName과 "join"이벤트 발생을 서버 측으로 전달 */

// Triggered when a room is succesfully created.

socket.on("created", function () {
  creator = true;

/* creator가 참 또는 거짓인 경우는 하단의 socket.on("ready") 와 socket.on("offer")
과 연결됨(추정)*/
  
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: { width: 1280, height: 720 },
    })
    .then(function (stream) {
      /* use the stream */
      userStream = stream;
      divVideoChatLobby.style = "display:none";
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
    })
    .catch(function (err) {
      /* handle the error */
      alert("Couldn't Access User Media");
    });
});

// Triggered when a room is succesfully joined.

socket.on("joined", function () {
  creator = false;

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: { width: 1280, height: 720 },
    })
    .then(function (stream) {
      /* use the stream */
      userStream = stream;
      divVideoChatLobby.style = "display:none";
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
      socket.emit("ready", roomName);
    })
    .catch(function (err) {
      /* handle the error */
      alert("Couldn't Access User Media");
    });
});

// Triggered when a room is full (meaning has 2 people).

socket.on("full", function () {
  alert("Room is Full, Can't Join");
});

// Triggered when a peer has joined the room and ready to communicate.

socket.on("ready", function () {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection
      .createOffer()
      .then((offer) => {
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomName);
      })

      .catch((error) => {
        console.log(error);
      });
  }
});

// Triggered on receiving an ice candidate from the peer.

//candidate: 연결 가능한 네크워크 주소의 후보(candidate)
socket.on("candidate", function (candidate) {
  let icecandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(icecandidate);
});

// Triggered on receiving an offer from the person who created the room.

socket.on("offer", function (offer) {
  if (!creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection.setRemoteDescription(offer);
    rtcPeerConnection
      .createAnswer()
      .then((answer) => {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, roomName);
      })
      .catch((error) => {
        console.log(error);
      });
  }
});

// Triggered on receiving an answer from the person who joined the room.

socket.on("answer", function (answer) {
  rtcPeerConnection.setRemoteDescription(answer);
});

// Implementing the OnIceCandidateFunction which is part of the RTCPeerConnection Interface.

function OnIceCandidateFunction(event) {
  console.log("Candidate");
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomName);
  }
}

// Implementing the OnTrackFunction which is part of the RTCPeerConnection Interface.

function OnTrackFunction(event) {
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = function (e) {
    peerVideo.play();
  };
}
