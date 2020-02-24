// Setup Web Audio components
window.AudioContext = (window.AudioContext || window.webkitAudioContext);
let context = new AudioContext();
let localStreamNode;
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

        // We need a media stream for WebRTC, so run
        // our MediaSource through a muted HTML audio element
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
        console.log("inside the setup func", audioContainer, audiofile, )
    });
}

function gotLocalMediaStream(mediaStream) {
    // Disconnect our old one if we get a new one
    // and a different audio source
    if (localStreamNode) {
        localStreamNode.disconnect();
    }
    console.log("web audio",mediaStream);
    
    localStreamNode = context.createMediaStreamSource(mediaStream);
    localStreamNode.connect(outgoingRemoteGainNode);

    console.log('Connected localStreamNode.');
}