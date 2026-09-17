import { REGION_LIST } from '@/lib/world/region-definitions';

/**
 * Zone-based ambient audio with crossfading
 */
export type ZoneType = 'forest' | 'city' | 'coast' | 'river' | 'mountain' | 'industrial' | 'default';

interface ZoneAudioNode {
  source: AudioBufferSourceNode | null;
  filter: BiquadFilterNode;
  gain: GainNode;
  maxGain: number;
}

export class EnvironmentZoneAudio {
  private context: AudioContext;
  private destination: GainNode;
  
  private zones: Record<ZoneType, ZoneAudioNode>;
  private waterfallNode: ZoneAudioNode;
  private readonly WATERFALL_POS = { x: -260, z: -205 };
  private isPlaying: boolean = false;
  
  private currentZone: ZoneType = 'default';
  
  // For LFO
  private lfoOscillator: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  constructor(context: AudioContext, destination: GainNode) {
    this.context = context;
    this.destination = destination;

    this.zones = {
      forest: this.createZoneNode('bandpass', 275, 1.0, 0.04), // 150-400Hz center ~275
      city: this.createZoneNode('lowpass', 200, 1.0, 0.05),
      coast: this.createZoneNode('bandpass', 350, 0.5, 0.06), // 100-600 center 350
      river: this.createZoneNode('bandpass', 800, 1.0, 0.05), // 400-1200 center ~800
      mountain: this.createZoneNode('highpass', 800, 1.0, 0.03),
      industrial: this.createZoneNode('lowpass', 150, 1.0, 0.04),
      default: this.createZoneNode('lowpass', 100, 1.0, 0.01)
    };

    // Positional cascade waterfall roar node
    this.waterfallNode = this.createZoneNode('bandpass', 520, 0.8, 0.08);

    // Setup LFO for coast
    this.setupCoastLFO();
  }
  
  private createZoneNode(filterType: BiquadFilterType, freq: number, q: number, maxGain: number): ZoneAudioNode {
    const filter = this.context.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    if (filterType !== 'lowpass' && filterType !== 'highpass') {
        filter.Q.value = q;
    }

    const gain = this.context.createGain();
    gain.gain.value = 0;
    
    filter.connect(gain);
    gain.connect(this.destination);

    return {
      source: null,
      filter,
      gain,
      maxGain
    };
  }
  
  private setupCoastLFO() {
    this.lfoOscillator = this.context.createOscillator();
    this.lfoOscillator.type = 'sine';
    this.lfoOscillator.frequency.value = 0.1; // 10s period for waves
    
    this.lfoGain = this.context.createGain();
    this.lfoGain.gain.value = 0.5; // Amplitude of modulation
    
    this.lfoOscillator.connect(this.lfoGain);
    
    // Create a node to hold base gain + LFO
    // Actually, simpler: route LFO to gain.gain of coast
    // gain.gain accepts audio rate, but we need base + LFO.
    // Web audio API allows connecting to AudioParam.
    // The signal is baseGain + lfoSignal
    // We'll manage it manually or with an intermediate node.
    // For simplicity, we just use the API where connection adds to value.
    // The coast gain value will be the base (e.g. 0.5) and LFO adds +/- 0.5.
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

  public start() {
    if (this.isPlaying) return;
    
    const noiseBuffer = this.createWhiteNoiseBuffer(3);
    
    Object.keys(this.zones).forEach((key) => {
      const zoneType = key as ZoneType;
      const zone = this.zones[zoneType];
      
      const source = this.context.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;
      source.connect(zone.filter);
      source.start();
      
      zone.source = source;
    });

    // Start positional waterfall audio source
    const wfSource = this.context.createBufferSource();
    wfSource.buffer = noiseBuffer;
    wfSource.loop = true;
    wfSource.connect(this.waterfallNode.filter);
    wfSource.start();
    this.waterfallNode.source = wfSource;

    if (this.lfoOscillator && this.lfoGain) {
       this.lfoGain.connect(this.zones.coast.gain.gain);
       this.lfoOscillator.start();
    }

    this.isPlaying = true;
  }

  public stop() {
    if (!this.isPlaying) return;
    
    Object.keys(this.zones).forEach((key) => {
      const zoneType = key as ZoneType;
      const zone = this.zones[zoneType];
      if (zone.source) {
        zone.source.stop();
        zone.source.disconnect();
        zone.source = null;
      }
    });

    if (this.waterfallNode.source) {
      this.waterfallNode.source.stop();
      this.waterfallNode.source.disconnect();
      this.waterfallNode.source = null;
    }

    if (this.lfoOscillator) {
        this.lfoOscillator.stop();
        this.lfoOscillator.disconnect();
        this.lfoOscillator = null;
    }
    if (this.lfoGain) {
        this.lfoGain.disconnect();
        this.lfoGain = null;
    }

    this.isPlaying = false;
  }
  
  private determineZone(x: number, z: number): ZoneType {
    // Check against REGION_LIST bounds
    for (const region of REGION_LIST) {
        if (x >= region.bounds.minX && x <= region.bounds.maxX &&
            z >= region.bounds.minZ && z <= region.bounds.maxZ) {
            
            // Map region categories to zone types
            if (region.category === 'nature') return 'forest';
            if (region.category === 'urban') return 'city';
            if (region.category === 'logistics') return 'industrial';
            if (region.category === 'maritime' || region.category === 'ocean') return 'coast';
            if (region.category === 'freshwater') return 'river';
            if (region.category === 'highlands') return 'mountain';
            return 'default';
        }
    }
    return 'default';
  }

  public update(droneX: number, droneZ: number) {
    if (!this.isPlaying) return;
    
    const newZone = this.determineZone(droneX, droneZ);
    
    if (newZone !== this.currentZone) {
      this.currentZone = newZone;
      const t = this.context.currentTime;
      const crossfadeDuration = 2.5;

      Object.keys(this.zones).forEach((key) => {
        const zoneType = key as ZoneType;
        const zone = this.zones[zoneType];
        
        if (zoneType === newZone) {
          // Fade in
          zone.gain.gain.setTargetAtTime(zone.maxGain, t, crossfadeDuration / 3);
          if (zoneType === 'coast' && this.lfoGain) {
              this.lfoGain.gain.setTargetAtTime(zone.maxGain * 0.8, t, crossfadeDuration / 3);
          }
        } else {
          // Fade out
          zone.gain.gain.setTargetAtTime(0, t, crossfadeDuration / 3);
        }
      });
    }

    // Positional acoustic falloff for the mountain waterfall
    const t = this.context.currentTime;
    const distW = Math.hypot(droneX - this.WATERFALL_POS.x, droneZ - this.WATERFALL_POS.z);
    if (distW < 140) {
      const falloff = Math.max(0, 1.0 - distW / 140.0);
      const targetGain = Math.pow(falloff, 1.6) * this.waterfallNode.maxGain;
      this.waterfallNode.gain.gain.setTargetAtTime(targetGain, t, 0.15);
    } else {
      this.waterfallNode.gain.gain.setTargetAtTime(0, t, 0.15);
    }
  }
}

