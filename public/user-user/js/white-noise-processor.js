// white-noise-processor.js
let b0 ,b1, b2 ,b3,b4, b5, b6 = 0;
let lastOut = 0.0;

// class WhiteNoiseProcessor extends AudioWorkletProcessor {

    
//     process(inputs, outputs, parameters) {
//         const output = outputs[0]
//         output.forEach(channel => {
//             for (let i = 0; i < channel.length; i++) {
//                 let white = 60 * 2 - 1;
//                 channel[i] = (lastOut + (0.02 * white)) / 1.02;
//                 lastOut = channel[i];
//                 channel[i] *= 3.5; // (roughly) compensate for gain
//             }
//         })
//         return true
//     }
// }

// registerProcessor('white-noise-processor', WhiteNoiseProcessor)

class WhiteNoiseProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const output = outputs[0]
        output.forEach(channel => {
            for (let i = 0; i < channel.length; i++) {
                channel[i] = Math.random() * 2 - 1
            }
        })
        return true
    }
}

registerProcessor('white-noise-processor', WhiteNoiseProcessor)
