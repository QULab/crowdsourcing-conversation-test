'use strict';

const audio1 = document.querySelector('audio#audio1');
const audio2 = document.querySelector('audio#audio2');
const callButton = document.querySelector('button#callButton');
const hangupButton = document.querySelector('button#hangupButton');
hangupButton.disabled = true;
callButton.onclick = call;
hangupButton.onclick = hangup;


let localStream;

let localStreamNode;
const AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
let outgoingRemoteStreamNode = context.createMediaStreamDestination();
let outgoingRemoteGainNode = context.createGain();
let rtcPeerConnection = new RTCPeerConnection();

let buffer;
let isFireFox1 = false;

if (navigator.userAgent.includes("Firefox")) {
  isFireFox1 = true;
}

const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 0,
  voiceActivityDetection: false
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
  localStream.getTracks().forEach(track => rtcPeerConnection.addTrack(track, localStream));
  console.log('Adding Local Stream to peer connection');

  rtcPeerConnection.createOffer(offerOptions)
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
  rtcPeerConnection = new RTCPeerConnection(servers);
  console.log('Created local peer connection object rtcPeerConnection');
  rtcPeerConnection.onicecandidate = e => onIceCandidate(rtcPeerConnection, e);
  rtcPeerConnection = new RTCPeerConnection(servers);
  //let rtcPeerConnection = new RTCPeerConnection(servers);
  console.log('Created remote peer connection object rtcPeerConnection');
  rtcPeerConnection.onicecandidate = e => onIceCandidate(rtcPeerConnection, e);
  rtcPeerConnection.ontrack = gotRemoteStream;
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
  // console.log(`Offer from rtcPeerConnection\n${desc.sdp}`);
  rtcPeerConnection.setLocalDescription(desc)
      .then(() => {
        rtcPeerConnection.setRemoteDescription(desc).then(() => {
          return rtcPeerConnection.createAnswer().then(gotDescription2, onCreateSessionDescriptionError);
        }, onSetSessionDescriptionError);
      }, onSetSessionDescriptionError);
}

function gotDescription2(desc) {
  // console.log(`Answer from rtcPeerConnection\n${desc.sdp}`);
  rtcPeerConnection.setLocalDescription(desc).then(() => {
    rtcPeerConnection.setRemoteDescription(desc).then(() => {}, onSetSessionDescriptionError);
  }, onSetSessionDescriptionError);
}

function hangup() {
  console.log('Ending call');
  localStream.getTracks().forEach(track => track.stop());
  rtcPeerConnection.close();
  rtcPeerConnection.close();
  rtcPeerConnection = null;
  rtcPeerConnection = null;
  audio2.src = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
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
      rtcPeerConnection.getStats(null).then(showStats, err =>
          console.log(err)
      );
  }, 1000)
  }
}

function getOtherPc(pc) {
  return (pc === rtcPeerConnection) ? rtcPeerConnection : rtcPeerConnection;
}

function getName(pc) {
  return (pc === rtcPeerConnection) ? 'rtcPeerConnection' : 'rtcPeerConnection';
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
            if(isFireFox1){
              buffer = mediaSource.addSourceBuffer('audio/mpeg;codecs=opus');
            }
            else{  
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

// getStats using webrtc peerConnection.getstats()
function showStats(results) {
  // console.log(results);
  
  let rttArr = [];
  let resultArr = [];
  results.forEach(element => {
      //console.log(element);
      resultArr.push(element);
      console.log(resultArr);
      if (element.type == 'inbound-rtp') {
          //console.table(element);
          rttArr.push(parseInt(element.roundTripTime * 1000));
          document.getElementById('audio-latency').innerHTML = element.roundTripTime * 1000 + ' ms';
          document.getElementById('audio-packetsLost').innerHTML = element.packetsLost;
          let averageArray = arr => arr.reduce((prev, curr) => prev + curr) / arr.length;
          let averageLatency = Math.round(averageArray(rttArr) * 100 + Number.EPSILON) / 100;
          //console.log(averageLatency);
          document.getElementById('audio-averageLatency').innerHTML = averageLatency + ' ms';
      }
  });
}
