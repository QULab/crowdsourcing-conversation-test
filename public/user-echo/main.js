console.log("Script läuft")

let mediaStream
let audioCtx
let AudioContext
let delayNode
let gainNode
let mediaRecorder
var RecordRTC
var chunks = []
var blob;

AudioContext = window.AudioContext; 
let localAudio = new Audio();
localAudio = document.querySelector('audio#local-audio');
var options = {
    type: 'audio'}


const constraints = {
    'video': false,
    'audio': true
}
navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        console.log('Got MediaStream:', stream);
        mediaStream = stream;
        mediaRecorder = new MediaRecorder(stream);
    })
    .catch(error => {
        console.error('Error accessing media devices.', error);
    });





function recordStartRTC(){
    recordRTC.startRecording();
}
function recordStopRTC(localAudio){
    localAudio.muted=false;
    localAudio.paused=false;
    recordRTC.stopRecording(function(audioURL) {
        localAudio.src = audioURL;
     });
     
}



function startAudio(){

    // USING HTML AUDIO ELEMENT AS DESTINATION

    audioCtx = new AudioContext();
    var localMic = audioCtx.createMediaStreamSource(mediaStream);
    let dest = audioCtx.createMediaStreamDestination();

    delayNode = audioCtx.createDelay();
    delayNode.delayTime.value=0.2;
    localMic.connect(delayNode);
    delayNode.connect(dest);

  
    localAudio.srcObject = dest.stream;
    localAudio.muted = false;
    localAudio.paused = false;
}
function startContext(){

    // USING LOCAL AUDIO OUTPUT VIA CONTEXT DEFAULT AS DESTIONATION
  
    audioCtx = new AudioContext();

    // Eibinden des Streams in den Kontext
    var localMic = audioCtx.createMediaStreamSource(mediaStream);
    let dest = audioCtx.createMediaStreamDestination();
    //localMic.connect(audioCtx.destination);
    console.log(audioCtx.destination);

    // DelayNode & Gainnode erstellen 
    delayNode = audioCtx.createDelay();
    gainNode = audioCtx.createGain(); 

    delayNode.delayTime.value=0.2;
    gainNode.gain.value = 0.5;

    // Von Mikro nach Delay
    localMic.connect(delayNode);
    delayNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.connect(dest);
    recordRTC = RecordRTC(mediaStream,options);
    recordStartRTC(mediaStream);

}
function recordStart(stream){
    //mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start(5000);
    console.log(mediaRecorder.state);
    console.log("Recorder Started");
}
function recordStop(){
    mediaRecorder.stop()
    console.log(mediaRecorder.state)
    console.log("Recorder stopped");
}
// mediaRecorder.ondataavailable = function(e){
//     console.log("data:",e.data);
//     chunks.push(e.data);
// }

mediaRecorder.addEventListener("dataavailable",function(event){
    console.log("EVENT FIRED")
})
mediaRecorder.onstop = function(e){
    console.log("ONSTOP");
    localAudio.controls=true;
    blob = new Blob(chunks, {'type':'audio/ogg; codecs=opus'});
    //chunks = [];
    localAudio.muted = false;
    localAudio.paused = false;
    localAudio.src = URL.createObjectURL(blob)

}




