// Module 2 : atelier rythme & métronome interactif.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RHYTHM_EXERCISES, rhythmToPiece, type RhythmExercise } from '../../data/rhythm';
import { getPiece } from '../../data';
import { audio, LookaheadScheduler } from '../../audio/AudioEngine';
import { ScoreView } from '../../score/ScoreView';
import { useNoteInput } from '../../input/InputContext';
import { isTypingTarget } from '../../input/keymap';
import { useProgress, withActivity } from '../../state/progress';
import { PageHeader, Stars, Stat, Tip, Toggle } from '../../components/ui';
import type { NoteStatus } from '../../types';
import { RhythmSymbols } from './RhythmSymbols';

type Judge = 'perfect' | 'early' | 'late' | 'missed';
const PERFECT = 0.07;

interface Onset {
  id: string;
  beat: number;
  time: number;
  window: number;
  judged: Judge | null;
}

const JUDGE_UI: Record<Judge | 'extra', { label: string; cls: string }> = {
  perfect: { label: 'Parfait', cls: 'bg-emerald-500 text-white' },
  early: { label: 'Trop tôt', cls: 'bg-amber-400 text-amber-950' },
  late: { label: 'Trop tard', cls: 'bg-orange-500 text-white' },
  missed: { label: 'Raté', cls: 'bg-rose-600 text-white' },
  extra: { label: 'Frappe en trop', cls: 'bg-slate-500 text-white' },
};

function starsFor(score: number) {
  return score >= 92 ? 3 : score >= 80 ? 2 : score >= 65 ? 1 : 0;
}

function RhythmPlayer({ ex, onExit }: { ex: RhythmExercise; onExit(): void }) {
  const piece = useMemo(() => getPiece(rhythmToPiece(ex)), [ex]);
  const { settings, setSettings, update, data } = useProgress();
  const [tempo, setTempo] = useState(ex.tempo);
  const [metronome, setMetronome] = useState(true);
  const [phase, setPhase] = useState<'idle' | 'run' | 'demo' | 'done'>('idle');
  const [countIn, setCountIn] = useState<number | null>(null);
  const [statuses, setStatuses] = useState<Record<string, NoteStatus>>({});
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [last, setLast] = useState<{ kind: Judge | 'extra'; ms: number; key: number } | null>(null);
  const [taps, setTaps] = useState<{ beat: number; kind: Judge | 'extra' }[]>([]);
  const [result, setResult] = useState<{ score: number; counts: Record<Judge | 'extra', number> } | null>(null);

  const sched = useRef(new LookaheadScheduler());
  const raf = useRef(0);
  const onsets = useRef<Onset[]>([]);
  const extras = useRef(0);
  const tStart = useRef(0);
  const t0 = useRef(0);
  const playhead = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const spb = 60 / tempo;
  const bpm = piece.beatsPerMeasure;
  const total = piece.totalBeats;
  const countBeats = bpm >= 4 ? bpm : bpm * 2;
  const notes = piece.notes;

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    sched.current.clear();
    setCountIn(null);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const finish = useCallback(() => {
    stop();
    const list = onsets.current;
    const counts: Record<Judge | 'extra', number> = { perfect: 0, early: 0, late: 0, missed: 0, extra: extras.current };
    let sum = 0;
    list.forEach((o) => {
      const j = o.judged ?? 'missed';
      counts[j]++;
      sum += j === 'perfect' ? 1 : j === 'missed' ? 0 : 0.6;
    });
    const score = list.length ? Math.max(0, Math.round(((sum - 0.25 * extras.current) / list.length) * 100)) : 0;
    setResult({ score, counts });
    setPhase('done');
    update((p) => {
      const prev = p.rhythm[ex.id] ?? { best: 0, plays: 0 };
      return withActivity({ ...p, rhythm: { ...p.rhythm, [ex.id]: { best: Math.max(prev.best, score), plays: prev.plays + 1 } } });
    });
  }, [ex.id, stop, update]);

  const begin = async (demo: boolean) => {
    await audio.ensureStarted();
    (document.activeElement as HTMLElement | null)?.blur?.();
    stop();
    setResult(null);
    setTaps([]);
    setLast(null);
    setStatuses({});
    extras.current = 0;
    const now = audio.now();
    t0.current = now + 0.3;
    tStart.current = t0.current + countBeats * spb;
    const s = sched.current;
    for (let i = 0; i < countBeats; i++) s.add(t0.current + i * spb, (t) => audio.click(i % bpm === 0, t));
    if (metronome || demo) {
      for (let b = 0; b < total; b++) s.add(tStart.current + b * spb, (t) => audio.click(b % bpm === 0, t));
    }
    const sounding = notes.filter((n) => !n.isRest);
    onsets.current = sounding.map((n, i) => {
      const prevGap = i > 0 ? n.start - sounding[i - 1].start : 4;
      const nextGap = i < sounding.length - 1 ? sounding[i + 1].start - n.start : 4;
      const win = Math.min(0.3, (Math.min(prevGap, nextGap) * spb) / 2);
      return { id: n.id, beat: n.start, time: tStart.current + n.start * spb, window: win, judged: null };
    });
    if (demo) sounding.forEach((n) => s.add(tStart.current + n.start * spb, (t) => audio.tap(t)));
    setPhase(demo ? 'demo' : 'run');

    let lastCount: number | null = null;
    let lastCur: string | null = null;
    const endTime = tStart.current + total * spb + 0.35;
    const tick = () => {
      raf.current = requestAnimationFrame(tick);
      const t = audio.now();
      s.pump(t);
      const c = t < t0.current ? null : t < tStart.current ? Math.floor((t - t0.current) / spb) + 1 : null;
      if (c !== lastCount) {
        lastCount = c;
        setCountIn(c);
      }
      const beat = (t - tStart.current) / spb;
      if (playhead.current) playhead.current.style.left = `${Math.max(0, Math.min(100, (beat / total) * 100))}%`;
      // ratés
      if (!demo) {
        let changed = false;
        for (const o of onsets.current) {
          if (!o.judged && t > o.time + o.window) {
            o.judged = 'missed';
            changed = true;
          }
        }
        if (changed) {
          setStatuses((st) => {
            const n = { ...st };
            onsets.current.forEach((o) => {
              if (o.judged === 'missed') n[o.id] = 'missed';
            });
            return n;
          });
        }
      }
      // curseur
      let cur: string | null = null;
      for (const n of notes) if (n.start <= beat + 0.02) cur = n.id;
      if (beat < 0) cur = null;
      if (cur !== lastCur) {
        lastCur = cur;
        setCurrentId(cur);
      }
      if (t > endTime) {
        if (demo) {
          stop();
          setPhase('idle');
          setCurrentId(null);
        } else finish();
      }
    };
    tick();
  };

  const tap = useCallback(
    (time: number) => {
      if (phaseRef.current !== 'run') return;
      const t = time - settings.latencyMs / 1000;
      if (t < tStart.current - 0.3) return; // décompte
      let best: Onset | null = null;
      let bestD = Infinity;
      for (const o of onsets.current) {
        if (o.judged) continue;
        const d = Math.abs(t - o.time);
        if (d <= o.window && d < bestD) {
          best = o;
          bestD = d;
        }
      }
      const beat = (t - tStart.current) / spb;
      if (!best) {
        extras.current++;
        setLast({ kind: 'extra', ms: 0, key: Math.random() });
        setTaps((tp) => [...tp, { beat, kind: 'extra' }]);
        return;
      }
      const dev = t - best.time;
      const kind: Judge = Math.abs(dev) <= PERFECT ? 'perfect' : dev < 0 ? 'early' : 'late';
      best.judged = kind;
      const id = best.id;
      setStatuses((st) => ({ ...st, [id]: kind === 'perfect' ? 'correct' : 'ok' }));
      setLast({ kind, ms: Math.round(dev * 1000), key: Math.random() });
      setTaps((tp) => [...tp, { beat, kind }]);
    },
    [settings.latencyMs, spb],
  );

  // Barre d'espace
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || isTypingTarget(e.target)) return;
      e.preventDefault();
      if (e.repeat) return;
      tap(audio.now());
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTypingTarget(e.target)) e.preventDefault();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [tap]);

  useNoteInput((e) => {
    if (e.type === 'on') tap(e.time);
  });

  const best = data.rhythm[ex.id]?.best;
  const [showCourse, setShowCourse] = useState(best === undefined);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn-ghost -ml-2" onClick={onExit}>
          ← Exercices
        </button>
        {best !== undefined && <span className="text-sm text-slate-500">Meilleur score : {best} %</span>}
      </div>
      <div>
        <h1 className="text-2xl font-bold">{ex.title}</h1>
        <p className="text-slate-500 dark:text-slate-400">{ex.description}</p>
      </div>

      <div className="card space-y-3 !p-4">
        <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setShowCourse((v) => !v)} aria-expanded={showCourse}>
          <span className="text-lg font-bold">📖 Avant de jouer : les symboles de cet exercice</span>
          <span className="text-sm text-slate-500">{showCourse ? '▲ Masquer' : '▼ Afficher'}</span>
        </button>
        {showCourse && (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Chaque figure indique combien de temps dure le son (ou le silence). Le métronome bat les temps ; vous frappez au début de chaque note. Écoutez les exemples, puis
              appuyez sur « ▶ Démarrer ».
            </p>
            <RhythmSymbols piece={piece} tempo={tempo} />
          </>
        )}
      </div>

      <div className="card flex flex-wrap items-center gap-4 !p-4">
        <label className="flex min-w-[220px] flex-1 items-center gap-3 text-sm">
          <span className="whitespace-nowrap font-medium">♩ = {tempo}</span>
          <input type="range" min={40} max={160} step={2} value={tempo} disabled={phase === 'run' || phase === 'demo'} onChange={(e) => setTempo(+e.target.value)} className="flex-1" />
        </label>
        <Toggle checked={metronome} onChange={setMetronome} label="Métronome" />
        <label className="flex items-center gap-2 text-sm" title="Si vos frappes sont toujours jugées « trop tard », augmentez la compensation.">
          Latence
          <input type="range" min={0} max={200} step={5} value={settings.latencyMs} onChange={(e) => setSettings({ latencyMs: +e.target.value })} className="w-24" />
          <span className="w-12 tabular-nums text-slate-500">{settings.latencyMs} ms</span>
        </label>
        <div className="ml-auto flex gap-2">
          {phase === 'run' || phase === 'demo' ? (
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                stop();
                setPhase('idle');
              }}
            >
              ■ Arrêter
            </button>
          ) : (
            <>
              <button type="button" className="btn-secondary" onClick={() => void begin(true)}>
                👂 Écouter
              </button>
              <button type="button" className="btn-primary" onClick={() => void begin(false)}>
                ▶ Démarrer
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative">
        <ScoreView piece={piece} statuses={statuses} currentId={currentId} maxPerLine={3} maxHeight="40vh" />
        {countIn !== null && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div key={countIn} className="animate-pop grid h-24 w-24 place-items-center rounded-full bg-indigo-600/90 text-5xl font-black text-white shadow-2xl">
              {countIn}
            </div>
          </div>
        )}
      </div>

      {/* Piste de défilement visuel */}
      <div className="card !p-3">
        <div className="relative h-14 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
          {Array.from({ length: piece.measureCount + 1 }, (_, m) => (
            <div key={m} className="absolute top-0 h-full w-px bg-slate-400/60" style={{ left: `${((m * bpm) / total) * 100}%` }} />
          ))}
          {notes.map((n) => (
            <div
              key={n.id}
              className={`absolute top-3 h-8 rounded-md border ${
                n.isRest
                  ? 'border-dashed border-slate-400 bg-transparent'
                  : statuses[n.id] === 'correct'
                    ? 'border-emerald-600 bg-emerald-400/80'
                    : statuses[n.id] === 'ok'
                      ? 'border-amber-600 bg-amber-300/80'
                      : statuses[n.id] === 'missed'
                        ? 'border-rose-600 bg-rose-400/70'
                        : 'border-indigo-500 bg-indigo-400/50'
              }`}
              style={{ left: `calc(${(n.start / total) * 100}% + 2px)`, width: `calc(${(n.beats / total) * 100}% - 4px)` }}
            />
          ))}
          {taps.map((t, i) => (
            <div
              key={i}
              className={`absolute top-1 h-12 w-1 rounded ${t.kind === 'perfect' ? 'bg-emerald-700' : t.kind === 'extra' ? 'bg-slate-500' : 'bg-orange-600'}`}
              style={{ left: `${Math.max(0, Math.min(100, (t.beat / total) * 100))}%` }}
            />
          ))}
          <div ref={playhead} className="absolute top-0 h-full w-0.5 bg-sky-500 shadow-[0_0_8px_2px_rgba(14,165,233,0.6)]" style={{ left: '0%' }} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            tap(audio.now());
          }}
          className="card col-span-2 grid h-36 select-none place-items-center text-xl font-bold transition active:scale-[0.98] active:bg-indigo-50 dark:active:bg-indigo-950"
        >
          {phase === 'run' ? 'TAPEZ ICI · barre d’espace · touche du piano' : 'Zone de frappe (espace, clic ou n’importe quelle touche du piano)'}
        </button>
        <div className="card grid place-items-center text-center">
          {last ? (
            <div key={last.key} className="animate-pop space-y-1">
              <span className={`chip px-4 py-2 text-lg ${JUDGE_UI[last.kind].cls}`}>{JUDGE_UI[last.kind].label}</span>
              {last.kind !== 'extra' && last.kind !== 'missed' && (
                <div className="text-sm tabular-nums text-slate-500">
                  {last.ms > 0 ? '+' : ''}
                  {last.ms} ms
                </div>
              )}
            </div>
          ) : (
            <span className="text-slate-400">Feedback</span>
          )}
        </div>
      </div>

      {result && (
        <div className="card animate-pop space-y-4 text-center">
          <div className="text-5xl font-black">{result.score} %</div>
          <Stars n={starsFor(result.score)} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Parfait" value={result.counts.perfect} />
            <Stat label="Trop tôt" value={result.counts.early} />
            <Stat label="Trop tard" value={result.counts.late} />
            <Stat label="Ratés" value={result.counts.missed} />
            <Stat label="En trop" value={result.counts.extra} />
          </div>
          {result.counts.late > result.counts.early * 2 && result.counts.late >= 3 && (
            <Tip tone="warn">Vous êtes souvent « trop tard » : c’est peut-être la latence de votre matériel. Essayez d’augmenter la compensation de latence de 30 à 60 ms.</Tip>
          )}
          <div className="flex justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => void begin(false)}>
              ↻ Recommencer
            </button>
            {tempo < 160 && result.score >= 85 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setTempo((t) => Math.min(160, t + 8));
                }}
              >
                ⏩ Tempo +8
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SimpleMetronome() {
  const [bpmVal, setBpmVal] = useState(80);
  const [beats, setBeats] = useState(4);
  const [on, setOn] = useState(false);
  const [beat, setBeat] = useState(-1);
  const raf = useRef(0);
  useEffect(() => {
    if (!on) return;
    const s = new LookaheadScheduler();
    const spb = 60 / bpmVal;
    const start = audio.now() + 0.15;
    let scheduled = 0;
    const tick = () => {
      raf.current = requestAnimationFrame(tick);
      const t = audio.now();
      while (start + scheduled * spb < t + 0.3) {
        const i = scheduled;
        s.add(start + i * spb, (tt) => audio.click(i % beats === 0, tt));
        scheduled++;
      }
      s.pump(t);
      setBeat(Math.max(0, Math.floor((t - start) / spb)) % beats);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf.current);
      s.clear();
      setBeat(-1);
    };
  }, [on, bpmVal, beats]);
  return (
    <div className="card flex flex-wrap items-center gap-4">
      <div className="font-bold">🥁 Métronome libre</div>
      <label className="flex flex-1 items-center gap-2 text-sm">
        ♩ = <span className="w-8 tabular-nums">{bpmVal}</span>
        <input type="range" min={40} max={200} value={bpmVal} onChange={(e) => setBpmVal(+e.target.value)} className="flex-1" />
      </label>
      <select className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900" value={beats} onChange={(e) => setBeats(+e.target.value)}>
        <option value={2}>2/4</option>
        <option value={3}>3/4</option>
        <option value={4}>4/4</option>
      </select>
      <div className="flex gap-1.5">
        {Array.from({ length: beats }, (_, i) => (
          <span key={i} className={`h-4 w-4 rounded-full transition ${beat === i ? (i === 0 ? 'bg-indigo-500' : 'bg-sky-400') : 'bg-slate-300 dark:bg-slate-700'}`} />
        ))}
      </div>
      <button
        type="button"
        className={on ? 'btn-danger' : 'btn-primary'}
        onClick={async () => {
          await audio.ensureStarted();
          setOn((o) => !o);
        }}
      >
        {on ? '■ Stop' : '▶ Lancer'}
      </button>
    </div>
  );
}

export function RhythmModule() {
  const { data } = useProgress();
  const [ex, setEx] = useState<RhythmExercise | null>(null);
  if (ex) return <RhythmPlayer key={ex.id} ex={ex} onExit={() => setEx(null)} />;
  return (
    <div className="space-y-6">
      <PageHeader icon="🥁" title="Atelier rythme" subtitle="Rondes, blanches, noires, croches et silences, en 4/4 et 3/4. Tapez avec la barre d’espace ou une touche du piano." />
      <Tip>
        Écoutez d’abord l’exemple (👂), puis jouez. Après un décompte d’une mesure, tapez au début de chaque note. Le feedback indique « Trop tôt », « Parfait » ou « Trop tard ».
      </Tip>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {RHYTHM_EXERCISES.map((r, i) => {
          const st = data.rhythm[r.id];
          return (
            <button key={r.id} type="button" onClick={() => setEx(r)} className="card text-left transition hover:-translate-y-0.5 hover:border-indigo-400">
              <div className="flex items-center justify-between">
                <span className="chip bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                  {i + 1} · {r.timeSig[0]}/{r.timeSig[1]}
                </span>
                <Stars n={st ? starsFor(st.best) : 0} />
              </div>
              <h3 className="mt-3 font-bold">{r.title}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{r.description}</p>
              {st && <p className="mt-2 text-xs font-semibold text-emerald-600">Meilleur : {st.best} %</p>}
            </button>
          );
        })}
      </div>
      <SimpleMetronome />
    </div>
  );
}
