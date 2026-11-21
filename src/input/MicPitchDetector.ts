// Détection de hauteur en temps réel par le micro (Web Audio API + pitchy / McLeod).
import { PitchDetector } from 'pitchy';
import { freqToMidiFloat } from '../lib/music';

export interface MicSettings {
  /** Seuil de clarté pitchy (0..1). Plus haut = plus strict. */
  clarity: number;
  /** Volume minimal en dBFS. */
  minDb: number;
  /** Durée pendant laquelle une note doit être stable avant d'être validée (ms). */
  confirmMs: number;
  /** Tolérance de justesse (cents). */
  toleranceCents: number;
}

export const DEFAULT_MIC_SETTINGS: MicSettings = {
  clarity: 0.9,
  minDb: -48,
  confirmMs: 60,
  toleranceCents: 35,
};

export interface MicFrame {
  /** Niveau normalisé 0..1 pour le VU-mètre. */
  level: number;
  db: number;
  freq: number | null;
  clarity: number;
  /** Note détectée (même non confirmée). */
  midi: number | null;
  cents: number;
  /** Note actuellement confirmée (déclenchée). */
  active: number | null;
}

export interface MicCallbacks {
  onFrame(f: MicFrame): void;
  onNoteOn(midi: number): void;
  onNoteOff(midi: number): void;
  /** Si vrai, l'appli est en train de jouer un son : on ignore le micro. */
  isSuppressed(): boolean;
}

export class MicPitchDetector {
  settings: MicSettings = { ...DEFAULT_MIC_SETTINGS };
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private detector: ReturnType<typeof PitchDetector.forFloat32Array> | null = null;
  private buf: Float32Array | null = null;
  private raf = 0;
  private current: number | null = null;
  private pending: number | null = null;
  private pendingSince = 0;
  private lastValid = 0;
  private lastOn = 0;
  private minDbSinceOn = 0;
  private lastFrameEmit = 0;

  constructor(private cb: MicCallbacks) {}

  get running(): boolean {
    return this.stream !== null;
  }

  async start(): Promise<void> {
    if (this.stream) return;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Micro non disponible dans ce navigateur.');
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    src.connect(this.analyser);
    this.detector = PitchDetector.forFloat32Array(this.analyser.fftSize);
    this.buf = new Float32Array(this.detector.inputLength);
    this.loop();
  }

  stop() {
    cancelAnimationFrame(this.raf);
    if (this.current !== null) this.cb.onNoteOff(this.current);
    this.current = null;
    this.pending = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    void this.ctx?.close();
    this.ctx = null;
    this.analyser = null;
    this.cb.onFrame({ level: 0, db: -100, freq: null, clarity: 0, midi: null, cents: 0, active: null });
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    this.tick();
  };

  private tick() {
    if (!this.analyser || !this.detector || !this.buf || !this.ctx) return;
    this.analyser.getFloatTimeDomainData(this.buf as Parameters<AnalyserNode["getFloatTimeDomainData"]>[0]);
    let sum = 0;
    for (let i = 0; i < this.buf.length; i++) sum += this.buf[i] * this.buf[i];
    const rms = Math.sqrt(sum / this.buf.length);
    const db = 20 * Math.log10(rms || 1e-8);
    const [freq, clarity] = this.detector.findPitch(this.buf, this.ctx.sampleRate);
    const s = this.settings;
    const now = performance.now();

    let cand: number | null = null;
    let cents = 0;
    let midiSeen: number | null = null;
    if (db >= s.minDb && clarity >= s.clarity && freq > 25 && freq < 4500) {
      const mf = freqToMidiFloat(freq);
      const r = Math.round(mf);
      cents = (mf - r) * 100;
      midiSeen = r;
      if (Math.abs(cents) <= s.toleranceCents) cand = r;
    }
    if (this.cb.isSuppressed()) cand = null;

    if (cand !== null) {
      this.lastValid = now;
      if (cand !== this.pending) {
        this.pending = cand;
        this.pendingSince = now;
      }
      const stable = now - this.pendingSince >= s.confirmMs;
      if (stable && cand !== this.current) {
        this.trigger(cand, now, db);
      } else if (cand === this.current && db - this.minDbSinceOn > 10 && now - this.lastOn > 150) {
        // Nouvelle attaque sur la même note (note répétée) : forte remontée du volume.
        this.trigger(cand, now, db);
      }
    } else {
      this.pending = null;
      if (this.current !== null && now - this.lastValid > 120) {
        this.cb.onNoteOff(this.current);
        this.current = null;
      }
    }
    this.minDbSinceOn = Math.min(this.minDbSinceOn, db);

    if (now - this.lastFrameEmit > 50) {
      this.lastFrameEmit = now;
      const level = Math.max(0, Math.min(1, (db + 70) / 60));
      this.cb.onFrame({
        level,
        db,
        freq: clarity > 0.5 ? freq : null,
        clarity,
        midi: midiSeen,
        cents,
        active: this.current,
      });
    }
  }

  private trigger(midi: number, now: number, db: number) {
    if (this.current !== null) this.cb.onNoteOff(this.current);
    this.current = midi;
    this.lastOn = now;
    this.minDbSinceOn = db;
    this.cb.onNoteOn(midi);
  }
}
