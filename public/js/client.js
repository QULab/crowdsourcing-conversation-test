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
let localStreamNode;
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

let pc1 = new RTCPeerConnection(iceServers);
let pc2 = new RTCPeerConnection(iceServers);

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
// call initiator
socket.on("created", function (room) {
    console.log("Local User -- Caller");
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

// when someone joins
// remote stream
// call reciever
socket.on("joined", function (room) {
    console.log("Remote User - Callee");
    //rtcPeerConnection = new RTCPeerConnection(iceServers);

    // play from file if room number is 2
    if (roomNumber == 2) {
        console.log("roomnumber 2", roomNumber);
        navigator.mediaDevices.getUserMedia(streamConstraints).then(
            (stream) => {
                console.log("stream inside socket joined", stream);
                console.log("switching stream to audio file");
                // TODO switch stream from microphone to local file
                localStream = stream;
                localAudio.srcObject = stream;
                gotLocalMediaStream(localStream);
                // setupLocalMediaStreamsFromFile('./assets/test_file.mp3');
                // Handles remote MediaStream success by adding it as the remoteVideo src.

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

// for caller
// on emit ready
socket.on("ready", function () {
    if (isCaller) {
        //rtcPeerConnection = new RTCPeerConnection(iceServers);

        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;

        console.log("local audio - local", localStream);

        for (const track of localStream.getTracks()) {
            rtcPeerConnection.addTrack(track, localStream);
        }

        rtcPeerConnection.createOffer(setLocalOffer, function (e) {
            console.log(e);
        });
    }
});

// for callee
// on offer 
socket.on("offer", function (event) {
    if (!isCaller) {
        //rtcPeerConnection = new RTCPeerConnection(iceServers);

        rtcPeerConnection.onicecandidate = onIceCandidate;
        // rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.ontrack = onOfferAddStream;
        console.log("Callee stream", localStream);

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

// TODO substitute event stream with web audio

// on adding the stream
function onAddStream(event) {
    console.log("ondAddStream - remote stream", event.streams);
    // Assign the event stream to the remote audio

/*     if (roomNumber == 2) {

        this.remoteStream = event.streams[0];

        let audioTracks = this.remoteStream.getAudioTracks();

        // Make sure we actually have audio tracks
        if (audioTracks.length > 0) {
            // The MediaStream node doesn't produce audio until an HTML audio element is attached to the stream
            // Pause and remove the element after loading since we only need it to trigger the stream
            // See https://stackoverflow.com/questions/24287054/chrome-wont-play-webaudio-getusermedia-via-webrtc-peer-js
            // and https://bugs.chromium.org/p/chromium/issues/detail?id=121673#c121
            let audioElem = new Audio();
            audioElem.autoplay = true;
            audioElem.controls = true;
            audioElem.muted = true;
            audioElem.srcObject = this.remoteStream;
            audioElem.addEventListener('canplaythrough', () => {
                audioElem.pause();
                audioElem = null;
            });

            // Gain node for this stream only
            // Connected to gain node for all remote streams
            this.gainNode = context.createGain();
            this.gainNode.connect(incomingRemoteGainNode);

            this.audioNode = context.createMediaStreamSource(this.remoteStream);
            this.audioNode.connect(this.gainNode);

            // AudioContext gets suspended if created before
            // a user interaction https://goo.gl/7K7WLu
            context.resume();
        }

        // console.log(`Received remote stream from`);
    } */ 
        audioContainer = document.createElement("audio");
        audioContainer.setAttribute("width", "max-content");
        audioContainer.setAttribute("autoplay", true);
        audioContainer.srcObject = event.streams[0];
        //remoteAudio.srcObject = event.streams[0];
        //remoteStream = event.stream;

        divConsultingRoom.appendChild(audioContainer);
        console.log(audioContainer);
        // recording(localStream);
        console.log("local stream", localStream);

    // getStats using webrtc peerConnection.getstats()
    let rttArr = [];
    let resultArr = [];
    setInterval(() => {
        rtcPeerConnection.getStats(null).then(showStats, err =>
            console.log(err)
        );
    }, 1000)

    function showStats(results) {
        results.forEach(element => {
            //console.log(element);
            resultArr.push(element);
            //console.log(resultArr);
            if (element.type == 'remote-inbound-rtp') {
                //console.table(element);
                rttArr.push(parseInt(element.roundTripTime));
                document.getElementById('audio-latency').innerHTML = element.roundTripTime + ' ms';
                document.getElementById('audio-packetsLost').innerHTML = element.packetsLost;
                let averageArray = arr => arr.reduce((prev, curr) => prev + curr) / arr.length;
                let averageLatency = Math.round(averageArray(rttArr) * 100 + Number.EPSILON) / 100;
                //console.log(averageLatency);
                document.getElementById('audio-averageLatency').innerHTML = averageLatency + ' ms';
            }
        });
    }

}

// Socket on offer
// For Callee
function onOfferAddStream(event) {
    console.log("onOfferAddStream - remote stream", event.streams);
    // Assign the event stream to the remote audio
    if (roomNumber == 2) {
        
        this.remoteStream = event.streams[0];

        let audioTracks = this.remoteStream.getAudioTracks();

        // Make sure we actually have audio tracks
        if (audioTracks.length > 0) {

            setupLocalMediaStreamsFromFile('./assets/test_file.mp3');
            /* // The MediaStream node doesn't produce audio until an HTML audio element is attached to the stream
            // Pause and remove the element after loading since we only need it to trigger the stream
            let audioElem = new Audio();
            audioElem.autoplay = true;
            audioElem.controls = true;
            audioElem.muted = true;
            audioElem.srcObject = this.remoteStream;
            audioElem.addEventListener('canplaythrough', () => {
                audioElem.pause();
                audioElem = null;
            });

            // Gain node for this stream only
            // Connected to gain node for all remote streams
            this.gainNode = context.createGain();
            this.gainNode.connect(incomingRemoteGainNode);

            this.audioNode = context.createMediaStreamSource(this.remoteStream);
            this.audioNode.connect(this.gainNode);

            // AudioContext gets suspended if created before
            // a user interaction https://goo.gl/7K7WLu
            context.resume(); */
        }

    } else {

        audioContainer = document.createElement("audio");
        audioContainer.setAttribute("width", "max-content");
        audioContainer.setAttribute("autoplay", true);
        audioContainer.srcObject = event.streams[0];
        //remoteAudio.srcObject = event.streams[0];
        //remoteStream = event.stream;

        divConsultingRoom.appendChild(audioContainer);
        console.log(audioContainer);
        // recording(localStream);
        console.log("callee stream", localStream);

        // getStats using webrtc peerConnection.getstats()
        let rttArr = [];
        let resultArr = [];
        setInterval(() => {
            rtcPeerConnection.getStats(null).then(showStats, err =>
                console.log(err)
            );
        }, 1000)

        function showStats(results) {
            results.forEach(element => {
                //console.log(element);
                resultArr.push(element);
                //console.log(resultArr);
                if (element.type == 'remote-inbound-rtp') {
                    //console.table(element);
                    rttArr.push(parseInt(element.roundTripTime));
                    document.getElementById('audio-latency').innerHTML = element.roundTripTime + ' ms';
                    document.getElementById('audio-packetsLost').innerHTML = element.packetsLost;
                    let averageArray = arr => arr.reduce((prev, curr) => prev + curr) / arr.length;
                    let averageLatency = Math.round(averageArray(rttArr) * 100 + Number.EPSILON) / 100;
                    //console.log(averageLatency);
                    document.getElementById('audio-averageLatency').innerHTML = averageLatency + ' ms';
                }
            });
        }
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
    audioContainer = null;
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

// Setup Web Audio components
window.AudioContext = (window.AudioContext || window.webkitAudioContext);
let context = new AudioContext();
let incomingRemoteStreamNode;
let outgoingRemoteStreamNode = context.createMediaStreamDestination();
let incomingRemoteGainNode = context.createGain();
let outgoingRemoteGainNode = context.createGain();

incomingRemoteGainNode.connect(context.destination);
outgoingRemoteGainNode.connect(outgoingRemoteStreamNode);

async function setupLocalMediaStreamsFromFile(filepath) {
    return new Promise(async (resolve, reject) => {
        // AudioContext gets suspended if created before
        // a user interaction https://goo.gl/7K7WLu
        context.resume();

        // Create media source
        // This is attached to the HTML audio element and can be fed arbitrary buffers of audio
        // TODO: Make sure we can support MIME other than audio/mpeg
        let mediaSource = new MediaSource();
        console.log('Created MediaSource.');
        console.dir(mediaSource);

        // Can't call addSourceBuffer until it's open
        mediaSource.addEventListener('sourceopen', async () => {
            console.log('MediaSource open.');

            // Corner case for file:// protocol since fetch won't like it

            let buffer = mediaSource.addSourceBuffer('audio/mpeg');

            console.log('Fetching data...');
            let data;
            let resp = await fetch(filepath);
            console.log("filepath", filepath);
            data = await resp.arrayBuffer();
            console.dir(data);
            buffer.appendBuffer(data);
            console.log('Data loaded.');

        });

        // We need a media stream for WebRTC 
        // so run our MediaSource through a muted HTML audio element
        // and grab its stream via captureStream()
        audioContainer = document.createElement("audio");
        audioContainer.setAttribute("width", "max-content");
        audioContainer.setAttribute("autoplay", true);

        let audiofile = new Audio();
        audiofile.autoplay = true;
        audiofile.muted = false;

        // Only grab stream after it has loaded; won't have tracks if grabbed too early
        audiofile.addEventListener('canplaythrough', () => {
            try {
                let localStream = audiofile.captureStream();
                console.log("localStream inside cantplaythrough", localStream);
                gotLocalMediaStream(localStream);
            } catch (e) {
                console.warn(`Failed to captureStream() on audio elem. Assuming unsupported. Switching to receiver only.`, e);
            }
            resolve();
        });


        audioContainer.appendChild(audiofile);

        // srcObject doesn't work here ?
        audiofile.src = URL.createObjectURL(mediaSource);
        audiofile.load();
        console.log("inside the setup func", audioContainer); 
        console.log(audiofile);
    });
}

function gotLocalMediaStream(mediaStream) {
    // Disconnect our old one if we get a new one
    // and a different audio source

    console.log("localStreamNode",localStreamNode);

    if (localStreamNode) {
        localStreamNode.disconnect();
    }
    console.log("web audio",mediaStream);
    
    localStreamNode = context.createMediaStreamSource(mediaStream);
    localStreamNode.connect(outgoingRemoteGainNode);

    console.log('Connected localStreamNode.');
}


