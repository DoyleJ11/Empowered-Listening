// processor.js
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const inputData = input[0];
      const inputData32 = Float32Array.from(inputData);
      const inputData16 = convertFloat32ToInt16(inputData32);

      // Send audio data to the main thread
      this.port.postMessage(inputData16.buffer);
    }
    return true;
  }
}

function convertFloat32ToInt16(buffer) {
  let l = buffer.length;
  const buf = new Int16Array(l);
  while (l--) {
    buf[l] = Math.min(1, buffer[l]) * 0x7fff;
  }
  return buf;
}

registerProcessor("audio-processor", AudioProcessor);
