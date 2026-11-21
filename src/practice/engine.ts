// Moteur du lecteur de partition intelligent :
//  - mode Attente : le curseur attend la (les) bonne(s) note(s) ;
//  - mode Rythme : défilement en tempo réel, décompte, notation notes + rythme ;
//  - mode Écoute : démonstration jouée par l'application.
// Gère la sélection des mains, le tempo (%), la boucle A-B et l'accompagnement automatique.
import { audio, LookaheadScheduler } from '../audio/AudioEngine';
import type { HandSelection, NoteStatus, Piece, ScoreNote } from '../types';

export type PracticeMode = 'wait' | 'tempo' | 'demo';

export interface SessionConfig {
  piece: Piece;
  mode: PracticeMode;
  hands: HandSelection;
  tempoPct: number;
  loop: { a: number; b: number } | null;
  autoOther: boolean;
  metronome: boolean;
  ignoreOctave: boolean;
}

export interface SessionStats {
  total: number;
  correct: number;
  ok: number;
  wrong: number;
  missed: number;
  loops: number;
}

export interface SessionResult {
  score: number;
  stats: SessionStats;
  seconds: number;
  mode: PracticeMode;
}

export interface SessionCallbacks {
  onStatuses(s: Record<string, NoteStatus>): void;
  onCurrent(id: string | null): void;
  onHints(midis: number[]): void;
  onCountIn(n: number | null): void;
  onStats(s: SessionStats): void;
  onWrongKey(midi: number): void;
  onDone(r: SessionResult): void;
  onProgress?(fraction: number): void;
}

interface Step {
  start: number;
  notes: ScoreNote[];
  auto: ScoreNote[];
  required: number[];
}

interface Expected {
  note: ScoreNote;
  time: number;
  hit: Set<number>;
  done: boolean;
  firstDev: number | null;
}

const EPS = 1e-6;

export class PracticeSession {
  private statuses: Record<string, NoteStatus> = {};
  private stats: SessionStats = { total: 0, correct: 0, ok: 0, wrong: 0, missed: 0, loops: 0 };
  private rangeStart: number;
  private rangeEnd: number;
  private rangeNotes: ScoreNote[];
  private running = false;
  private startedAt = 0;
  private timers: number[] = [];
  // mode attente
  private steps: Step[] = [];
  private idx = 0;
  private pressed = new Set<number>();
  private stepErrors = 0;
  private stepSounded = false;
  // mode tempo
  private sched = new LookaheadScheduler();
  private raf = 0;
  private t0 = 0;
  private tStart = 0;
  private countIn = 4;
  private lastCount: number | null = null;
  private iter = 0;
  private expected: Expected[] = [];
  private groupStarts: number[] = [];
  private lastCurrent: string | null = null;
  private countInHinted = false;

  constructor(
    private cfg: SessionConfig,
    private cb: SessionCallbacks,
  ) {
    const p = cfg.piece;
    const bpm = p.beatsPerMeasure;
    this.rangeStart = cfg.loop ? cfg.loop.a * bpm : 0;
    this.rangeEnd = cfg.loop ? (cfg.loop.b + 1) * bpm : p.totalBeats;
    this.rangeNotes = p.notes.filter((n) => n.start >= this.rangeStart - EPS && n.start < this.rangeEnd - EPS);
    this.groupStarts = Array.from(new Set(this.rangeNotes.map((n) => n.start))).sort((a, b) => a - b);
  }

  get spb(): number {
    return 60 / (this.cfg.piece.tempo * (this.cfg.tempoPct / 100));
  }

  private isActive(n: ScoreNote): boolean {
    if (this.cfg.mode === 'demo') return false;
    return this.cfg.hands === 'both' || n.hand === this.cfg.hands;
  }

  private baseStatuses(): Record<string, NoteStatus> {
    const s: Record<string, NoteStatus> = {};
    if (this.cfg.mode !== 'demo' && this.cfg.hands !== 'both') {
      for (const n of this.cfg.piece.notes) if (!this.isActive(n)) s[n.id] = 'dim';
    }
    return s;
  }

  private emitStatuses() {
    this.cb.onStatuses({ ...this.statuses });
  }

  private emitStats() {
    this.cb.onStats({ ...this.stats });
  }

  start() {
    this.running = true;
    this.startedAt = performance.now();
    this.statuses = this.baseStatuses();
    this.emitStatuses();
    this.emitStats();
    if (this.cfg.mode === 'wait') this.startWait();
    else this.startTempo();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    this.sched.clear();
    audio.releaseAll();
    this.cb.onHints([]);
    this.cb.onCountIn(null);
  }

  /** Termine la session (bouton « Terminer » ou fin du morceau) et renvoie le résultat. */
  finish() {
    if (!this.running) return;
    if (this.cfg.mode === 'tempo') this.finalizeMisses(Infinity);
    this.stop();
    const s = this.stats;
    const score =
      this.cfg.mode === 'demo' || s.total === 0
        ? -1
        : Math.round(
            this.cfg.mode === 'wait'
              ? ((s.correct + 0.5 * s.ok) / s.total) * 100
              : ((s.correct + 0.6 * s.ok) / s.total) * 100,
          );
    this.cb.onDone({ score, stats: { ...s }, seconds: (performance.now() - this.startedAt) / 1000, mode: this.cfg.mode });
  }

  handleNoteOn(midi: number, time: number) {
    if (!this.running) return;
    if (this.cfg.mode === 'wait') this.waitNoteOn(midi);
    else if (this.cfg.mode === 'tempo') this.tempoNoteOn(midi, time);
  }

  private matches(target: number, played: number): boolean {
    return target === played || (this.cfg.ignoreOctave && ((target - played) % 12 + 12) % 12 === 0);
  }

  // ------------------------------------------------------------------ Mode attente
  private startWait() {
    const groups = new Map<number, ScoreNote[]>();
    for (const n of this.rangeNotes) {
      if (n.isRest) continue;
      const g = groups.get(n.start) ?? [];
      g.push(n);
      groups.set(n.start, g);
    }
    this.steps = Array.from(groups.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([start, ns]) => {
        const notes = ns.filter((n) => this.isActive(n));
        const auto = this.cfg.autoOther ? ns.filter((n) => !this.isActive(n)) : [];
        const required = Array.from(new Set(notes.flatMap((n) => n.midis)));
        return { start, notes, auto, required };
      })
      .filter((s) => s.notes.length > 0 || s.auto.length > 0);
    this.idx = 0;
    this.enterStep();
  }

  private playAuto(step: Step) {
    for (const n of step.auto) audio.play(n.midis, Math.min(2.5, n.beats * this.spb * 0.95));
  }

  private enterStep() {
    if (!this.running) return;
    if (this.idx >= this.steps.length) {
      if (this.cfg.loop && this.steps.length > 0) {
        this.stats.loops++;
        this.emitStats();
        this.statuses = this.baseStatuses();
        this.emitStatuses();
        this.idx = 0;
        this.timers.push(window.setTimeout(() => this.enterStep(), 400));
        return;
      }
      this.cb.onProgress?.(1);
      this.timers.push(window.setTimeout(() => this.finish(), 300));
      return;
    }
    const step = this.steps[this.idx];
    this.cb.onProgress?.(this.idx / this.steps.length);
    this.pressed = new Set();
    this.stepErrors = 0;
    this.stepSounded = false;
    if (step.required.length === 0) {
      // Étape jouée uniquement par l'accompagnement automatique.
      this.playAuto(step);
      this.cb.onCurrent(step.auto[0]?.id ?? null);
      const next = this.steps[this.idx + 1];
      const delta = next ? Math.max(0.15, (next.start - step.start) * this.spb) : 0.3;
      this.idx++;
      this.timers.push(window.setTimeout(() => this.enterStep(), delta * 1000));
      return;
    }
    for (const n of step.notes) this.statuses[n.id] = 'current';
    this.emitStatuses();
    this.cb.onCurrent(step.notes[0].id);
    this.cb.onHints(step.required);
  }

  private waitNoteOn(midi: number) {
    const step = this.steps[this.idx];
    if (!step || step.required.length === 0) return;
    const target = step.required.find((r) => this.matches(r, midi) && !this.pressed.has(r));
    const already = step.required.find((r) => this.matches(r, midi));
    if (target === undefined && already !== undefined) return; // note déjà validée, rejouée
    if (target === undefined) {
      this.stats.wrong++;
      this.stepErrors++;
      this.emitStats();
      this.cb.onWrongKey(midi);
      for (const n of step.notes) if (this.statuses[n.id] === 'current') this.statuses[n.id] = 'wrong';
      this.emitStatuses();
      const idx = this.idx;
      this.timers.push(
        window.setTimeout(() => {
          if (this.idx !== idx || !this.running) return;
          for (const n of step.notes) if (this.statuses[n.id] === 'wrong') this.statuses[n.id] = 'current';
          this.emitStatuses();
        }, 350),
      );
      return;
    }
    this.pressed.add(target);
    if (!this.stepSounded) {
      this.stepSounded = true;
      this.playAuto(step);
    }
    for (const n of step.notes) {
      if (n.midis.every((m) => this.pressed.has(m))) this.statuses[n.id] = this.stepErrors ? 'ok' : 'correct';
    }
    this.emitStatuses();
    this.cb.onHints(step.required.filter((r) => !this.pressed.has(r)));
    if (step.required.every((r) => this.pressed.has(r))) {
      this.stats.total++;
      if (this.stepErrors === 0) this.stats.correct++;
      else this.stats.ok++;
      this.emitStats();
      this.idx++;
      this.timers.push(window.setTimeout(() => this.enterStep(), 40));
    }
  }

  // ------------------------------------------------------------------ Modes tempo & écoute
  private get loopBeats(): number {
    return this.rangeEnd - this.rangeStart;
  }

  private get window(): number {
    return Math.min(0.3, Math.max(0.15, this.spb * 0.45));
  }

  private startTempo() {
    const bpm = this.cfg.piece.beatsPerMeasure;
    this.countIn = bpm >= 4 ? bpm : bpm * 2;
    const now = audio.now();
    this.t0 = now + 0.3;
    this.tStart = this.t0 + this.countIn * this.spb;
    for (let i = 0; i < this.countIn; i++) {
      this.sched.add(this.t0 + i * this.spb, (t) => audio.click(i % bpm === 0, t));
    }
    this.iter = 0;
    this.scheduleIteration(0);
    if (this.cfg.loop) this.scheduleIteration(1);
    this.resetIteration(0);
    this.lastCount = null;
    this.tick();
  }

  private scheduleIteration(k: number) {
    const bpm = this.cfg.piece.beatsPerMeasure;
    const base = this.tStart + k * this.loopBeats * this.spb;
    if (this.cfg.metronome) {
      for (let b = Math.ceil(this.rangeStart - EPS); b < this.rangeEnd - EPS; b++) {
        const accent = Math.abs(b % bpm) < EPS;
        this.sched.add(base + (b - this.rangeStart) * this.spb, (t) => audio.click(accent, t));
      }
    }
    for (const n of this.rangeNotes) {
      if (n.isRest) continue;
      const auto = this.cfg.mode === 'demo' || (!this.isActive(n) && this.cfg.autoOther);
      if (!auto) continue;
      const dur = Math.min(3, n.beats * this.spb * 0.95);
      this.sched.add(base + (n.start - this.rangeStart) * this.spb, (t) => audio.play(n.midis, dur, t));
    }
  }

  private resetIteration(k: number) {
    const base = this.tStart + k * this.loopBeats * this.spb;
    this.expected =
      this.cfg.mode === 'demo'
        ? []
        : this.rangeNotes
            .filter((n) => !n.isRest && this.isActive(n))
            .map((note) => ({ note, time: base + (note.start - this.rangeStart) * this.spb, hit: new Set<number>(), done: false, firstDev: null }));
    if (k > 0) {
      this.statuses = this.baseStatuses();
      this.emitStatuses();
    }
  }

  private finalizeMisses(now: number) {
    let changed = false;
    for (const e of this.expected) {
      if (!e.done && e.time + this.window < now) {
        e.done = true;
        this.stats.total++;
        this.stats.missed++;
        this.statuses[e.note.id] = 'missed';
        changed = true;
      }
    }
    if (changed) {
      this.emitStatuses();
      this.emitStats();
    }
  }

  private tick = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);
    const now = audio.now();
    this.sched.pump(now);

    if (now < this.tStart) {
      const n = now < this.t0 ? null : Math.min(this.countIn, Math.floor((now - this.t0) / this.spb) + 1);
      if (n !== this.lastCount) {
        this.lastCount = n;
        this.cb.onCountIn(n);
      }
      if (!this.countInHinted && this.expected[0]) {
        this.countInHinted = true;
        const first = this.expected[0].note.start;
        this.cb.onHints(this.expected.filter((e) => Math.abs(e.note.start - first) < EPS).flatMap((e) => e.note.midis));
      }
      return;
    }
    if (this.lastCount !== null) {
      this.lastCount = null;
      this.cb.onCountIn(null);
    }

    const pos = (now - this.tStart) / this.spb;
    const k = Math.floor(pos / this.loopBeats);
    if (k > this.iter) {
      this.finalizeMisses(Infinity);
      if (!this.cfg.loop) {
        this.cb.onProgress?.(1);
        this.finish();
        return;
      }
      this.iter = k;
      this.stats.loops++;
      this.emitStats();
      this.scheduleIteration(k + 1);
      this.resetIteration(k);
    }
    this.finalizeMisses(now);
    const beat = this.rangeStart + (pos - this.iter * this.loopBeats);
    this.cb.onProgress?.((beat - this.rangeStart) / this.loopBeats);

    // Curseur : dernier groupe commencé
    let gs = this.groupStarts[0] ?? 0;
    for (const s of this.groupStarts) {
      if (s <= beat + 0.02) gs = s;
      else break;
    }
    const group = this.rangeNotes.filter((n) => Math.abs(n.start - gs) < EPS && !n.isRest);
    const cur = (group.find((n) => this.isActive(n)) ?? group[0])?.id ?? null;
    if (cur !== this.lastCurrent) {
      this.lastCurrent = cur;
      this.cb.onCurrent(cur);
      if (this.cfg.mode === 'demo') {
        for (const n of group) this.statuses[n.id] = 'current';
        for (const id of Object.keys(this.statuses)) {
          const note = this.rangeNotes.find((x) => x.id === id);
          if (note && note.start < gs - EPS && this.statuses[id] === 'current') delete this.statuses[id];
        }
        this.emitStatuses();
      } else {
        // Indications clavier : prochain groupe à jouer
        const next = this.expected.find((e) => !e.done && e.time >= now - this.window);
        const hintStart = next?.note.start;
        this.cb.onHints(
          hintStart === undefined ? [] : this.expected.filter((e) => Math.abs(e.note.start - hintStart) < EPS).flatMap((e) => e.note.midis),
        );
      }
    }
  };

  private tempoNoteOn(midi: number, time: number) {
    if (time < this.tStart - this.window) return; // pendant le décompte
    let best: Expected | null = null;
    let bestKey = -1;
    let bestDist = Infinity;
    for (const e of this.expected) {
      if (e.done) continue;
      const d = Math.abs(time - e.time);
      if (d > this.window || d >= bestDist) continue;
      const key = e.note.midis.find((m) => this.matches(m, midi) && !e.hit.has(m));
      if (key === undefined) continue;
      best = e;
      bestKey = key;
      bestDist = d;
    }
    if (!best) {
      this.stats.wrong++;
      this.emitStats();
      this.cb.onWrongKey(midi);
      return;
    }
    best.hit.add(bestKey);
    if (best.firstDev === null) best.firstDev = time - best.time;
    if (best.note.midis.every((m) => best!.hit.has(m))) {
      best.done = true;
      this.stats.total++;
      const good = Math.abs(best.firstDev) <= 0.09;
      if (good) this.stats.correct++;
      else this.stats.ok++;
      this.statuses[best.note.id] = good ? 'correct' : 'ok';
      this.emitStatuses();
      this.emitStats();
    }
  }
}
