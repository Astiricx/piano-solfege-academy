// Jeux de lecture de notes : Zen, Chrono (20 notes) et Défi 60 secondes.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SolfegeLevel, SolfegeNote } from '../../data/solfege';
import { SingleNoteStaff } from '../../score/SingleNoteStaff';
import { useKeyHints, useNoteInput } from '../../input/InputContext';
import { useProgress, withActivity, type NoteStat } from '../../state/progress';
import { FR_NAMES, LETTERS, midiToPitch, parsePitch, pitchNameLabel } from '../../lib/music';
import { audio } from '../../audio/AudioEngine';
import { Stars, Stat } from '../../components/ui';

export type GameMode = 'zen' | 'chrono' | 'challenge';

interface Props {
  level: SolfegeLevel;
  mode: GameMode;
  onExit(): void;
}

interface Attempt {
  pitch: string;
  ok: boolean;
  ms: number;
}

const ROUND_COUNT = 20;
const CHALLENGE_SECONDS = 60;
const PENALTY = 3;

const BLACK_BUTTONS = [
  { pc: 1, label: 'Do♯ / Ré♭' },
  { pc: 3, label: 'Ré♯ / Mi♭' },
  { pc: 6, label: 'Fa♯ / Sol♭' },
  { pc: 8, label: 'Sol♯ / La♭' },
  { pc: 10, label: 'La♯ / Si♭' },
];
const WHITE_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function computeStars(mode: GameMode, accuracy: number, avgMs: number, score: number): number {
  if (mode === 'challenge') {
    if (accuracy < 80) return score >= 10 ? 1 : 0;
    return score >= 30 ? 3 : score >= 20 ? 2 : score >= 10 ? 1 : 0;
  }
  if (accuracy >= 95 && avgMs <= 2500) return 3;
  if (accuracy >= 85 && avgMs <= 4000) return 2;
  if (accuracy >= 70) return 1;
  return 0;
}

/** Tirage pondéré : les notes ratées ou lentes reviennent plus souvent. */
function pickNote(notes: SolfegeNote[], stats: Record<string, NoteStat>, prev: SolfegeNote | null): SolfegeNote {
  const pool = notes.length > 1 && prev ? notes.filter((n) => !(n.pitch === prev.pitch && n.clef === prev.clef)) : notes;
  const weights = pool.map((n) => {
    const s = stats[n.pitch];
    if (!s || s.attempts < 2) return 1.4;
    const err = 1 - s.correct / s.attempts;
    const avg = s.correct ? s.totalMs / s.correct : 5000;
    return 1 + err * 3 + Math.min(2, avg / 3000);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export function ReadingGame({ level, mode, onExit }: Props) {
  const { data, settings, update } = useProgress();
  const statsRef = useRef(data.noteStats);
  statsRef.current = data.noteStats;
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [note, setNote] = useState<SolfegeNote | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const attemptsRef = useRef<Attempt[]>([]);
  attemptsRef.current = attempts;
  const [timeLeft, setTimeLeft] = useState(CHALLENGE_SECONDS);
  const shownAt = useRef(0);
  const locked = useRef(false);
  const deadline = useRef(0);
  const timers = useRef<number[]>([]);
  const naming = settings.naming;

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const nextNote = useCallback(
    (prev: SolfegeNote | null) => {
      const n = pickNote(level.notes, statsRef.current, prev);
      setNote(n);
      setFeedback(null);
      locked.current = false;
      shownAt.current = performance.now();
    },
    [level.notes],
  );

  const start = () => {
    void audio.ensureStarted();
    clearTimers();
    setAttempts([]);
    setPhase('play');
    deadline.current = performance.now() + CHALLENGE_SECONDS * 1000;
    setTimeLeft(CHALLENGE_SECONDS);
    nextNote(null);
  };

  const finish = useCallback(
    (all: Attempt[]) => {
      clearTimers();
      setPhase('done');
      locked.current = true;
      const okCount = all.filter((a) => a.ok).length;
      const accuracy = all.length ? (okCount / all.length) * 100 : 0;
      const okTimes = all.filter((a) => a.ok).map((a) => a.ms);
      const avg = okTimes.length ? okTimes.reduce((a, b) => a + b, 0) / okTimes.length : 0;
      const score = mode === 'challenge' ? okCount : Math.round(accuracy);
      const stars = computeStars(mode, accuracy, avg, okCount);
      update((p) => {
        const prev = p.solfege[level.id] ?? { best: 0, plays: 0, stars: 0 };
        return withActivity({
          ...p,
          solfege: {
            ...p.solfege,
            [level.id]: {
              best: mode === 'challenge' ? prev.best : Math.max(prev.best, score),
              bestChallenge: mode === 'challenge' ? Math.max(prev.bestChallenge ?? 0, okCount) : prev.bestChallenge,
              plays: prev.plays + 1,
              stars: Math.max(prev.stars, stars),
            },
          },
        });
      });
    },
    [level.id, mode, update],
  );

  // Minuteur du défi
  useEffect(() => {
    if (phase !== 'play' || mode !== 'challenge') return;
    const id = window.setInterval(() => {
      const left = Math.max(0, (deadline.current - performance.now()) / 1000);
      setTimeLeft(left);
      if (left <= 0) {
        window.clearInterval(id);
        finish(attemptsRef.current);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, mode, finish]);

  const answer = (playedMidi: number | null, pcAnswer: number | null) => {
    if (phase !== 'play' || !note || locked.current) return;
    const target = parsePitch(note.pitch)!;
    const ms = performance.now() - shownAt.current;
    let ok: boolean;
    if (playedMidi !== null) {
      ok = settings.exactOctave ? playedMidi === target.midi : (((playedMidi - target.midi) % 12) + 12) % 12 === 0;
    } else {
      ok = pcAnswer === ((target.midi % 12) + 12) % 12;
    }
    locked.current = true;
    const att: Attempt = { pitch: note.pitch, ok, ms };
    update((p) => {
      const s = p.noteStats[note.pitch] ?? { attempts: 0, correct: 0, totalMs: 0 };
      return {
        ...p,
        noteStats: {
          ...p.noteStats,
          [note.pitch]: { attempts: s.attempts + 1, correct: s.correct + (ok ? 1 : 0), totalMs: s.totalMs + (ok ? ms : 0) },
        },
      };
    });
    const label = pitchNameLabel(note.pitch, naming, true);
    if (ok) {
      if (playedMidi === null) audio.playPrompt(target.midi, 0.6);
      setFeedback({ ok: true, text: `Bravo ! ${label} — ${(ms / 1000).toFixed(1)} s` });
    } else {
      const played = playedMidi !== null ? pitchNameLabel(`${midiToPitch(playedMidi).letter}${midiToPitch(playedMidi).acc}${midiToPitch(playedMidi).octave}`, naming, settings.exactOctave) : null;
      setFeedback({ ok: false, text: `C’était ${label}${played ? ` (vous avez joué ${played})` : ''}` });
      audio.playPrompt(target.midi, 0.8, 0.15);
      if (mode === 'challenge') deadline.current -= PENALTY * 1000;
    }
    const all = [...attempts, att];
    setAttempts(all);
    const delay = ok ? 450 : 1300;
    if (mode !== 'challenge' && all.length >= ROUND_COUNT) {
      timers.current.push(window.setTimeout(() => finish(all), delay));
    } else {
      timers.current.push(window.setTimeout(() => nextNote(note), delay));
    }
  };

  useNoteInput((e) => {
    if (e.type === 'on') answer(e.midi, null);
  });

  const target = note ? parsePitch(note.pitch) : null;
  useKeyHints({
    correct: feedback && target ? [target.midi] : [],
  });

  const okCount = attempts.filter((a) => a.ok).length;
  const okTimes = attempts.filter((a) => a.ok).map((a) => a.ms);
  const avgMs = okTimes.length ? okTimes.reduce((a, b) => a + b, 0) / okTimes.length : 0;
  const accuracy = attempts.length ? Math.round((okCount / attempts.length) * 100) : 0;

  const slowest = useMemo(() => {
    const by: Record<string, { n: number; ok: number; ms: number }> = {};
    attempts.forEach((a) => {
      const s = (by[a.pitch] ??= { n: 0, ok: 0, ms: 0 });
      s.n++;
      if (a.ok) {
        s.ok++;
        s.ms += a.ms;
      }
    });
    return Object.entries(by)
      .map(([pitch, s]) => ({ pitch, err: s.n - s.ok, avg: s.ok ? s.ms / s.ok : 9999 }))
      .sort((a, b) => b.err - a.err || b.avg - a.avg)
      .slice(0, 4);
  }, [attempts]);

  const modeLabel = mode === 'zen' ? 'Zen' : mode === 'chrono' ? 'Chrono' : 'Défi 60 s';

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="btn-ghost -ml-2" onClick={onExit}>
          ← Niveaux
        </button>
        <div className="text-sm text-slate-500">
          Niveau {level.number} · {level.title} · <strong>{modeLabel}</strong>
        </div>
      </div>

      {phase === 'ready' && (
        <div className="card space-y-4 text-center">
          <h2 className="text-2xl font-bold">{level.title}</h2>
          <p className="text-slate-500 dark:text-slate-400">{level.description}</p>
          <p>
            {mode === 'challenge'
              ? `Trouvez un maximum de notes en ${CHALLENGE_SECONDS} secondes. Chaque erreur coûte ${PENALTY} secondes.`
              : `${ROUND_COUNT} notes. ${mode === 'chrono' ? 'Votre temps de réaction est mesuré : visez moins de 2,5 s par note.' : 'Prenez votre temps.'}`}
          </p>
          <p className="text-sm text-slate-500">
            Répondez avec le piano (MIDI ou micro), le clavier virtuel, le clavier d’ordinateur ou les boutons de nom.{' '}
            {settings.exactOctave ? 'L’octave exacte est exigée.' : 'L’octave n’est pas exigée (modifiable dans les réglages).'}
          </p>
          <button type="button" className="btn-primary !px-8 !py-3 !text-base" onClick={start}>
            ▶ C’est parti
          </button>
        </div>
      )}

      {phase === 'play' && note && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {mode === 'challenge' ? (
              <Stat label="secondes" value={Math.ceil(timeLeft)} />
            ) : (
              <Stat label="note" value={`${Math.min(attempts.length + 1, ROUND_COUNT)}/${ROUND_COUNT}`} />
            )}
            <Stat label="justes" value={okCount} />
            <Stat label="temps moyen" value={avgMs ? `${(avgMs / 1000).toFixed(1)} s` : '—'} />
          </div>
          <div className={feedback && !feedback.ok ? 'animate-shake' : ''}>
            <SingleNoteStaff pitch={note.pitch} clef={note.clef} display={level.display} status={feedback ? (feedback.ok ? 'correct' : 'wrong') : 'neutral'} />
          </div>
          <div className="h-8 text-center text-lg font-semibold">
            {feedback && <span className={`animate-pop inline-block ${feedback.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{feedback.text}</span>}
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-2">
              {LETTERS.map((l) => (
                <button key={l} type="button" className="btn-secondary !px-1 !py-3 !text-base" onClick={() => answer(null, WHITE_PC[l])}>
                  {naming === 'en' ? l : FR_NAMES[l]}
                </button>
              ))}
            </div>
            {level.accidentals && (
              <div className="grid grid-cols-5 gap-2">
                {BLACK_BUTTONS.map((b) => (
                  <button key={b.pc} type="button" className="btn !bg-slate-800 !px-1 !py-2 !text-xs text-white hover:!bg-slate-700" onClick={() => answer(null, b.pc)}>
                    {b.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {mode === 'zen' && (
            <div className="text-center">
              <button type="button" className="btn-ghost text-sm" onClick={() => finish(attempts)}>
                Terminer maintenant
              </button>
            </div>
          )}
        </>
      )}

      {phase === 'done' && (
        <div className="card animate-pop space-y-5 text-center">
          <h2 className="text-2xl font-bold">Résultats</h2>
          <div className="text-4xl">
            <Stars n={computeStars(mode, accuracy, avgMs, okCount)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label={mode === 'challenge' ? 'notes trouvées' : 'réussite'} value={mode === 'challenge' ? okCount : `${accuracy} %`} />
            <Stat label="erreurs" value={attempts.length - okCount} />
            <Stat label="temps moyen" value={avgMs ? `${(avgMs / 1000).toFixed(2)} s` : '—'} />
          </div>
          {slowest.length > 0 && (
            <div className="text-left">
              <div className="label mb-2">À retravailler dans cette série</div>
              <div className="flex flex-wrap gap-2">
                {slowest.map((s) => (
                  <span key={s.pitch} className="chip bg-slate-200 py-1 text-sm dark:bg-slate-800">
                    {pitchNameLabel(s.pitch, naming, true)} · {s.err ? `${s.err} erreur(s)` : `${(s.avg / 1000).toFixed(1)} s`}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-center gap-3">
            <button type="button" className="btn-primary" onClick={start}>
              ↻ Rejouer
            </button>
            <button type="button" className="btn-secondary" onClick={onExit}>
              Autres niveaux
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
