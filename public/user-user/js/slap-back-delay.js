class SlapbackDelayNode extends AudioWorkletProcessor {
    process(input, outputs, parameters) {
        
        let context = new AudioContext();        
        //create the nodes we’ll use
        input = context.createGain();
        var output = context.createGain(),
            delay = context.createDelay(),
            feedback = context.createGain(),
            wetLevel = context.createGain();

        //set some decent values
        delay.delayTime.value = 0.15; //150 ms delay
        feedback.gain.value = 0.25;
        wetLevel.gain.value = 0.25;

        //set up the routing
        input.connect(delay);
        input.connect(output);
        delay.connect(feedback);
        delay.connect(wetLevel);
        feedback.connect(delay);
        wetLevel.connect(output);

        return true

    }
}

registerProcessor('slap-back-delay', SlapbackDelayNode)