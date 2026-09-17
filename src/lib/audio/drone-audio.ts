/**
 * Procedural quadcopter motor sound
 */
export class DroneAudio {
  private context: AudioContext;
  private destination: GainNode;
  private masterGain: GainNode;
  
  private oscillators: OscillatorNode[] = [];
  private oscGains: GainNode[] = [];
  private filter: BiquadFilterNode;
  
  private isPlaying: boolean = false;

  constructor(context: AudioContext, destination: GainNode) {
    this.context = context;
    this.destination = destination;

    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0;
    
    this.filter = this.context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 200; // Idle
    
    this.filter.connect(this.masterGain);
    this.masterGain.connect(this.destination);

    // Create fundamental and 3 harmonics
    const multipliers = [1, 2, 3, 5];
    
    multipliers.forEach((mult, index) => {
      const osc = this.context.createOscillator();
      osc.type = index === 0 ? 'sawtooth' : 'sine';
      
      const gain = this.context.createGain();
      gain.gain.value = 0;
      
      osc.connect(gain);
      gain.connect(this.filter);
      
      this.oscillators.push(osc);
      this.oscGains.push(gain);
    });
  }

  public start() {
    if (this.isPlaying) return;
    this.oscillators.forEach(osc => osc.start());
    this.isPlaying = true;
  }

  public stop() {
    if (!this.isPlaying) return;
    this.oscillators.forEach(osc => osc.stop());
    this.isPlaying = false;
  }

  public update(throttle: number, rpm: number, speed: number) {
    if (!this.isPlaying) return;
    
    const t = this.context.currentTime;
    const timeConstant = 0.05;

    // Fundamental frequency: 80 + throttle * 160 Hz
    const baseFreq = 80 + throttle * 160;

    const multipliers = [1, 2, 3, 5];
    this.oscillators.forEach((osc, idx) => {
      osc.frequency.setTargetAtTime(baseFreq * multipliers[idx], t, timeConstant);
    });

    // Harmonic gains
    // Fundamental is strongest, others based on throttle
    this.oscGains[0].gain.setTargetAtTime(0.5, t, timeConstant);
    this.oscGains[1].gain.setTargetAtTime(0.3 * throttle, t, timeConstant);
    this.oscGains[2].gain.setTargetAtTime(0.2 * throttle, t, timeConstant);
    this.oscGains[3].gain.setTargetAtTime(0.1 * throttle, t, timeConstant);

    // Sweep filter cutoff: 200Hz idle -> 2000Hz full
    const cutoff = 200 + throttle * 1800;
    this.filter.frequency.setTargetAtTime(cutoff, t, timeConstant);

    // Master gain: 0.03 idle -> 0.15 full throttle
    const targetGain = 0.03 + throttle * 0.12;
    this.masterGain.gain.setTargetAtTime(targetGain, t, timeConstant);
  }
}
