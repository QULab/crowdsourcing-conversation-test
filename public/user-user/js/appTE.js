'use strict';


const hangupButton = document.querySelector('button#hangupButton');
const divConsultingRoom = document.getElementById("consulting-room");
const callButton = document.querySelector('button#callButton');
const startButton = document.querySelector('button#startButton');
const acceptButton = document.querySelector('button#acceptButton');
const duration = document.getElementById('progress');
const question = document.getElementById('question');
const answerButton = document.querySelector('button#answerButton');
const buttons = document.getElementById('buttons');
const instructions = document.getElementById('instructions');
const studyInstructions = document.getElementById('study-instructions');
const callerIframe = document.getElementById('caller-iframe');
const receiverIframe = document.getElementById('receiver-iframe');
const audioButtons = document.getElementById('audio-buttons');
const feedbackDiv = document.getElementById('feedback-div');
const questionDiv = document.getElementById('question-div');
const scenarioButtonDiv = document.getElementById('scenario-button-div');
const scenarioForm = document.getElementById('scenario-form');
const callButtonDiv = document.getElementById('call-button');

let statInterval;
let hangupCounter = 0;

let localAudio = new Audio;
localAudio = document.querySelector('audio#local-audio');

let input;
let whiteNoiseNode;
let srcTE;
let delayNodeTE;
let gainNodeTE;
let audio3;
scenarioButtonDiv.style.display = "none";
callerIframe.style.display = "none";
receiverIframe.style.display = "none";

questionDiv.style.display = "none";
feedbackDiv.style.display = "none";
// question.style.visibility = "hidden";
duration.style.visibility = "hidden";
callButton.disabled = true;
callButton.onclick = startCall;

// startButton.style.visibility = 'hidden';

// for call hangup
hangupButton.disabled = true;
audioButtons.style.display = 'none';
// hangupButton.style.display = 'none';
// hangupButton.style.visibility = 'hidden';
hangupButton.onclick = endCall;



// for call begin


let roomNumber;
let localStream = new MediaStream();
let remoteStream;

let iceServers = iceServers1;

let streamConstraints = { audio: { echoCancellation: true, } };
let isCaller = false;
let latencyArray = [];

let audioContainer;
let audioContainer1;

let socket = io();

let localStreamNode;
let filteredStream;

let rtcPeerConnection = new RTCPeerConnection(iceServers);
AudioContext = window.AudioContext || window.webkitAudioContext;
let context 
let destination 
let destinationNative
let gainNode 
let oscillator 





function createAudioContext() {
    context = new AudioContext();
    destinationNative = context.destination;
    destination = context.createMediaStreamDestination();
    context.audioWorklet.addModule('js/white-noise-processor.js');
    context.audioWorklet.addModule('js/slap-back-delay.js');
    gainNode = context.createGain();
    gainNode.gain.value = 0.1;
    oscillator = context.createOscillator();
}

let averageLatency;
let averageArray;
let rttArr = [];
let resultArr = [];
let packetsLost;
let packetLossArray = [];
let averagePacketLoss;
let rArray = [];
let cArray = [];
// For Talkerecho
let tEmediaStream
let tElocalMic;
let tEdelayNode; 
let tEgainNode;


let browser = (function (agent) {
    switch (true) {
        case agent.indexOf("edge") > -1: return "edge";
        case agent.indexOf("edg") > -1: return "chrome-edge";
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
console.log(browser);

const browsers = ['edge', 'chrome-edge', 'opera', 'safari'];

if (browser === 'ie') {
    supported = false;
    location.href = "../unsupported.html";
}
else if (browsers.includes(browser)) {
    supported = false;
    location.href = "../unsupported.html";
}
// browser();

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


// $('#local-audio').on('timeupdate', function () {
//     $('#seekbar').attr("value", this.currentTime / this.duration);
// })

$('.ended').toast('hide');

let scaleAnswer;
let noise = false;
let oscillate = false;
let slapback = false;
let delay = false;
let echoFeedback = false;
let echo = false;
let pl = false;
let pl_state = 0;
let ppl = 0.1;
let burstRate = 2;
let audio4 = new Audio();
let jobConfig;
let study_name;
let instructionHtml;
let htmlPartyCaller;
let htmlPartyReceiver;
let ratingScaleHtml;
let SNR_DB;
let delayTime = 0;
let delayEchoTime = 0;
let scenario;
let attenuation;

let talkerecho
let attenuationTE
let delayTimeTE

let noiseFileName;
let loadConfig = false;
let feedback = new Object;
let dArray = [];
let qual_answers;

const url = window.location.href;
console.log("url", url);
const queryString = window.location.search;
console.log("queryString", queryString);
const urlParams = new URLSearchParams(queryString);
roomNumber = urlParams.get('roomNumber');
// noise = urlParams.get('noise');
// oscillate = urlParams.get('oscillate');
// delay = urlParams.get('delay');
// slapback = urlParams.get('slapback');
// feedback = urlParams.get('feedback');
// echo = urlParams.get('echo');
// pl = urlParams.get('pl');
// ppl = urlParams.get('ppl');
// burstRate = urlParams.get('burstRate');
study_name = urlParams.get('study_name');

// myDelayNode

// Custom class definition
class MyDelayNode extends GainNode {
    constructor(context, opt) {
        super(context);
        // Internal Nodes
        this._delay = new DelayNode(context, { delayTime: 1 });
        this._mix = new GainNode(context, { gain: 1 });
        this._feedback = new GainNode(context, { gain: 0.5 });
        this._output = new GainNode(context, { gain: 0 });

        // Export parameters
        this.delayTime = this._delay.delayTime;
        this.feedback = this._feedback.gain;
        this.mix = this._mix.gain;

        // Options setup
        for (let k in opt) {
            switch (k) {
                case 'delayTime': this.delayTime.value = opt[k];
                    break;
                case 'feedback': this.feedback.value = opt[k];
                    break;
                case 'mix': this.mix.value = opt[k];
                    break;
            }
        }

        this._inputConnect = this.connect;   // input side, connect of super class
        this.connect = this._outputConnect;  // connect() method of output

        this._inputConnect(this._delay).connect(this._mix).connect(this._output);
        this._inputConnect(this._output);
        this._delay.connect(this._feedback).connect(this._delay);
    }
    _outputConnect(to, output, input) {
        return this._output.connect(to, output, input);
    }
}

async function fetchJobConfig() {
    let localUrl = "http://localhost:3000/jobConfig";
    let ownNetworkUrl = "http://192.168.178:3000/jobConfig"
    let serverUrl = "https://conversation-test.qulab.org/jobConfig"
    const response = await fetch(serverUrl);
    const data = await response.json();
    console.log({ data });
    data.data.forEach(e => {
        console.log({ study_name });
        console.log({ e });
        if (e.study_name === String(study_name)) {
            jobConfig = e;
        }
        
    });
    console.log({ jobConfig });
    loadConfig = setJobConfig(jobConfig);

    // fetch(serverUrl, {
    //     method: 'GET',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    // })
    //     .then((response) => response.json())
    //     .then((data) => {
    //         console.log('Success:', data);
    //         dArray = data;
    //         dArray.forEach(e => {
    //             if (e.study_name == study_name) {
    //                 jobConfig = e;
    //             }
    //         }),
    //             console.log({ jobConfig }),
    //             loadConfig = setJobConfig(jobConfig)
    //     }).catch((error) => {
    //         console.error('Error:', error);
    //     });
}


function setJobConfig(jobConfig) {
    // fetchJobConfig();
    instructionHtml = jobConfig.instruction_html;
    htmlPartyCaller = jobConfig.html_party_caller;
    htmlPartyReceiver = jobConfig.html_party_receiver;
    ratingScaleHtml = jobConfig.rating_scale_html;
    if (instructionHtml) {
        document.getElementById('study-instructions-iframe').setAttribute("src", instructionHtml);
    }

    if (htmlPartyCaller && htmlPartyReceiver) {
        document.getElementById('caller').setAttribute("src", htmlPartyCaller);
        document.getElementById('receiver').setAttribute("src", htmlPartyReceiver);
    }
    scenario = jobConfig.scenario;
    // attenuation = jobConfig.attenuation;
    jobConfig.config_details.forEach(e => {
        if (e.condition_type == "noise") {
            noise = true;
            SNR_DB = e.SNR_DB;
            noiseFileName = e.noise_file;
        } else if (e.condition_type == "delay") {
            delay = true;
            delayTime = Number(e.delay_time_sec);
        } else if (e.condition_type == "packet_loss") {
            pl = true;
            ppl = e.probability;
            burstRate = e.burst_ratio;
        } else if (e.condition_type == "echo") {
            echo = true;
            attenuation = e.attenuation;
            delayEchoTime = e.delay_time_sec;
        } else if(e.condition_type == "talkerecho"){
            console.log("CONDITION IS TALKER ECHO")
            talkerecho=true;
            attenuationTE = e.attenuation;
            delayTimeTE = e.delay_time_sec;

        }
    })
    return true;
}

console.log(roomNumber);
if (roomNumber != null) {
    socket.emit("create or join", roomNumber);
    // divConsultingRoom.style = "display: block";

}

function startCall() {
    createAudioContext();
    socket.emit("caller_ready", roomNumber);
    socket.emit("ready", roomNumber);
}

socket.on("accept_call", function () {
    $('#callModal').modal('show');
    if (!isCaller) {
        audio4.src = "../../assets/classic_cell_phone.mp3";
        audio4.play();
    }
    acceptButton.onclick = acceptCall;

})

function acceptCall() {
    createAudioContext();
    socket.emit("ready", roomNumber);
    audio4.pause();
    audio4.currentTime = 0;
    receiverIframe.style.display = "block";
    instructions.style.display = "none";

}

socket.on("called", function () {
    callButton.disabled = true;
})


// on creating the room - call initiator 
socket.on("created", function (room) {
    fetchJobConfig();
    console.log("Local User -- Caller");
    navigator.mediaDevices.getUserMedia(
        streamConstraints).then(
            (stream) => {
                // localStream = stream;
                if (delay) {
                    let n = context.createMediaStreamSource(stream);
                    let delayNode = context.createDelay(5);
                    delayNode.delayTime.value = delayTime;
                    let dest = context.createMediaStreamDestination();
                    n.connect(delayNode);
                    delayNode.connect(dest);
                    localStream = dest.stream;
                    localAudio.srcObject = stream;
                } else {
                    localStream = stream;
                    localAudio.srcObject = stream;
                }


                isCaller = true;
                // gotLocalMediaStream(stream);
                // socket.emit("ready", roomNumber);
                // table.style.visibility = 'visible';
                // callButton.disabled = false;
                // callButton.visibility = 'hidden';
                console.log("room created, track added local");
            }).catch((error) => {
                console.log(`An error occured when accessing media devices`, error);
            });
});

// when someone joins - call receiver
socket.on("joined", function (room) {
    fetchJobConfig();

    // $('.started').toast('show');
    console.log("Remote User - receiver");
    navigator.mediaDevices.getUserMedia(streamConstraints).then(
        (stream) => {
            console.log("stream inside socket joined", stream);
            console.log("switching stream to audio file");
            // localStream = stream;
            if (delay) {
                let n = context.createMediaStreamSource(stream);
                let delayNode = context.createDelay(5);
                delayNode.delayTime.value = delayTime;
                let dest = context.createMediaStreamDestination();
                n.connect(delayNode);
                delayNode.connect(dest);
                localStream = dest.stream;
                localAudio.srcObject = stream;
            } else {
                localStream = stream;
                localAudio.srcObject = stream;
            }

        }
    );
    console.log("room joined, track added local", roomNumber);

    // socket.emit("ready", roomNumber);
    // $('.started').toast('show');
});

socket.on("user_joined", function () {
    $('.started').toast('show');
    if (isCaller) {
        callButton.disabled = false;
        console.log("inside user_joined");
    }
    let audio5 = new Audio;
    audio5.src = "../../assets/notification.mp3";
    audio5.play();
})

function endCall() {
    socket.emit("hangup", roomNumber);
}

socket.on("endCall", function () {
    hangup();
})

// for caller - on emit ready
socket.on("ready", function () {

    if (isCaller) {
        callerIframe.style.display = "block";
        // scenarioButtonDiv.style.display = "block";
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;

        console.log("caller stream", localStream);

        for (const track of localStream.getTracks()) {
            console.log("tracks", localStream);
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

    var errorMessage = document.createElement("p");
    errorMessage.setAttribute("id", "error-message");
    errorMessage.style = "color: red;";
    errorMessage.innerText = message;

    alert(errorMessage);

    // divSelectRoom.appendChild(errorMessage);
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
        // hangupButton.style.visibility = 'visible';
        // hangupButton.style.display = 'block';
        audioButtons.style.display = 'block';
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
// AUDIOFUNKTIONEN

function addTalkerEcho(){
    srcTE = context.createMediaStreamSource(localStream);
    delayNodeTE = context.createDelay();
    gainNodeTE = context.createGain();
    delayNodeTE.delayTime.value = 0.1;
    gainNodeTE.gain.value = 0.5;

    srcTE.connect(gainNodeTE);
    gainNodeTE.connect(delayNodeTE);
    delayNodeTE.connect(context.destination);


}

// function addTalkerEcho(){
//     let contextTE = new AudioContext(); 
//     let srcTE = contextTE.createMediaStreamSource(localStream);
   
    

//     let delayNodeTE = contextTE.createDelay();
//     let gainNodeTE = contextTE.createGain();

//     delayNodeTE.delayTime.value = 0.5;
//     gainNodeTE.gain.value = 1;

//     srcTE.connect(gainNodeTE);
//     gainNodeTE.connect(delayNodeTE);
//     delayNodeTE.connect(contextTE.destination);
// }


function onAddStream(event) {
    $('.connected').toast('show');
    //context.resume();
    // ECHOCODE HIER

    // localStream -> getusermedia
    // context ist audiocontext


    callButton.style.visibility = 'hidden';
    callButtonDiv.style.display = "none";
    instructions.style.display = "none";
    scenarioButtonDiv.style.display = "block";
    // hangupButton.style.visibility = 'visible';
    // hangupButton.style.display = "block";
    duration.style.visibility = "visible";
    hangupButton.disabled = false;
    // location.href = "#scenario-iframe";

    console.log("ondAddStream", event.streams);

    audio3 = new Audio();
    audio3.srcObject = event.streams[0];
    audio3.autoplay = true;
    audio3.muted = true;

    // delayNode.connect(context.destination);
    audio3.onloadedmetadata = () => {

        // true causes WebRTC getStats() receive track audioLevel == 0
        audio3.muted = false;
        if(talkerecho){
            function addTalkerEcho(delayTimeTE,attenuationTE){
                console.log("Added TALKERECHO. delaytimeTE=",delayTimeTE,"  attenuationTE=",attenuationTE)
                srcTE = context.createMediaStreamSource(localStream);
                delayNodeTE = context.createDelay();
                gainNodeTE = context.createGain();
                delayNodeTE.delayTime.value = delayTimeTE;
                gainNodeTE.gain.value = attenuationTE;
            
                srcTE.connect(gainNodeTE);
                gainNodeTE.connect(delayNodeTE);
                delayNodeTE.connect(context.destination);
            }
            function delTalkerEcho(){
                srcTE.disconnect(gainNodeTE);
                gainNodeTE.disconnect(delayNodeTE);
                delayNodeTE.disconnect(context.destination);
            }
            addTalkerEcho(delayTimeTE,attenuationTE);
            
        }
        else if (echo) {
            audio3.muted = true;
            console.log("adding delay");

            // controls if original stream should also be played
            // true causes WebRTC getStats() receive track audioLevel == 0

            const recvAudioSource = context.createMediaStreamSource(audio3.srcObject);
            const delayNode = context.createDelay(1);
            delayNode.delayTime.value = delayEchoTime; // delay by 1 second
            recvAudioSource.connect(delayNode);
            delayNode.connect(context.destination);

        }
        else if (noise) {
            
            // noise degradation implementation
            // TODO playing noise using file

            input = context.createMediaStreamSource(audio3.srcObject);
            whiteNoiseNode = new AudioWorkletNode(context, 'white-noise-processor');
            input.connect(gainNode);

           
            whiteNoiseNode.connect(gainNode);
            gainNode.connect(context.destination);
            console.log("NOISE ADDED")


        }

        // oscillator
        // const input = context.createMediaStreamSource(audio3.srcObject);
        // input.connect(gainNode);
        else if (oscillate) {
            // const input = context.createMediaStreamSource(audio3.srcObject);
            // input.connect(gainNode);
            // audio3.muted = true;

            console.log("effect oscillator");
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(100, context.currentTime); // value in hertz
            // oscillator.connect(gainNode);

            oscillator.connect(context.destination);
            oscillator.start();
        }

        // reverb
        else if (slapback) {
            //create a couple of native nodes and our custom node
            const input = context.createMediaStreamSource(audio3.srcObject);
            input.connect(gainNode);
            let gain = context.createGain();
            const slapBackNode = new AudioWorkletNode(context, 'slap-back-delay');
            const anotherGain = context.createGain();

            //connect our custom node to the native nodes and send to the output
            gain.connect(slapBackNode.input);
            customNode.connect(anotherGain);
            anotherGain.connect(context.destination);
        }

        else if (echoFeedback) {
            audio3.muted = true;

            const input = context.createMediaStreamSource(audio3.srcObject);
            let vol = new GainNode(context, { gain: 0.5 });
            let myDelay = new MyDelayNode(context, { delayTime: 1, feedback: 0 });

            input.connect(myDelay).connect(vol).connect(context.destination);
        }


        else if (pl) {


            // ppl = packet loss probability, pl_state is packet loss state which is 0 initially
            // ppl, burstRate values are read from Job configuration 
            let p, q;
            q = (1 - ppl) / burstRate;
            p = (ppl * q) / (1 - ppl);

            function determinePacketLoss(pl_state, p, q) {

                if (pl_state == 0) {
                    if (Math.random() < p) {
                        pl_state = 1;
                    }
                }
                else if (pl_state == 1) {
                    if (Math.random() < q) {
                        pl_state = 0
                    }
                }
                return pl_state;
            }

            setInterval(() => {


                pl_state = determinePacketLoss(pl_state, p, q);
                if (pl_state == 0) {
                    audio3.muted = true;
                } else {
                    audio3.muted = false;
                }
            }, 400);


            // setInterval(() => {
            //     let v = Math.random();
            //     if (v < 0.2) {
            //         audio3.muted = true;.
            //         console.log(v, "muted");
            //     } else {
            //         audio3.muted = false;
            //         console.log(v, "not muted");
            //     }
            // }, 1000)
        }
    };

    // console.log("local stream", localStream);

    statInterval = setInterval(() => {
        rtcPeerConnection.getStats(null).then(showStats, err =>
            console.log(err)
        );
    }, 1000)

    $('.connected').toast('show');


    var update = setInterval(function () {
        var mins = Math.floor(localAudio.currentTime / 60);
        var secs = Math.floor(localAudio.currentTime % 60);
        if (secs < 10) {
            secs = '0' + String(secs);
        }
        timer.innerHTML = mins + ':' + secs;
    }, 10);

}


// getStats using webrtc peerConnection.getstats()
function showStats(results) {

    results.forEach(element => {
        //console.log(element);
        resultArr.push(element);
        //console.log(resultArr);
        if (element.type == 'remote-inbound-rtp') {
            // console.log(element);
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
            averagePacketLoss = averageArray(packetLossArray);
        }
    });
}

rtcPeerConnection.oniceconnectionstatechange = function () {
    if (rtcPeerConnection.iceConnectionState == 'closed') {
        console.log('Disconnected');
        $('.ended').toast('show');
    }
}


// call hangup
function hangup() {


    if (hangupCounter == 0) {
        console.log('Ending call');
        clearInterval(statInterval);
        $('.ended').toast('show');
        if (rtcPeerConnection) {
            rtcPeerConnection.ontrack = null;
            rtcPeerConnection.onremovetrack = null;
            rtcPeerConnection.onremovestream = null;
            rtcPeerConnection.onicecandidate = null;
            rtcPeerConnection.oniceconnectionstatechange = null;
            rtcPeerConnection.onsignalingstatechange = null;
            rtcPeerConnection.onicegatheringstatechange = null;
            rtcPeerConnection.onnegotiationneeded = null;

            if (localAudio.srcObject) {
                localAudio.pause();
            }

            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }

            rtcPeerConnection.close();
            rtcPeerConnection = null;

            localAudio.removeAttribute("src");
            localAudio.removeAttribute("srcObject");
        }

        hangupButton.disabled = true;
        // buttons.style.display = "none";
        duration.style.display = "none";
        audioButtons.style.display = 'none';
        hangupButton.style.display = "none";
        instructions.style.display = "none";
        studyInstructions.style.display = "none";
        feedbackDiv.style.display = "block";

        // question.style.visibility = "visible";
        studyInstructions.style.display = "none";
        callerIframe.style.display = "none";
        scenarioButtonDiv.style.display = "none";
        receiverIframe.style.display = "none";
        hangupCounter = 0;
        // answerButton.onclick = sendData;
        // document.getElementById("rating_page").style.display = "block";
        //table.style.visibility = 'hidden';
        // sendData();
    }

}

// $('#caller').load(function () {

//         let x = JSON.stringify($("body").serializeArray());
//         console.log({ x });
//         return false;

// });

function scenarioAnswer() {
    let form = document.getElementById('scenario-form');
    // let x = document.querySelector('scenario-form.scenario-form').elements;
    form.onsubmit = function (event) {
        event.preventDefault();

        $("#caller").contents().find('input').each(function () {
            let p = {
                name: this.name,
                value: this.value
            }
            cArray.push(p);
        });


        $("#receiver").contents().find('input').each(function () {
            let p = {
                name: this.name,
                value: this.value
            }
            rArray.push(p);
        });
        // let x = JSON.stringify($("#caller").serializeArray());
        console.log({ cArray });
        console.log({ rArray });
        hangup();
    }

}

function feedBackAnswer() {
    let form = document.getElementById('feedback');
    form.onsubmit = function (event) {
        event.preventDefault();
        console.log("form elements", form.elements);
        let x = JSON.stringify($("form").serializeArray());

        x = JSON.parse(x);
        console.log({ x })
        // console.log("answer", form.elements["feedback"].value);
        let follow = x.find(a => a.name === "follow");
        let outScope = x.find(a => a.name === "out-scope");
        let text = x.find(a => a.name === "comment");
        feedback = {
            follow: follow,
            outScope: outScope,
            comment: text
        }
        console.log({ feedback });
        questionDiv.style.display = "block";
        feedbackDiv.style.display = "none";
    }
}

function ratingAnswer() {
    let form = document.getElementById('question');
    form.onsubmit = function (event) {
        event.preventDefault();
        console.log("answer", form.elements["rating"].value);
        let answer = form.elements["rating"].value;
        console.log({ answer });
        scaleAnswer = answer;
        sendData();
    }
}

function sendData() {
    // show the thank you message
    let r = Math.random().toString(36).substring(10);
    // console.log("random", r);
    let fullhash = CryptoJS.MD5(r).toString();
    let hash = fullhash.substring(0, 11).toUpperCase();
    $('#modalBodyMessage')
        .html("Verification code: " + "<div id='verificationCode' style='color: #0275d8;'> " + hash + "</div>");
    //$('#modalBodyVerificationCode').html(hash);
    // $('#exampleModal').modal('show');

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
        }, 5000);
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

    // if (rttArr.length) {
    // post data to backend after hangup
    const data = {
        verificationCode: fullhash,
        config: {
            study_name: study_name,
            instruction_html: instructionHtml,
            html_party_caller: htmlPartyCaller,
            html_party_receiver: htmlPartyReceiver,
            rating_scale_html: ratingScaleHtml,
            scenario: jobConfig.scenario,
            noise: noise,
            delay: delay,
            SNR_DB: SNR_DB,
            delay_time_sec: delayTime,
            packet_loss: pl,
            probability_packet_loss: ppl,
            burst_rate: burstRate,
            echo: echo,
            attenuation: attenuation,
            delay_echo_time_sec: delayEchoTime,
            talkerecho: talkerecho,
            delay_time_TE: delayTimeTE,
            attenuationTE: attenuationTE
        },
        statistics: {
            AverageTotalTripTime: averageLatency,
            rttArr: rttArr,
            averagePacketLoss: averagePacketLoss,
        },
        url: url,
        isCaller: isCaller,
        roomNumber: roomNumber,
        browser: browser,
        os: os,
        type: "USER2USER",
        scaleAnswer: scaleAnswer,
        receiverAnswers: rArray,
        callerAnswers: cArray,
        feedback: feedback,
        qualification_answers: qual_answers,
    };
    console.log("data sent", data);
    let localPost = 'http://localhost:3000/stats';
    let serverPost1 = 'https://conversation-test.qulab.org/stats';
    let serverPost2 = 'https://webrtc.pavanct.com/stats';

    fetch(serverPost1, {
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
    location.href = `../taskcompleted.html?code=${hash}`;
    // document.getElementById("modalButton").onclick = function () {
    //     console.log("task completed");
    //     location.href = `../taskcompleted.html?code=${hash}`;
    // };
    // }
}

function getQualAnswers() {
    if (sessionStorage.hasOwnProperty('qual_test')) {
        let answers = sessionStorage.getItem('qual_test');
        qual_answers = JSON.parse(answers);
    }
}



