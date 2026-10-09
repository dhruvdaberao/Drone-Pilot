import os

file_path = 'C:/Users/wbl/Desktop/Drone-Pilot/src/lib/audio/sfx-events.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_crash = '''  public playCrash() {
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
  }'''

new_crash = '''  public playCrash() {
    const t = this.context.currentTime;
    
    // 1. Heavy Low-Frequency Thud (Impact)
    const thudDuration = 0.4;
    const thudOsc = this.context.createOscillator();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(150, t);
    thudOsc.frequency.exponentialRampToValueAtTime(30, t + thudDuration);
    
    const thudGain = this.context.createGain();
    thudGain.gain.setValueAtTime(1.0, t);
    thudGain.gain.exponentialRampToValueAtTime(0.01, t + thudDuration);
    
    thudOsc.connect(thudGain);
    thudGain.connect(this.destination);
    
    thudOsc.start(t);
    thudOsc.stop(t + thudDuration);

    // 2. High-Frequency Crunch/Snap (Breaking plastic/carbon fiber)
    const noiseDuration = 0.25;
    const noiseBuffer = this.createWhiteNoiseBuffer(noiseDuration);
    const noiseSource = this.context.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const noiseFilter = this.context.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 2000; // Let only sharp snaps through
    
    const noiseGain = this.context.createGain();
    noiseGain.gain.setValueAtTime(0.8, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + noiseDuration);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.destination);
    
    noiseSource.start(t);
    
    // Cleanup
    setTimeout(() => {
      try {
        thudOsc.disconnect();
        thudGain.disconnect();
        noiseSource.disconnect();
        noiseFilter.disconnect();
        noiseGain.disconnect();
      } catch (e) {}
    }, (thudDuration + 0.1) * 1000);
  }'''

content = content.replace(old_crash, new_crash)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
