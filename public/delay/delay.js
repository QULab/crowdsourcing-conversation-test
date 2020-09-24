var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var streamNode;
var masterNode;
var bypassNode;
var delayNode;
var feedbackNode;

//request an audio MediaStream track and save a reference to it
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {

        //create an audio node from the stream
        streamNode = audioCtx.createMediaStreamSource(stream);
        delayNode = audioCtx.createDelay(100)
        feedbackNode = audioCtx.createGain();
        bypassNode = audioCtx.createGain();
        masterNode = audioCtx.createGain();

        //controls
        delayNode.delayTime.value = 1;
        feedbackNode.gain.value = 0.8;
        bypassNode.gain.value = 1;

        //line up nodes
        streamNode.connect(delayNode);
        delayNode.connect(feedbackNode);
        feedbackNode.connect(delayNode);

        delayNode.connect(bypassNode);
        bypassNode.connect(masterNode);
        streamNode.connect(masterNode);

        masterNode.connect(audioCtx.destination);
    })

    .catch(e => console.log(e));