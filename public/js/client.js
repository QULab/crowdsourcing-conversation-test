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
let latencyArray = [];

let socket = io();

let isFirefox = false;

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
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    if(navigator.userAgent.indexOf("Firefox") != -1){
        document.getElementById('table-stats').style.display = 'none';
    }
    navigator.mediaDevices.getUserMedia(
        streamConstraints).then(
        (stream) =>  {
            localStream = stream;
            localAudio.srcObject = stream;
            isCaller = true;
            for (const track of localStream.getTracks()) {
                rtcPeerConnection.addTrack(track, localStream);
            }
            socket.emit("ready", roomNumber);
            console.log("room created, track added local");
        }).catch((error) => { 
            console.log(`An error occured when accessing media devices`, error);
        });
});

socket.on("joined", function (room) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    console.log("inside joined");
    navigator.mediaDevices.getUserMedia(
        streamConstraints).then(
        (stream) =>  {
            console.log("inside joined", stream);

            localStream = stream;
            localAudio.srcObject = stream;
            for (const track of localStream.getTracks()) {
                rtcPeerConnection.addTrack(track, localStream);
            }
            console.log("room joined, track added local");
            socket.emit("ready", roomNumber);
        }).catch((error) => { 
            console.log(`An error occured when accessing media devices`, error);
        });
            //socket.emit("ready", roomNumber);
});

socket.on("ready", function () {
    if (isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);

        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.onaddstream = onAddStream;

        for (const track of localStream.getTracks()) {
            rtcPeerConnection.addTrack(track, localStream);
        }
        console.log("not screwd up yet");
        console.log("local audio", localStream);

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
    //remoteAudio.srcObject = event.streams[0];
    remoteStream = event.stream;

    divConsultingRoom.appendChild(audioContainer);
    var repeatInterval = 2000;
    rtcPeerConnection.getStats().then(function (stats) {
        // document.getElementById("audio-packetsLost").innerHTML =
        //         stats.packetsLost;
        console.log(stats);
        var s = "";
        stats.forEach(stat => {
            if (stat.type == "outbound-rtp" && !stat.isRemote) {
                s += "<h4>Sender side</h4>" + dumpStats(stat);
                console.log("asdasdasdas", stat);
            }
        });
    }, repeatInterval);
    // getStats Code
    var repeatInterval = 2000; // 2000 ms == 2 seconds
    getStats(rtcPeerConnection, function (result) {
        console.log(result.audio);
        console.log(result.audio.packetsLost);
        console.log(result.audio.latency);

        // bandwidth download speed (bytes per second))
        result.connectionType.remote.ipAddress
        result.connectionType.remote.candidateType
        result.connectionType.transport

        result.bandwidth.speed // bandwidth download speed (bytes per second)
        document.getElementById('audio-latency').innerHTML = result.audio.latency + ' ms';

        document.getElementById('audio-packetsLost').innerHTML = result.audio.packetsLost;

        latencyArray.push(parseInt(result.audio.latency));
        console.log(latencyArray);
        let averageArray = arr => arr.reduce((prev, curr) => prev + curr) / arr.length;
        let averageLatency = Math.round(averageArray(latencyArray) * 100 + Number.EPSILON) / 100;
        console.log(averageLatency);
        document.getElementById('audio-averageLatency').innerHTML = averageLatency + ' ms';
        // to access native "results" array
        result.results.forEach(function (item) {
            if (item.type === 'ssrc' && item.transportId === 'Channel-audio-1') {
                var packetsLost = item.packetsLost;
                var packetsSent = item.packetsSent;
                var audioInputLevel = item.audioInputLevel;
                var trackId = item.googTrackId; // media stream track id
                var isAudio = item.mediaType === 'audio'; // audio or video
                var isSending = item.id.indexOf('_send') !== -1; // sender or receiver

                console.log('SendRecv type', item.id.split('_send').pop());
                console.log('MediaStream track type', item.mediaType);
            }
        });
    }, repeatInterval);
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

function dumpStats(o) {
    var s = "";
    if (o.mozAvSyncDelay !== undefined || o.mozJitterBufferDelay !== undefined) {
        if (o.mozAvSyncDelay !== undefined) s += "A/V sync: " + o.mozAvSyncDelay + " ms";
        if (o.mozJitterBufferDelay !== undefined) {
            s += " Jitter buffer delay: " + o.mozJitterBufferDelay + " ms";
        }
        s += "<br>";
    }
    s += "Timestamp: " + new Date(o.timestamp).toTimeString() + " Type: " + o.type + "<br>";
    if (o.ssrc !== undefined) s += "SSRC: " + o.ssrc + " ";
    if (o.packetsReceived !== undefined) {
        s += "Recvd: " + o.packetsReceived + " packets";
        if (o.bytesReceived !== undefined) {
            s += " (" + (o.bytesReceived / 1024000).toFixed(2) + " MB)";
        }
        if (o.packetsLost !== undefined) s += " Lost: " + o.packetsLost;
    } else if (o.packetsSent !== undefined) {
        s += "Sent: " + o.packetsSent + " packets";
        if (o.bytesSent !== undefined) s += " (" + (o.bytesSent / 1024000).toFixed(2) + " MB)";
    } else {
        s += "<br><br>";
    }
    s += "<br>";
    if (o.bitrateMean !== undefined) {
        s += " Avg. bitrate: " + (o.bitrateMean / 1000000).toFixed(2) + " Mbps";
        if (o.bitrateStdDev !== undefined) {
            s += " (" + (o.bitrateStdDev / 1000000).toFixed(2) + " StdDev)";
        }
        if (o.discardedPackets !== undefined) {
            s += " Discarded packts: " + o.discardedPackets;
        }
    }
    s += "<br>";
    if (o.framerateMean !== undefined) {
        s += " Avg. framerate: " + (o.framerateMean).toFixed(2) + " fps";
        if (o.framerateStdDev !== undefined) {
            s += " (" + o.framerateStdDev.toFixed(2) + " StdDev)";
        }
    }
    if (o.droppedFrames !== undefined) s += " Dropped frames: " + o.droppedFrames;
    if (o.jitter !== undefined) s += " Jitter: " + o.jitter;
    return s;
}


