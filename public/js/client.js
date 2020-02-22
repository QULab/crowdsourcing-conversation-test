const localAudio = document.querySelector('audio#local-audio');
//const remoteAudio = document.querySelector('audio#remote-audio');
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

let iceServers = iceServers1;

let streamConstraints = { audio: true };
let isCaller;
let latencyArray = [];

let audioContainer;
let socket = io();

let recorder1;
let recorder2;
let recordedChunks = [];

let isFirefox1 = false;

let rtcPeerConnection = new RTCPeerConnection(iceServers);
var context = new AudioContext();

console.log("firefox", navigator.userAgent.includes("Firefox"));

if (navigator.userAgent.includes("Firefox")) {
    isFirefox1 = true;
}

// Room code
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

// on creating the room
socket.on("created", function (room) {
    console.log("Local User");
    navigator.mediaDevices.getUserMedia(
        streamConstraints).then(
            (stream) => {
                localStream = stream;
                localAudio.srcObject = stream;
                isCaller = true;
                // for (const track of localStream.getTracks()) {
                //     console.log("inside local stream", track); 
                //     rtcPeerConnection.addTrack(track, localStream);
                // }
                socket.emit("ready", roomNumber);
                console.log("room created, track added local");
            }).catch((error) => {
                console.log(`An error occured when accessing media devices`, error);
            });
});

// when someone joins -- remote stream
socket.on("joined", function (room) {
    console.log("Remote User");
    //rtcPeerConnection = new RTCPeerConnection(iceServers);
    if (roomNumber == 2) {
        console.log("roomnumber 2", roomNumber);
        navigator.mediaDevices.getUserMedia(streamConstraints).then(
            (stream) => {
                console.log("remote stream", stream);
                console.log("switching stream to audio file");
                // TODO switch stream from microphone to local file
                localStream = stream;
                localAudio.srcObject = stream;

                // for (const track of stream.getTracks()) {
                //     rtcPeerConnection.addTrack(track, localStream);
                // }
                socket.emit("ready", roomNumber);
            }
        );
        console.log("room joined, track added local", roomNumber);
        
    } else {
        navigator.mediaDevices.getUserMedia(
            streamConstraints).then(
                (stream) => {
                    console.log("inside joined", stream);

                    localStream = stream;
                    localAudio.srcObject = stream;
                    // for (const track of localStream.getTracks()) {
                    //     rtcPeerConnection.addTrack(track, localStream);
                    // }
                    console.log("room joined, track added local");
                    socket.emit("ready", roomNumber);
                }).catch((error) => {
                    console.log(`An error occured when accessing media devices`, error);
                });
    } // socket.emit("ready", roomNumber);
});
// on emit ready
socket.on("ready", function () {
    if (isCaller) {
        //rtcPeerConnection = new RTCPeerConnection(iceServers);

        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;

        console.log("not screwd up yet");
        console.log("local audio", localStream);

        for (const track of localStream.getTracks()) {
            rtcPeerConnection.addTrack(track, localStream);
        }

        rtcPeerConnection.createOffer(setLocalOffer, function (e) {
            console.log(e);
        });
    }
});

// on offer 
socket.on("offer", function (event) {
    if (!isCaller) {
        //rtcPeerConnection = new RTCPeerConnection(iceServers);

        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;

        for (const track of localStream.getTracks()) {
            rtcPeerConnection.addTrack(track, localStream);
        }


        // recorder1 = new RecordRTC(localStream, {
        //     type: 'audio',
        // });
        // recorder1.startRecording();
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));

        rtcPeerConnection.createAnswer(setLocalAnswer, function (e) {
            console.log(e);
        });
    }
});

// socket on answering the offer
socket.on("answer", function (event) {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

// socket on ICE candidate
socket.on("candidate", function (event) {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });

    rtcPeerConnection.addIceCandidate(candidate);

});

// TODO subistitute event stream with web audio

// on adding the stream
function onAddStream(event) {
    audioContainer = document.createElement("audio");
    audioContainer.setAttribute("width", "max-content");
    audioContainer.setAttribute("autoplay", true);
    console.log(event.streams);
    // Assign the event stream to the remote audio
    // audioContainer.srcObject = event.streams[0];
    audiofile = new Audio("http://localhost:8080");
    audiofile.play();
    console.log("audio file", audiofile);
    audioContainer.srcObject = audiofile.stream;
    console.log(audiofile.stream);
    //remoteAudio.srcObject = event.streams[0];
    //remoteStream = event.stream;

    divConsultingRoom.appendChild(audioContainer);
    console.log(audioContainer);
    recording(localStream);
    console.log("local stream", localStream);


    // if (!isFirefox1) {
    //     // Todo get all stats
    //     var repeatInterval = 2000;
    //     rtcPeerConnection.getStats().then(function (stats) {
    //         // document.getElementById("audio-packetsLost").innerHTML =
    //         //         stats.packetsLost;
    //         console.log(stats);
    //         var s = "";
    //         stats.forEach(stat => {
    //             if (stat.type == "outbound-rtp" && !stat.isRemote) {
    //                 s += "<h4>Sender side</h4>" + dumpStats(stat);
    //                 console.log("asdasdasdas", stat);
    //             }
    //         });
    //     }, repeatInterval);
    // }

    // getStats Code
    /*     var repeatInterval = 2000; // 2000 ms == 2 seconds
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
        }, repeatInterval); */

    // getStats using webrtc peerConnection.getstats()
    let rttArr = [];
    let resultArr = [];
    setInterval(() => {
        rtcPeerConnection.getStats(null).then(showStats, err =>
            console.log(err)
        );
    }, 100000)

    function showStats(results) {
        results.forEach(element => {
            console.log(element);
            resultArr.push(element);
            console.log(resultArr);
            if (element.type == 'remote-inbound-rtp') {
                console.table(element);
                rttArr.push(parseInt(element.roundTripTime));
                document.getElementById('audio-latency').innerHTML = element.roundTripTime + ' ms';
                document.getElementById('audio-packetsLost').innerHTML = element.packetsLost;
                let averageArray = arr => arr.reduce((prev, curr) => prev + curr) / arr.length;
                let averageLatency = Math.round(averageArray(rttArr) * 100 + Number.EPSILON) / 100;
                console.log(averageLatency);
                document.getElementById('audio-averageLatency').innerHTML = averageLatency + ' ms';
            }
        });
    }

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
    // recorder1.stopRecording();
    // let blob = recorder1.getBlob();
    // let file = new File([blob], "record1", {
    //     type: 'audio/webm'
    // });
    // invokeSaveAsDialog(file);

    // recorder1.stop();
    // download();
    // console.log(recorder1.state);
    // console.log("recorder stopped");

    localStream.getAudioTracks()[0].stop();
    audioContainer.pause();
    rtcPeerConnection.close();
    hangupButton.disabled = true;
}

function recording(stream) {
    recorder1 = new MediaRecorder(stream);
    recorder1.start();
    console.log(recorder1.state);
    console.log("recorder started");

    recorder1.ondataavailable = function (e) {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
            console.log("chunks recorded", recordedChunks);
        } else {
            console.log("no data available");
        }
    }
}

function download() {
    console.log("inside download recordedChunks", recordedChunks);
    var blob = new Blob(recordedChunks, {
        type: "audio/webm"
    });
    console.log("blob", blob);
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = "test.wav";
    a.click();
    window.URL.revokeObjectURL(url);
}


