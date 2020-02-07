'use strict';

const localAudio = document.querySelector('audio#local-audio');
const remoteAudio = document.querySelector('audio#remote-audio');
const callButton = document.querySelector('button#callButton');
const hangupButton = document.querySelector('button#hangupButton');
const codecSelector = document.querySelector('select#codec');

const divSelectRoom = document.getElementById("select-room");
const divConsultingRoom = document.getElementById("consulting-room");
const inputRoomNumber = document.getElementById("room-number");
const btnGoRoom = document.getElementById("go-room");

hangupButton.disabled = true;
hangupButton.onclick = hangup;

let roomNumber;
let localStream;
let remoteStream;
let rtcPeerConnection;

let iceServers = iceServers1;

let streamConstraints = { audio: true };
let isCaller;

let socket = io();

btnGoRoom.onclick = function () {
    if (inputRoomNumber.value === "") {
        alert("Please enter a room number");
    } else {
        roomNumber = inputRoomNumber.value;

        socket.emit("create or join", roomNumber);

        divSelectRoom.style = "display: none";
        divConsultingRoom.style = "display: block";
    }
};

socket.on("created", function (room) {
    navigator.getUserMedia(
        streamConstraints,
        function (stream) {
            localStream = stream;
            localAudio.srcObject = stream;
            isCaller = true;
        },
        function (error) {
            console.log(`An error occured when accessing media devices`);
        }
    );
});

socket.on("joined", function (room) {
    navigator.getUserMedia(
        streamConstraints,
        function (stream) {
            localStream = stream;
            localAudio.srcObject = stream;

            socket.emit("ready", roomNumber);
        },
        function (error) {
            console.log(`An error occured when accessing media devices`);
        }
    );
});

socket.on("ready", function () {
    if (isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);

        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.onaddstream = onAddStream;

        for (const track of localStream.getTracks()) {
            rtcPeerConnection.addTrack(track, localStream);
        }

        rtcPeerConnection.addStream(localStream);

        rtcPeerConnection.createOffer(setLocalOffer, function (e) {
            console.log(e);
        });
    }
});

socket.on("offer", function (event) {
    if (!isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);

        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.onaddstream = onAddStream;

        rtcPeerConnection.addStream(localStream);

        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));

        rtcPeerConnection.createAnswer(setLocalAnswer, function (e) {
            console.log(e);
        });
    }
});

socket.on("answer", function (event) {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

socket.on("candidate", function (event) {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });

    rtcPeerConnection.addIceCandidate(candidate);
});

function onAddStream(event) {
    var audioContainer = document.createElement("audio");
    audioContainer.setAttribute("width", "max-content");
    audioContainer.setAttribute("autoplay", true);
    console.log(event.stream);
    audioContainer.srcObject = event.stream;
    remoteStream = event.stream;

    divConsultingRoom.appendChild(audioContainer);
}

function onIceCandidate(event) {
    if (event.candidate) {
        console.log("sending ice candidate");

        socket.emit("candidate", {
            type: "candidate",
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        });
        hangupButton.disabled = false;
    }
}

function setLocalOffer(sessionDescription) {
    rtcPeerConnection.setLocalDescription(sessionDescription);

    socket.emit("offer", {
        type: "offer",
        sdp: sessionDescription,
        room: roomNumber
    });
}

function setLocalAnswer(sessionDescription) {
    rtcPeerConnection.setLocalDescription(sessionDescription);

    socket.emit("answer", {
        type: "answer",
        sdp: sessionDescription,
        room: roomNumber
    });
}

socket.on("full", function (message) {
    if (divSelectRoom.contains(document.getElementById("error-message"))) {
        document.getElementById("error-message").remove();
    }

    divSelectRoom.style = "display: block";
    divConsultingRoom.style = "display: none";

    var errorMessage = document.createElement("p");
    errorMessage.setAttribute("id", "error-message");
    errorMessage.style = "color: red;";
    errorMessage.innerText = message;

    divSelectRoom.appendChild(errorMessage);
});

function hangup() {
    console.log('Ending call');
    localStream.getAudioTracks()[0].stop();
    remoteStream.getAudioTracks()[0].stop();
    hangupButton.disabled = true;
}

