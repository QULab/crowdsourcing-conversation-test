class SlapbackDelayNode extends AudioWorkletProcessor {
    constructor() {
        //create the nodes we’ll use
        this.input = audioContext.createGain();
        var output = audioContext.createGain(),
            delay = audioContext.createDelay(),
            feedback = audioContext.createGain(),
            wetLevel = audioContext.createGain();

        //set some decent values
        delay.delayTime.value = 0.15; //150 ms delay
        feedback.gain.value = 0.25;
        wetLevel.gain.value = 0.25;

        //set up the routing
        this.input.connect(delay);
        this.input.connect(output);
        delay.connect(feedback);
        delay.connect(wetLevel);
        feedback.connect(delay);
        wetLevel.connect(output);

        this.connect = function (target) {
            output.connect(target);
        };
    }
}

registerProcessor('slap-back-delay', SlapbackDelayNode)