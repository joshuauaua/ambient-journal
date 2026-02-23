import * as Tone from 'tone';

class AudioEngine {
  constructor() {
    this.initialized = false;
    this.synth = null;
    this.filter = null;
    this.reverb = null;
    this.lastTypeTime = 0;
    this.typingSpeed = 0;
    
    // Scale for mapping keys (A Minor/C Major ish)
    this.scale = ['C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5'];
  }

  async init() {
    if (this.initialized) return;

    await Tone.start();
    
    // Create effects
    this.reverb = new Tone.Reverb({
      decay: 4,
      wet: 0.5
    }).toDestination();

    this.filter = new Tone.Filter({
      type: 'lowpass',
      frequency: 2000,
      rolloff: -24
    }).connect(this.reverb);

    // Main ambient synth
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.5,
        release: 2
      }
    }).connect(this.filter);

    this.initialized = true;
    console.log('Audio Engine Initialized');
  }

  handleType(char) {
    if (!this.initialized) return;

    const now = Tone.now();
    const timeSinceLast = now - this.lastTypeTime;
    this.lastTypeTime = now;

    // Calculate typing speed (rough estimate)
    this.typingSpeed = Math.min(1, 0.1 / Math.max(0.01, timeSinceLast));

    // Map char to note
    const charCode = char.toLowerCase().charCodeAt(0);
    const noteIndex = charCode % this.scale.length;
    const note = this.scale[noteIndex];

    // Play note
    this.synth.triggerAttackRelease(note, '8n', now);

    // Dynamic filter based on speed
    const baseFreq = 500;
    const targetFreq = baseFreq + (this.typingSpeed * 4000);
    this.filter.frequency.rampTo(targetFreq, 0.1);
  }
}

export const audioEngine = new AudioEngine();
