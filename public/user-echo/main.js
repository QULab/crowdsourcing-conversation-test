let mediaStream
let audioCtx
let AudioContext
let delayNode
let gainNode

console.log("Script läuft")

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

function startContext(){

    // Audio Context
    AudioContext = window.AudioContext; 
    audioCtx = new AudioContext();

    // Eibinden des Streams in den Kontext
    var localMic = audioCtx.createMediaStreamSource(mediaStream);
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
}

function startOsc(){
    const oscillator1 = audioCtx.createOscillator();
    oscillator1.type = 'square';
    oscillator1.frequency.setValueAtTime(440,audioCtx.currentTime);
    oscillator1.connect(gainNode);
    oscillator1.start();
}
    









function startOsc1(){
    const oscillator1 = audioCtx.createOscillator();
    oscillator1.type = 'square';
    oscillator1.frequency.setValueAtTime(440,audioCtx.currentTime);
    oscillator1.connect(audioCtx.destination);
    oscillator1.start();
}
function startOsc2(){
    const oscillator2 = audioCtx.createOscillator();
    oscillator2.type = 'square';
    oscillator2.frequency.setValueAtTime(880,audioCtx.currentTime);
    oscillator2.connect(audioCtx.destination);
    oscillator2.start();
}
function stopOsc1(){
    oscillator1.stop();
}
function stopOsc2(){
    oscillator2.stop();
}

