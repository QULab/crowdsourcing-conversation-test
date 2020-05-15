'use strict';

const audio1 = document.querySelector('audio#audio1');
const audio2 = document.querySelector('audio#audio2');
const callButton = document.querySelector('button#callButton');
const hangupButton = document.querySelector('button#hangupButton');
hangupButton.disabled = true;
callButton.onclick = call;
hangupButton.onclick = hangup;

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

if (navigator.userAgent.includes("Firefox")) {
  isFireFox1 = true;
}

const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 0,
  voiceActivityDetection: false
};

document.getElementById("modalButton").onclick = function () {
  location.href = "../index.html";
};

function gotStream(stream) {
  audio1.muted = true
  hangupButton.disabled = false;
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
  hangupButton.disabled = false;
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
      console.log(element);
      if (element.roundTripTime) {
        rttArr.push(parseInt(element.roundTripTime * 1000));
        document.getElementById('audio-latency').innerHTML = element.roundTripTime * 1000 + ' ms';
        averageArray = arr => arr.reduce((prev, curr) => prev + curr) / arr.length;
        averageLatency = Math.round(averageArray(rttArr) * 100 + Number.EPSILON) / 100;
        // TODO Standard deviation
        //console.log(averageLatency);
        document.getElementById('audio-averageLatency').innerHTML = averageLatency + ' ms';
      }
      document.getElementById('audio-packetsLost').innerHTML = element.packetsLost;
      // TODO packet loss array and average, standard deviation
      // packetsLost = element.packetsLost;
      packetLossArray.push(element.packetsLost);
      averageArray = arr => arr.reduce((prev, curr) => prev + curr) / arr.length;
      averagePacktLoss = averageArray(packetLossArray);
    }
  });
}

function hangup() {
  console.log('Ending call');
  localStream.getTracks().forEach(track => track.stop());
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
  audio2.src = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
  sendData();
}

function sendData() {
  if (rttArr.length) {
    var hash = CryptoJS.MD5("Message").toString();
    //alert(hash);
    // $('#myModalTitle').html(myTitle);
    $('#modalBodyMessage').html("Please copy verification code: " + "<div style='color: #0275d8;'> " + hash + "</div>");
    //$('#modalBodyVerificationCode').html(hash);
    $('#exampleModal').modal('show');

    // post data to backend after hangup
    const data = {
      verificationCode: hash,
      statistics: {
        AverageTotalTripTime: averageLatency,
        rttArr: rttArr,
        averagePacktLoss: averagePacktLoss
      },
      type: "USER2FILE",
    };
    console.log("data sent", data);
    fetch('https://conversation-test.qulab.org/stats', {
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
  }
}

function gotRemoteStream(e) {
  if (audio2.srcObject !== e.streams[0]) {
    console.log("Remote stream", e.streams[0]);
    console.log("switch stream to web audio");
    let remoteStream;
    context.resume();
    audio2.src = "https://conversation-test.qulab.org/stream/";
    //audio2.srcObject = e.streams[0];
    console.log('Received remote stream');
    setInterval(() => {
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
    console.log(audio2);
    audio2.addEventListener('canplaythrough', () => {
      try {
        let localStream = audio2.captureStream();
        console.log("localStream inside cantplaythrough", localStream);
        gotLocalMediaStream(localStream);

      } catch (e) {
        console.warn(`Failed to captureStream() on audio elem. Assuming unsupported. Switching to receiver only.`, e);
      }
      console.log("before reolve", audio2);
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
  console.log("web audio", mediaStream);

  localStreamNode = context.createMediaStreamSource(mediaStream);
  localStreamNode.connect(outgoingRemoteGainNode);
  console.log('Connected localStreamNode.');
}


