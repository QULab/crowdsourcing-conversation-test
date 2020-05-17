const localAudio = document.querySelector('audio#local-audio');
const hangupButton = document.querySelector('button#hangupButton');
//const divSelectRoom = document.getElementById("select-room");
const divConsultingRoom = document.getElementById("consulting-room");
// const inputRoomNumber = document.getElementById("room-number");
// const btnGoRoom = document.getElementById("go-room");
// const table = document.getElementById("table-stats");

// table.style.visibility = 'hidden';

// for call hangup
hangupButton.disabled = true;
hangupButton.style.visibility = 'hidden';
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

let localStreamNode;

let rtcPeerConnection = new RTCPeerConnection(iceServers);

var context = new AudioContext();
let outgoingRemoteStreamNode = context.createMediaStreamDestination();
let outgoingRemoteGainNode = context.createGain();

let averageLatency;
let averageArray;
let rttArr = [];
let resultArr = [];
let packetsLost;
let packetLossArray = [];
let averagePacktLoss;

let browser = (function (agent) {
    switch (true) {
        case agent.indexOf("edge") > -1: return "edge";
        case agent.indexOf("edg") > -1: return "chromium based edge (dev or canary)";
        case agent.indexOf("opr") > -1 && !!window.opr: return "opera";
        case agent.indexOf("chrome") > -1 && !!window.chrome: return "chrome";
        case agent.indexOf("trident") > -1: return "ie";
        case agent.indexOf("firefox") > -1: return "firefox";
        case agent.indexOf("safari") > -1: return "safari";
        default: return "other";
    }
})(window.navigator.userAgent.toLowerCase());
console.log(window.navigator.userAgent.toLowerCase() + "\n" + browser);
browser = browser.toString();

let os = "Unknown OS"; 
if (navigator.userAgent.indexOf("Win") != -1) os =
    "Windows OS";
if (navigator.userAgent.indexOf("Mac") != -1) os =
    "Macintosh";
if (navigator.userAgent.indexOf("Linux") != -1) os =
    "Linux OS";
if (navigator.userAgent.indexOf("Android") != -1) os =
    "Android OS";
if (navigator.userAgent.indexOf("like Mac") != -1) os =
    "iOS"; 
os = os.toString();  

// Room code
// btnGoRoom.onclick = function () {
//     if (inputRoomNumber.value === "") {
//         alert("Please enter a room number");
//     } else {
//         roomNumber = inputRoomNumber.value;

//         socket.emit("create or join", roomNumber);

//         divSelectRoom.style = "display: none";
//         divConsultingRoom.style = "display: block";
//     }
// };
const url = window.location.href;
console.log("url", url); 
const queryString = window.location.search;
console.log("queryString", queryString);
const urlParams = new URLSearchParams(queryString);
roomNumber = urlParams.get('roomNumber');
console.log(roomNumber);
if(roomNumber != null){
    socket.emit("create or join", roomNumber);
    divConsultingRoom.style = "display: block";
}

// on creating the room - call initiator 
socket.on("created", function (room) {
    console.log("Local User -- Caller");
    navigator.mediaDevices.getUserMedia(
        streamConstraints).then(
            (stream) => {
                localStream = stream;
                localAudio.srcObject = stream;
                isCaller = true;
                gotLocalMediaStream(stream);
                socket.emit("ready", roomNumber);
                // table.style.visibility = 'visible';
                hangupButton.style.visibility = 'visible';
                hangupButton.disabled = false;
                console.log("room created, track added local");
            }).catch((error) => {
                console.log(`An error occured when accessing media devices`, error);
            });
});

// when someone joins - call reciever
socket.on("joined", function (room) {
    console.log("Remote User - Callee");

    navigator.mediaDevices.getUserMedia(streamConstraints).then(
        (stream) => {
            console.log("stream inside socket joined", stream);
            console.log("switching stream to audio file");
            // TODO switch stream from microphone to local file
            localStream = stream;
            localAudio.srcObject = stream;
            socket.emit("ready", roomNumber);
        }
    );
    console.log("room joined, track added local", roomNumber);

});

// for caller - on emit ready
socket.on("ready", function () {
    if (isCaller) {
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;

        console.log("caller stream", localStream);

        for (const track of localStream.getTracks()) {
            rtcPeerConnection.addTrack(track, localStream);
        }

        rtcPeerConnection.createOffer(setLocalOffer, function (e) {
            console.log(e);
        });
    }
});

// for callee - on offer 
socket.on("offer", function (event) {
    if (!isCaller) {

        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        console.log("Callee stream", localStream);
        for (const track of localStream.getTracks()) {
            rtcPeerConnection.addTrack(track, localStream);
        }

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

// when socket is full
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
        //table.style.visibility = 'visible';
        hangupButton.style.visibility = 'visible';
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

function onAddStream(event) {

    console.log("ondAddStream", event.streams);
    audioContainer = document.createElement("audio");
    audioContainer.setAttribute("width", "max-content");
    audioContainer.setAttribute("autoplay", true);
    audioContainer.srcObject = event.streams[0];
    divConsultingRoom.appendChild(audioContainer);
    console.log("local stream", localStream);

    setInterval(() => {
        rtcPeerConnection.getStats(null).then(showStats, err =>
            console.log(err)
        );
    }, 1000)

}

// getStats using webrtc peerConnection.getstats()
function showStats(results) {

    results.forEach(element => {
        //console.log(element);
        resultArr.push(element);
        //console.log(resultArr);
        if (element.type == 'remote-inbound-rtp') {
            console.log(element);
            if (element.roundTripTime) {
                rttArr.push(parseInt(element.roundTripTime * 1000));
                // document.getElementById('audio-latency').innerHTML = element.roundTripTime * 1000 + ' ms';
                averageArray = arr => arr.reduce((prev, curr) => prev + curr) / arr.length;
                averageLatency = Math.round(averageArray(rttArr) * 100 + Number.EPSILON) / 100;
                // TODO Standard deviation
                //console.log(averageLatency);
                // document.getElementById('audio-averageLatency').innerHTML = averageLatency + ' ms';
            }
            // document.getElementById('audio-packetsLost').innerHTML = element.packetsLost;
            // TODO packet loss array and average, standard deviation
            // packetsLost = element.packetsLost;
            packetLossArray.push(element.packetsLost);
            averageArray = arr => arr.reduce((prev, curr) => prev + curr) / arr.length;
            averagePacktLoss = averageArray(packetLossArray);
        }
    });
}

// call hangup
function hangup() {
    console.log('Ending call');
    localStream.id = null;
    audioContainer = null;
    localAudio.srcObject = null;
    rtcPeerConnection.close();
    hangupButton.disabled = true;
    //table.style.visibility = 'hidden';
    sendData();
}

function sendData() {
    // show the thank you message
    var hash = CryptoJS.MD5("Message").toString();
    $('#modalBodyMessage')
        .html("Verification code: " + "<div id='verificationCode' style='color: #0275d8;'> " + hash + "</div>");
    //$('#modalBodyVerificationCode').html(hash);
    $('#exampleModal').modal('show');

    // Tooltip

    $('#copy').tooltip({
        trigger: 'click',
        placement: 'bottom'
    });

    function setTooltip(btn, message) {
        btn.tooltip('hide')
            .attr('data-original-title', message)
            .tooltip('show');
    }

    function hideTooltip(btn) {
        setTimeout(function () {
            btn.tooltip('hide');
        }, 1000);
    }

    // Clipboard

    var clipboard = new ClipboardJS('#copy');

    clipboard.on('success', function (e) {
        console.info('Action:', e.action);
        console.info('Text:', e.text);
        console.info('Trigger:', e.trigger);
        var btn = $(e.trigger);
        setTooltip(btn, 'Copied!');

        e.clearSelection();
    });

    clipboard.on('error', function (e) {
        setTooltip('Failed!');
        console.error('Action:', e.action);
        console.error('Trigger:', e.trigger);
        var btn = $(e.trigger);
        hideTooltip(btn);
    });

    if(rttArr.length){
        // post data to backend after hangup
        const data = {
            verificationCode: hash,
            statistics: {
                AverageTotalTripTime: averageLatency,
                rttArr: rttArr,
                averagePacktLoss: averagePacktLoss,
            },
            url: url,
            roomNumber: roomNumber,
            browser: browser,
            os: os,
            type: "USER2USER",
        };
        console.log("data sent", data);
        fetch('https://conversation-test.qulab.org/stats', {   // always change to listen to server specific before docker build
            method: 'POST', // or 'PUT'
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('Success:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        
        document.getElementById("modalButton").onclick = function () {
            location.href = "../index.html";
        };    
    }  
}

// gotremotestream -- roomnumber 2
function gotRemoteStream(event) {

    // Setup Web Audio components
    setupLocalMediaStreamsFromFile('./assets/test_file.mp3');
}

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

    console.log("localStreamNode", localStreamNode);

    if (localStreamNode) {
        localStreamNode.disconnect();
    }
    console.log("web audio", mediaStream);

    localStreamNode = context.createMediaStreamSource(mediaStream);
    localStreamNode.connect(outgoingRemoteGainNode);

    console.log('Connected localStreamNode.');
}

// Recording