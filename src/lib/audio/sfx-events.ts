/**
 * One-shot sound effects
 */
export class SFXEvents {
  private context: AudioContext;
  private destination: GainNode;

  constructor(context: AudioContext, destination: GainNode) {
    this.context = context;
    this.destination = destination;
  }

  private createWhiteNoiseBuffer(duration: number): AudioBuffer {
    const bufferSize = this.context.sampleRate * duration;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public playCrash() {
    const t = this.context.currentTime;
    const duration = 0.3;
    
    const noiseBuffer = this.createWhiteNoiseBuffer(duration);
    const source = this.context.createBufferSource();
    source.buffer = noiseBuffer;
    
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.destination);
    
    source.start(t);
    source.stop(t + duration);
    
    // Cleanup
    setTimeout(() => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    }, (duration + 0.1) * 1000);
  }

  public playMotorStart() {
    const t = this.context.currentTime;
    const duration = 0.5;
    
    const osc = this.context.createOscillator();
    osc.type = 'sawtooth';
    
    // Sweep from 60Hz to 120Hz
    osc.frequency.setValueAtTime(60, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + duration);
    
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + duration * 0.5);
    gain.gain.linearRampToValueAtTime(0, t + duration);
    
    osc.connect(gain);
    gain.connect(this.destination);
    
    osc.start(t);
    osc.stop(t + duration);
    
    setTimeout(() => {
      osc.disconnect();
      gain.disconnect();
    }, (duration + 0.1) * 1000);
  }

  public playAltitudeWarning() {
    const t = this.context.currentTime;
    const duration = 0.15;
    
    const osc = this.context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 800;
    
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
    
    osc.connect(gain);
    gain.connect(this.destination);
    
    osc.start(t);
    osc.stop(t + duration);
    
    setTimeout(() => {
      osc.disconnect();
      gain.disconnect();
    }, (duration + 0.1) * 1000);
  }

  public playUIClick() {
    const t = this.context.currentTime;
    const duration = 0.05;
    
    const osc = this.context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1200;
    
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
    
    osc.connect(gain);
    gain.connect(this.destination);
    
    osc.start(t);
    osc.stop(t + duration);
    
    setTimeout(() => {
      osc.disconnect();
      gain.disconnect();
    }, (duration + 0.1) * 1000);
  }
}
