// Moteur audio basé sur Tone.js : piano échantillonné (Salamander Grand Piano),
// synthé de secours, métronome et sons de frappe.
import * as Tone from 'tone';

const SAMPLE_BASE = 'https://tonejs.github.io/audio/salamander/';

function sampleUrls(): Record<string, string> {
  const urls: Record<string, string> = { A0: 'A0.mp3', C8: 'C8.mp3' };
  for (let o = 1; o <= 7; o++) {
    urls[`C${o}`] = `C${o}.mp3`;
    urls[`D#${o}`] = `Ds${o}.mp3`;
    urls[`F#${o}`] = `Fs${o}.mp3`;
    urls[`A${o}`] = `A${o}.mp3`;
  }
  return urls;
}

type Listener = () => void;
type ToneNote = ReturnType<ReturnType<typeof Tone.Frequency>['toNote']>;

class AudioEngineImpl {
  private started = false;
  private starting: Promise<void> | null = null;
  private sampler: Tone.Sampler | null = null;
  private synth: Tone.PolySynth | null = null;
  private clickSynth: Tone.Synth | null = null;
  private tapSynth: Tone.MembraneSynth | null = null;
  private samplerLoaded = false;
  private busyUntil = 0;
  private listeners = new Set<Listener>();

  get isStarted(): boolean {
    return this.started;
  }

  get pianoLoaded(): boolean {
    return this.samplerLoaded;
  }

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  /** À appeler depuis un geste utilisateur (clic, touche) : débloque l'audio du navigateur. */
  ensureStarted(): Promise<void> {
    if (this.started) return Promise.resolve();
    if (!this.starting) {
      this.starting = Tone.start()
        .then(() => {
          this.setup();
          this.started = true;
          this.emit();
        })
        .catch(() => {
          this.starting = null;
        });
    }
    return this.starting ?? Promise.resolve();
  }

  private setup() {
    const limiter = new Tone.Limiter(-1).toDestination();
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.4, sustain: 0.25, release: 0.9 },
    }).connect(limiter);
    this.synth.volume.value = -8;

    this.sampler = new Tone.Sampler({
      urls: sampleUrls(),
      baseUrl: SAMPLE_BASE,
      release: 1.2,
      onload: () => {
        this.samplerLoaded = true;
        this.emit();
      },
    }).connect(limiter);

    this.clickSynth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 },
    }).connect(limiter);
    this.clickSynth.volume.value = -14;

    this.tapSynth = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 3,
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
    }).connect(limiter);
    this.tapSynth.volume.value = -6;
  }

  /** Horloge audio (secondes), sans l'anticipation de Tone : à utiliser pour mesurer et planifier. */
  now(): number {
    return Tone.immediate();
  }

  private note(midi: number): ToneNote {
    return Tone.Frequency(midi, 'midi').toNote();
  }

  noteOn(midi: number, velocity = 0.8) {
    if (!this.started) {
      void this.ensureStarted();
      return;
    }
    const n = this.note(midi);
    if (this.samplerLoaded && this.sampler) this.sampler.triggerAttack(n, undefined, velocity);
    else this.synth?.triggerAttack(n, undefined, velocity);
  }

  noteOff(midi: number) {
    if (!this.started) return;
    const n = this.note(midi);
    if (this.samplerLoaded && this.sampler) this.sampler.triggerRelease(n);
    else this.synth?.triggerRelease(n);
  }

  /** Joue une ou plusieurs notes pendant `dur` secondes, éventuellement à un instant précis. */
  play(midis: number | number[], dur = 0.8, time?: number, velocity = 0.75) {
    if (!this.started) return;
    const arr = (Array.isArray(midis) ? midis : [midis]).map((m) => this.note(m));
    if (arr.length === 0) return;
    if (this.samplerLoaded && this.sampler) this.sampler.triggerAttackRelease(arr, dur, time, velocity);
    else this.synth?.triggerAttackRelease(arr, dur, time, velocity);
  }

  /** Joue un « énoncé » (dictée, exemple) et signale au micro de l'ignorer pendant ce temps. */
  playPrompt(midis: number | number[], dur = 0.8, delay = 0) {
    this.play(midis, dur, this.started ? this.now() + delay : undefined);
    this.markBusy((delay + dur) * 1000 + 350);
  }

  click(accent: boolean, time?: number) {
    if (!this.started || !this.clickSynth) return;
    this.clickSynth.triggerAttackRelease(accent ? 'C6' : 'G5', 0.03, time, accent ? 1 : 0.6);
  }

  tap(time?: number) {
    if (!this.started || !this.tapSynth) return;
    this.tapSynth.triggerAttackRelease('C3', 0.08, time, 0.9);
  }

  markBusy(ms: number) {
    this.busyUntil = Math.max(this.busyUntil, performance.now() + ms);
  }

  isBusy(): boolean {
    return performance.now() < this.busyUntil;
  }

  releaseAll() {
    if (!this.started) return;
    this.sampler?.releaseAll();
    this.synth?.releaseAll();
  }
}

export const audio = new AudioEngineImpl();

/** Planificateur à anticipation : n'envoie à Tone que les événements des ~150 prochaines ms,
 * ce qui permet d'arrêter instantanément un exercice. */
export class LookaheadScheduler {
  private pending: { time: number; fn: (time: number) => void }[] = [];
  constructor(private lookahead = 0.15) {}

  add(time: number, fn: (time: number) => void) {
    // insertion triée (recherche dichotomique)
    let lo = 0;
    let hi = this.pending.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.pending[mid].time <= time) lo = mid + 1;
      else hi = mid;
    }
    this.pending.splice(lo, 0, { time, fn });
  }

  pump(now: number) {
    let n = 0;
    while (n < this.pending.length && this.pending[n].time < now + this.lookahead) n++;
    if (n === 0) return;
    const due = this.pending.splice(0, n);
    for (const e of due) {
      if (e.time >= now - 0.05) e.fn(Math.max(e.time, now));
    }
  }

  clear() {
    this.pending = [];
  }
}
