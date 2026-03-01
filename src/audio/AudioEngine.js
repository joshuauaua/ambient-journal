import * as Tone from 'tone';

class AudioEngine {
  constructor() {
    this.initialized = false;
    this.synth = null;
    this.filter = null;
    this.reverb = null;
    this.droneSynth = null;
    this.droneStarted = false;
    this.lastTypeTime = 0;
    this.typingSpeed = 0;
    this.recorder = null;

    this.part = null;
    this.loopDuration = '8m'; // Long step sequencerloop

    // Playable Cm7 scale spanning a few octaves
    this.scale = ['C3', 'Eb3', 'G3', 'Bb3', 'C4', 'Eb4', 'G4', 'Bb4', 'C5', 'Eb5', 'G5', 'Bb5'];
  }

  async init() {
    if (this.initialized) return;

    await Tone.start();
    Tone.Transport.bpm.value = 60; // Slow BPM for ambient feel

    // Create recorder
    this.recorder = new Tone.Recorder();

    // Create effects
    this.reverb = new Tone.Reverb({
      decay: 4,
      wet: 0.8
    }).toDestination();

    // Connect reverb to recorder as well
    this.reverb.connect(this.recorder);

    this.filter = new Tone.Filter({
      type: 'lowpass',
      frequency: 2000,
      rolloff: -24
    }).connect(this.reverb);

    // Main ambient synth (Pad-like)
    this.synth = new Tone.PolySynth(Tone.Synth, {
      volume: -12, // Lower volume
      oscillator: {
        type: 'triangle' // Warmer, less glassy than sine
      },
      envelope: {
        attack: 0.8,
        decay: 0.5,
        sustain: 0.8,
        release: 4
      }
    }).connect(this.filter);

    // Drone Synth
    this.droneSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 4,
        release: 4
      }
    }).connect(this.filter);

    // Regular synth for sequencer playback (Pad-like)
    this.seqSynth = new Tone.PolySynth(Tone.Synth, {
      volume: -12, // Lower volume to match main synth
      oscillator: { type: 'triangle' },
      envelope: { attack: 1.0, decay: 0.8, sustain: 0.8, release: 5 }
    }).connect(this.filter);

    // Granular effect synth (simulate grains with fast tremolo and delay)
    this.granularSynth = new Tone.PolySynth(Tone.Synth, {
      volume: -18, // Significantly lower volume
      oscillator: { type: 'sine' },
      envelope: { attack: 0.3, decay: 0.2, sustain: 0.2, release: 1.0 } // Softer, less punchy envelope
    });
    this.granularChopper = new Tone.Tremolo({
      frequency: 25, // 25 Hz for audio-rate chopping
      type: 'square',
      depth: 0.5, // Less intense chopping depth
      spread: 180
    }).start();
    this.granularDelay = new Tone.PingPongDelay({
      delayTime: '8n',
      feedback: 0.4,
      wet: 0.4
    });
    this.granularSynth.chain(this.granularChopper, this.granularDelay, this.filter);

    // Space Synth - airy, glassy FM sound
    this.spaceSynth = new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 2.5,
      oscillator: { type: "sine" },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0, release: 0.3 }
    }).connect(this.filter);

    // Enter Synth - deep, resonant AM sound
    this.enterSynth = new Tone.AMSynth({
      harmonicity: 0.5,
      oscillator: { type: "triangle" },
      envelope: { attack: 0.1, decay: 0.6, sustain: 0.1, release: 2 }
    }).connect(this.filter);

    // Set up sequencer Part
    this.part = new Tone.Part((time, value) => {
      if (value.type === 'space') {
        this.spaceSynth.triggerAttackRelease(value.note, '16n', time);
        return;
      }
      if (value.type === 'enter') {
        this.enterSynth.triggerAttackRelease(value.note, '8n', time);
        return;
      }

      // Randomly apply granular effect to playback (approx 15% of the time)
      if (Math.random() > 0.85) {
        this.granularSynth.triggerAttackRelease(value.note, '16n', time);
      } else {
        this.seqSynth.triggerAttackRelease(value.note, '4n', time);
      }
    }, []).start(0);

    this.part.loop = true;
    this.part.loopEnd = this.loopDuration;

    // Start the transport playing
    // add small delay before transport starts
    setTimeout(() => {
      Tone.Transport.start();
    }, 100);

    this.initialized = true;
    console.log('Audio Engine Initialized');
  }

  startDrone() {
    if (!this.initialized || this.droneStarted) return;
    this.droneStarted = true;
    // Play a low, soft drone chord
    const droneNotes = ['C2', 'G2', 'C3'];
    this.droneSynth.triggerAttack(droneNotes);

    // Slow fade for the volume
    this.droneSynth.volume.value = -60;
    this.droneSynth.volume.rampTo(-15, 5);
  }

  stopDrone() {
    if (!this.droneStarted) return;
    this.droneSynth.triggerRelease();
    this.droneStarted = false;
  }

  handleType(char) {
    if (!this.initialized) return;

    const now = Tone.now();
    const timeSinceLast = now - this.lastTypeTime;
    this.lastTypeTime = now;

    // Calculate typing speed (rough estimate)
    this.typingSpeed = Math.min(1, 0.1 / Math.max(0.01, timeSinceLast));

    // Calculate sequencer position if Transport is running
    let relativeSeconds = 0;
    const isRecording = this.part && Tone.Transport.state === 'started';
    if (isRecording) {
      const currentSeconds = Tone.Transport.getSecondsAtTime(Tone.Transport.position);
      const loopSeconds = Tone.Time(this.loopDuration).toSeconds();
      relativeSeconds = currentSeconds % loopSeconds;
    }

    if (char === ' ') {
      this.spaceSynth.triggerAttackRelease('C4', '16n', now);
      if (isRecording) this.part.add(relativeSeconds, { type: 'space', note: 'C4' });
      return;
    }

    if (char === 'Enter') {
      this.enterSynth.triggerAttackRelease('C2', '8n', now);
      if (isRecording) this.part.add(relativeSeconds, { type: 'enter', note: 'C2' });
      return;
    }

    // Ignore Backspace from sequencer
    if (char === 'Backspace') return;

    // Map char to note for regular keys
    const charCode = char.toLowerCase().charCodeAt(0);
    const noteIndex = charCode % this.scale.length;
    const note = this.scale[noteIndex];

    // Play note live
    this.synth.triggerAttackRelease(note, '8n', now);

    // Record note into sequencer
    if (isRecording) {
      this.part.add(relativeSeconds, { type: 'regular', note: note });
    }

    // Dynamic filter based on speed
    const baseFreq = 500;
    const targetFreq = baseFreq + (this.typingSpeed * 4000);
    this.filter.frequency.rampTo(targetFreq, 0.1);
  }

  startRecording() {
    if (this.initialized && this.recorder && this.recorder.state !== 'started') {
      this.recorder.start();
    }
  }

  async stopRecording() {
    if (this.initialized && this.recorder && this.recorder.state === 'started') {
      const recording = await this.recorder.stop();
      return recording;
    }
    return null;
  }
}

export const audioEngine = new AudioEngine();
