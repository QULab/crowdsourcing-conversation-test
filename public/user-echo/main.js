
console.log("Script läuft")

let mediaStream
let audioCtx
let AudioContext
let delayNode
let gainNode
let dest
let localMic
let audioURL

var RecordRTC


AudioContext = window.AudioContext; 
let localAudio = new Audio();
localAudio = document.querySelector('audio#local-audio');
var options = {
    type: 'audio',
    mimeType: 'audio/webm'
    //mimeType: 'audio/wav',
    //recorderType: RecordRTC.StereoAudioRecorder
}


const constraints = {
    'video': false,
    'audio': true
}
navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        console.log('Got MediaStream:', stream);
        mediaStream = stream;
  

    })
    .catch(error => {
        console.error('Error accessing media devices.', error);
    });









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
   
    localMic = audioCtx.createMediaStreamSource(mediaStream);
    dest = audioCtx.createMediaStreamDestination();
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
    localMic.connect(dest);
    recordRTC = RecordRTC(dest.stream,options);

}
function stopContext(){
    try{
        gainNode.disconnect(audioCtx.destination);
        gainNode.disconnect(dest);
        localMic.disconnect(dest);
    }
    catch(e){
        console.log("error:",e)
    }

}
function saveBlob(url, fileName) {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = fileName;
    a.click();
};
function recordStartRTC(){
    recordRTC.startRecording();
}
function recordStopRTC(){
    localAudio.muted=false;
    localAudio.paused=false;
    recordRTC.stopRecording(function(audioURL) {
        let blob = this.getBlob();

        localAudio.src = audioURL;
        console.log(audioURL)
        saveAudio(blob);
     });
     
}
function saveAudio(blob){

   // var fileofblob = new File([blob],'audio.wav');
    var fd = new FormData();
    fd.append("sessionID","blabla123");
    fd.append("isCaller",false);
    fd.append('upl',blob,"myFilename");
   


    console.log("Saving Audio")
    fetch('/audio',
    {
        method: 'post',
        body: fd
    }); 
    console.log("All Data Sent")
}