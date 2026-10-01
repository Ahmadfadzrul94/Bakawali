// Bakawali Child-Friendly Audio Synthesizer (Zero external dependency, 100% offline)
class BakawaliAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.bgmPlaying = false;
    this.bgmOsc = null;
    this.bgmTimer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBeep(freq = 440, type = 'sine', duration = 0.15, vol = 0.15) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error", e);
    }
  }

  playCorrect() {
    this.init();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.2);
    });
  }

  playWrong() {
    this.init();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [260, 220].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.12, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.18);
    });
  }

  playJump() {
    this.init();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.15);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  playGem() {
    this.init();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playLaser() {
    this.init();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Offline Nursery Rhymes Synthesizer (Twinkle Twinkle, Rasa Sayang, ABC, Chan Mali Chan)
  playNurseryMelody(songKey = 'rasa_sayang', onProgress = null) {
    this.stopNurseryMelody();
    this.init();
    if (!this.ctx) return;

    const songs = {
      twinkle: [
        {f: 261.6, d: 0.4}, {f: 261.6, d: 0.4}, {f: 392.0, d: 0.4}, {f: 392.0, d: 0.4},
        {f: 440.0, d: 0.4}, {f: 440.0, d: 0.4}, {f: 392.0, d: 0.8},
        {f: 349.2, d: 0.4}, {f: 349.2, d: 0.4}, {f: 329.6, d: 0.4}, {f: 329.6, d: 0.4},
        {f: 293.7, d: 0.4}, {f: 293.7, d: 0.4}, {f: 261.6, d: 0.8}
      ],
      rasa_sayang: [
        {f: 392.0, d: 0.3}, {f: 440.0, d: 0.3}, {f: 523.3, d: 0.5}, {f: 440.0, d: 0.3},
        {f: 392.0, d: 0.3}, {f: 329.6, d: 0.5}, {f: 392.0, d: 0.3}, {f: 349.2, d: 0.3},
        {f: 329.6, d: 0.3}, {f: 293.7, d: 0.5}, {f: 329.6, d: 0.3}, {f: 349.2, d: 0.3},
        {f: 392.0, d: 0.6}, {f: 523.3, d: 0.8}
      ],
      chan_mali_chan: [
        {f: 523.3, d: 0.3}, {f: 523.3, d: 0.3}, {f: 587.3, d: 0.3}, {f: 659.3, d: 0.3},
        {f: 523.3, d: 0.3}, {f: 587.3, d: 0.3}, {f: 659.3, d: 0.6},
        {f: 587.3, d: 0.3}, {f: 523.3, d: 0.3}, {f: 440.0, d: 0.3}, {f: 392.0, d: 0.6}
      ]
    };

    const notes = songs[songKey] || songs.rasa_sayang;
    let offset = 0;
    this.bgmPlaying = true;

    notes.forEach((note, index) => {
      const timer = setTimeout(() => {
        if (!this.bgmPlaying || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + note.d * 0.9);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + note.d * 0.9);

        if (onProgress) onProgress(index + 1, notes.length);
        if (index === notes.length - 1) {
          // Loop song
          this.bgmTimer = setTimeout(() => {
            if (this.bgmPlaying) this.playNurseryMelody(songKey, onProgress);
          }, 800);
        }
      }, offset * 1000);
      offset += note.d;
    });
  }

  stopNurseryMelody() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  // Bilingual Speech Synthesis with Malay/English language auto-detection
  speak(text, lang = 'ms') {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ms' ? 'ms-MY' : 'en-US';
      utterance.rate = 0.85; // slightly slower for 5yo child clarity
      utterance.pitch = 1.2; // friendly, cheerful pitch
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech error", e);
    }
  }
}

window.bakawaliAudio = new BakawaliAudioEngine();
