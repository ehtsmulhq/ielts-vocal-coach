// Ultra-low-latency mic processor (50ms chunks at 16kHz for responsive speech streaming)
class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.chunkSize = 800; // 50 ms at 16 kHz (reduces pipeline latency)
    this.buffer = new Int16Array(this.chunkSize);
    this.index = 0;
    this.squaredSum = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) {
      for (let i = 0; i < channel.length; i++) {
        const sample = channel[i];
        this.squaredSum += sample * sample;

        const s = Math.max(-1, Math.min(1, sample));
        this.buffer[this.index++] = s < 0 ? s * 0x8000 : s * 0x7fff;

        if (this.index === this.chunkSize) {
          const rms = Math.sqrt(this.squaredSum / this.chunkSize);
          this.port.postMessage(
            {
              buffer: this.buffer.buffer,
              rms: rms,
            },
            [this.buffer.buffer]
          );

          this.buffer = new Int16Array(this.chunkSize);
          this.index = 0;
          this.squaredSum = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor("mic-processor", MicProcessor);
