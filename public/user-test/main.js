'use strict';

const audio1 = document.querySelector('audio#audio1');
const audio2 = document.querySelector('audio#audio2');
const callButton = document.getElementById('callButton');
// const callButton = document.querySelector('button#callButton');
const question = document.getElementsByClassName('.question');
const answerButton = document.getElementById('answerButton');
// const hangupButton = document.querySelector('button#hangupButton');
// hangupButton.disabled = true;
callButton.onclick = call;
answerButton.disabled = true;
// hangupButton.onclick = hangup;

let pc1;
let pc2;
let localStream;

let localStreamNode;
const AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
let outgoingRemoteStreamNode = context.createMediaStreamDestination();
let outgoingRemoteGainNode = context.createGain();

let buffer;
let isFireFox1 = false;

let averageLatency;
let averageArray;
let rttArr = [];
let resultArr = [];
let packetsLost;
let packetLossArray = [];
let averagePacktLoss;
let reducer = (accumulator, currentValue) => accumulator + currentValue;
let sumOfRTT = 0;
let sumOfPacketLoss = 0;
let measurements = 0;
let interval;
let fileName;

$("#table :input[type=radio]").prop('disabled', true);

// browser detection

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
console.log(browser);
const browsers = ['edge', 'chome-edge', 'opera', 'safari'];

if (browser === 'ie') {
  supported = false;
  location.href = "../unsupported.html";
}
else if (browsers.includes(browser)) {
  supported = false;
  location.href = "../unsupported.html";
} 

// QueryString code

const queryString = window.location.search;
console.log("queryString", queryString);
const urlParams = new URLSearchParams(queryString);
fileName = urlParams.get('fileName');
console.log(fileName);
if (fileName == null || location.href.indexOf("USER2FILE") == -1){
  console.log("not found");
  location.href = "../404.html";
}

// OS detection
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

const url = window.location.href;
console.log("url", url);

if (navigator.userAgent.includes("Firefox")) {
  isFireFox1 = true;
}

function hide(div) {
  $("." + div).hide();
}

function show(div){
  $("." + div ).show();
}

$('#audio2').on('timeupdate', function () {
  $('#seekbar').attr("value", this.currentTime / this.duration);
})

function SetVolume(val) {
  var player = document.getElementById('audio2');
  // console.log('Before: ' + player.volume);
  player.volume = val / 100;
  // console.log('After: ' + player.volume);
}

var update = setInterval(function () {
  var mins = Math.floor(audio2.currentTime / 60);
  var secs = Math.floor(audio2.currentTime % 60);
  if (secs < 10) {
    secs = '0' + String(secs);
  }
  timer.innerHTML = mins + ':' + secs;
}, 10);

const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 0,
  voiceActivityDetection: false
};

function gotStream(stream) {
  audio1.muted = true
  audio2.play();
  // hangupButton.disabled = false;
  console.log('Received local stream');
  localStream = stream;
  gotLocalMediaStream(localStream);
  const audioTracks = localStream.getAudioTracks();
  if (audioTracks.length > 0) {
    console.log(`Using Audio device: ${audioTracks[0].label}`);
  }
  localStream.getTracks().forEach(track => pc1.addTrack(track, localStream));
  console.log('Adding Local Stream to peer connection');

  pc1.createOffer(offerOptions)
    .then(gotDescription1, onCreateSessionDescriptionError);
}

function onCreateSessionDescriptionError(error) {
  // console.log(`Failed to create session description: ${error.toString()}`);
}



function call() {
  callButton.disabled = true;
  // hangupButton.disabled = false;
  console.log('Starting call');
  const servers = null;
  pc1 = new RTCPeerConnection(servers);
  console.log('Created local peer connection object pc1');
  pc1.onicecandidate = e => onIceCandidate(pc1, e);
  pc2 = new RTCPeerConnection(servers);
  console.log('Created remote peer connection object pc2');
  pc2.onicecandidate = e => onIceCandidate(pc2, e);
  pc2.ontrack = gotRemoteStream;
  console.log('Requesting local stream');
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: false
    })
    .then(gotStream)
    .catch(e => {
      alert(`getUserMedia() error: ${e.name}`);
    });
}

function gotDescription1(desc) {
  // console.log(`Offer from pc1\n${desc.sdp}`);
  pc1.setLocalDescription(desc)
    .then(() => {
      pc2.setRemoteDescription(desc).then(() => {
        return pc2.createAnswer().then(gotDescription2, onCreateSessionDescriptionError);
      }, onSetSessionDescriptionError);
    }, onSetSessionDescriptionError);
}

function gotDescription2(desc) {
  // console.log(`Answer from pc2\n${desc.sdp}`);
  pc2.setLocalDescription(desc).then(() => {
    pc1.setRemoteDescription(desc).then(() => { }, onSetSessionDescriptionError);
  }, onSetSessionDescriptionError);
}

// getStats using webrtc peerConnection.getstats()
function showStats(results) {

  results.forEach(element => {
    //console.log(element);
    resultArr.push(element);
    //console.log(resultArr);
    if (element.type == 'remote-inbound-rtp') {
      //console.log(element);
      if (element.roundTripTime) {
        rttArr.push(parseInt(element.roundTripTime * 1000));
        // document.getElementById('audio-latency').innerHTML = element.roundTripTime * 1000 + ' ms';
        averageArray = arr => arr.reduce((prev, curr) => prev + curr) / arr.length;
        averageLatency = Math.round(averageArray(rttArr) * 100 + Number.EPSILON) / 100;
        // TODO Standard deviation
        //console.log(averageLatency);
        // document.getElementById('audio-averageLatency').innerHTML = averageLatency + ' ms';
        measurements = measurements+1;
      }
      // document.getElementById('audio-packetsLost').innerHTML = element.packetsLost;
      // TODO packet loss array and average, standard deviation
      // packetsLost = element.packetsLost;
      packetLossArray.push(element.packetsLost);
      averageArray = arr => arr.reduce((prev, curr) => prev + curr) / arr.length;
      averagePacktLoss = averageArray(packetLossArray);
    }
  });
  if(rttArr && rttArr.length){
  sumOfRTT = rttArr.reduce(reducer);
  sumOfPacketLoss = packetLossArray.reduce(reducer);
  }
}

function hideID(div) {
  $("#" + div).hide();
}

function hangup() {
  console.log('Ending call');
  clearInterval(interval);
  localStream.getTracks().forEach(track => track.stop());
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
  audio2.src = null;
  // hangupButton.disabled = true;
  // callButton.disabled = true;
  hideID("progress");
  location.href="#question";
}

function answer(){
  var form = document.getElementById('question');
  form.onsubmit = function (event) { 
    event.preventDefault();
    console.log("answer", form.elements["rating"].value);
    var answer = form.elements["rating"].value;
    sendData(answer);
   }
  
}

function sendData(answer) {
  if (rttArr.length) {
    let r = Math.random().toString(36).substring(10);
    // console.log("random", r);
    var hash = CryptoJS.MD5(r).toString();
    //alert(hash);
    // $('#myModalTitle').html(myTitle);
    $('#modalBodyMessage')
    .html("Verification code: " + "<div id='verificationCode' style='color: #0275d8;'> " + hash + "</div>");
    //$('#modalBodyVerificationCode').html(hash);
    $('#exampleModal').modal('show');

    // $(".modal").on("shown.bs.modal", function () {
    //   console.log('a', Clipboard, $('#copy'), $("#copy-input").val());
    //   var clipboard = new Clipboard('#copy')
    // });

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
      //console.info('Action:', e.action);
      //console.info('Text:', e.text);
      //console.info('Trigger:', e.trigger);
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

    // post data to backend after hangup
    const data = {
      url: url,
      verificationCode: hash,
      statistics: {
        AverageTotalTripTime: averageLatency,
        rttArr: rttArr,
        averagePacktLoss: averagePacktLoss,
        sumOfRTT: sumOfRTT,
        sumOfPacketLoss: sumOfPacketLoss,
        measurements: measurements,
      },
      type: "USER2FILE",
      os: os,
      browser: browserString.toString(),
      rating: answer,
      fileName: fileName,
    };
    console.log("data sent", data);
    // console.log("browser string", browserString);
    
    let localPost = 'http://localhost:3000/stats';
    let serverPost = 'https://webrtc.pavanct.com/stats';
    
    fetch(serverPost , {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Success:', data);
        measurements = 0;
      })
      .catch((error) => {
        console.error('Error:', error);
      });

    document.getElementById("modalButton").onclick = function () {
      location.href = "../taskcompleted.html";
    };
  }
}

function gotRemoteStream(e) {
  if (audio2.srcObject !== e.streams[0]) {
    console.log("Remote stream", e.streams[0]);
    // console.log("switch stream to web audio");
    let remoteStream;
    let streamEnded = false;
    context.resume();
    
    // audio2.src = "http://localhost:3000/stream" + "?fileName=" + fileName.toString();
    // audio2.onerror = function (error) {
    //   if (!streamEnded) {
    //     location.href = "../404.html";
    //     console.error(error);
    //   }
    // }
    
    audio2.src = "http://webrtc.pavanct.com/stream" + "?fileName=" + fileName.toString();
    audio2.onerror = function (error) {
      if (!streamEnded) {
        location.href = "../404.html";
        console.error(error);
      }
    }
    
    // audio2.src = "https://conversation-test.qulab.org/stream/" + "?fileName=" + fileName.toString();
    // audio2.onerror = function (error) {
    //   if (!streamEnded) {
    //     console.error(error);
    //     // location.href = "../404.html";
    //   }
    // }
    audio2.preload ="none";
    // audio2.play();
    //audio2.srcObject = e.streams[0];
    console.log('Received remote stream');
    
    audio2.addEventListener('ended', (event) => {
      streamEnded = true;
      console.log('audio stopped either because 1) it was over, ' +
        'or 2) no further data is available.');
        setTimeout(2000);
        // hangup and send data
        answerButton.disabled = false;
        hangup();
      $("#table :input[type=radio]").prop('disabled', false);
        // show('question');
    });
    
    interval = setInterval(() => {
      pc1.getStats(null).then(showStats, err =>
        console.log(err)
      );
    }, 1000)
  }
}

function getOtherPc(pc) {
  return (pc === pc1) ? pc2 : pc1;
}

function getName(pc) {
  return (pc === pc1) ? 'pc1' : 'pc2';
}

function onIceCandidate(pc, event) {
  getOtherPc(pc).addIceCandidate(event.candidate)
    .then(
      () => onAddIceCandidateSuccess(pc),
      err => onAddIceCandidateError(pc, err)
    );
  // console.log(`${getName(pc)} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess() {
  // console.log('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  // console.log(`Failed to add ICE Candidate: ${error.toString()}`);
}

function onSetSessionDescriptionError(error) {
  // console.log(`Failed to set session description: ${error.toString()}`);
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
    audio2.src = URL.createObjectURL(mediaSource);

    // Can't call addSourceBuffer until it's open
    mediaSource.addEventListener('sourceopen', async () => {
      console.log('MediaSource open.');

      // Corner case for file:// protocol since fetch won't like it
      if (isFireFox1) {
        buffer = mediaSource.addSourceBuffer('audio/mpeg;codecs=opus');
      }
      else {
        buffer = mediaSource.addSourceBuffer('audio/mpeg');
      }
      console.log('Fetching data...');
      let data;
      let resp = await fetch(filepath);
      console.log("filepath", filepath);
      data = await resp.arrayBuffer();
      console.dir(data);
      buffer.addEventListener('updateend', async () => {
        mediaSource.endOfStream();
        console.log(mediaSource);
        //audio2.play();
        //console.log(mediaSource.readyState); // ended
      });

      buffer.appendBuffer(data);
      console.log('Data loaded.');
    });

    // We need a media stream for WebRTC 
    // so run our MediaSource through a muted HTML audio element
    // and grab its stream via captureStream()
    // Only grab stream after it has loaded; won't have tracks if grabbed too early
    // console.log(audio2);
    audio2.addEventListener('canplaythrough', () => {
      try {
        let localStream = audio2.captureStream();
        // console.log("localStream inside cantplaythrough", localStream);
        gotLocalMediaStream(localStream);

      } catch (e) {
        console.warn(`Failed to captureStream() on audio elem. Assuming unsupported. Switching to receiver only.`, e);
      }
      // console.log("before reolve", audio2);
      resolve();
    });


    // audioContainer.appendChild(audiofile);

    // srcObject doesn't work here ?

    // audio2.load();
    // console.log(audio2);
    // audio2.play();
    // console.log("inside the setup func", audioContainer);

  });
}

function gotLocalMediaStream(mediaStream) {
  // Disconnect our old one if we get a new one
  // and a different audio source

  // console.log("localStreamNode", localStreamNode);

  if (localStreamNode) {
    localStreamNode.disconnect();
  }
  // console.log("web audio", mediaStream);

  localStreamNode = context.createMediaStreamSource(mediaStream);
  localStreamNode.connect(outgoingRemoteGainNode);
  // console.log('Connected localStreamNode.');
}



