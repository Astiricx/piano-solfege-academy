// Lecteur intelligent : partition défilante, modes Attente / Rythme / Écoute,
// sélecteur de mains, tempo 40–120 %, boucle A-B, aides visuelles.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HandSelection, NoteStatus, Piece } from '../../types';
import { PracticeSession, type PracticeMode, type SessionResult, type SessionStats } from '../../practice/engine';
import { ScoreView } from '../../score/ScoreView';
import { useKeyHints, useNoteInput, useInput } from '../../input/InputContext';
import { useProgress, withActivity } from '../../state/progress';
import { Segmented, Stars, Toggle, ProgressBar, Tip } from '../../components/ui';
import { audio } from '../../audio/AudioEngine';

interface Props {
  piece: Piece;
  onResult?(r: SessionResult): void;
}

const EMPTY_STATS: SessionStats = { total: 0, correct: 0, ok: 0, wrong: 0, missed: 0, loops: 0 };

export function starsFor(score: number): number {
  if (score >= 95) return 3;
  if (score >= 85) return 2;
  if (score >= 70) return 1;
  return 0;
}

export function PracticePlayer({ piece, onResult }: Props) {
  const { settings, setSettings, update, data } = useProgress();
  const { source } = useInput();
  const defaultHands: HandSelection = piece.hasRight && piece.hasLeft ? 'both' : piece.hasRight ? 'R' : 'L';
  const [mode, setMode] = useState<PracticeMode>('wait');
  const [hands, setHands] = useState<HandSelection>(defaultHands);
  const [tempoPct, setTempoPct] = useState(80);
  const [metronome, setMetronome] = useState(true);
  const [autoOther, setAutoOther] = useState(true);
  const [showHints, setShowHints] = useState(true);
  const [loopOn, setLoopOn] = useState(false);
  const [loopA, setLoopA] = useState(0);
  const [loopB, setLoopB] = useState(Math.min(1, piece.measureCount - 1));
  const [pickStage, setPickStage] = useState<0 | 1>(0);

  const [running, setRunning] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, NoteStatus>>({});
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [hintMidis, setHintMidis] = useState<number[]>([]);
  const [wrongMidi, setWrongMidi] = useState<number[]>([]);
  const [countIn, setCountIn] = useState<number | null>(null);
  const [stats, setStats] = useState<SessionStats>(EMPTY_STATS);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const session = useRef<PracticeSession | null>(null);
  const wrongTimer = useRef<number>(0);

  // Réinitialiser quand le morceau change
  useEffect(() => {
    setHands(defaultHands);
    setLoopOn(false);
    setLoopA(0);
    setLoopB(Math.min(1, piece.measureCount - 1));
    setResult(null);
    setStatuses({});
    setCurrentId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piece.id]);

  const stop = useCallback(() => {
    session.current?.stop();
    session.current = null;
    setRunning(false);
    setCountIn(null);
    setHintMidis([]);
  }, []);

  useEffect(() => () => session.current?.stop(), []);

  // Toute modification de réglage interrompt la session en cours
  useEffect(() => {
    if (session.current) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hands, tempoPct, loopOn, loopA, loopB, metronome, autoOther, piece.id]);

  const loop = loopOn ? { a: Math.min(loopA, loopB), b: Math.max(loopA, loopB) } : null;

  const start = async () => {
    await audio.ensureStarted();
    (document.activeElement as HTMLElement | null)?.blur?.();
    session.current?.stop();
    setResult(null);
    setStats(EMPTY_STATS);
    setProgress(0);
    const s = new PracticeSession(
      {
        piece,
        mode,
        hands,
        tempoPct,
        loop,
        autoOther,
        metronome,
        ignoreOctave: settings.practiceIgnoreOctave,
      },
      {
        onStatuses: setStatuses,
        onCurrent: setCurrentId,
        onHints: setHintMidis,
        onCountIn: setCountIn,
        onStats: setStats,
        onProgress: setProgress,
        onWrongKey: (m) => {
          setWrongMidi([m]);
          window.clearTimeout(wrongTimer.current);
          wrongTimer.current = window.setTimeout(() => setWrongMidi([]), 350);
        },
        onDone: (r) => {
          session.current = null;
          setRunning(false);
          setHintMidis([]);
          setResult(r);
          if (r.score >= 0) {
            update((p) => {
              const prev = p.pieces[piece.id];
              const best = Math.max(prev?.best ?? 0, r.score);
              const bestTempo = r.mode === 'tempo' ? Math.max(prev?.bestTempo ?? 0, r.score) : prev?.bestTempo;
              return withActivity({
                ...p,
                pieces: {
                  ...p.pieces,
                  [piece.id]: { best, bestTempo, plays: (prev?.plays ?? 0) + 1, lastPlayed: new Date().toISOString() },
                },
              });
            });
          }
          onResult?.(r);
        },
      },
    );
    session.current = s;
    setRunning(true);
    s.start();
  };

  useNoteInput((e) => {
    if (e.type === 'on') session.current?.handleNoteOn(e.midi, e.time);
  });

  useKeyHints({ expected: showHints && running ? hintMidis : [], wrong: wrongMidi });

  const onMeasureClick = (m: number) => {
    if (!loopOn) {
      setLoopOn(true);
      setLoopA(m);
      setLoopB(m);
      setPickStage(1);
      return;
    }
    if (pickStage === 0) {
      setLoopA(m);
      setLoopB(m);
      setPickStage(1);
    } else {
      setLoopB(m);
      setPickStage(0);
    }
  };

  const best = data.pieces[piece.id]?.best;
  const bpm = Math.round(piece.tempo * (tempoPct / 100));
  const measures = useMemo(() => Array.from({ length: piece.measureCount }, (_, i) => i), [piece.measureCount]);

  return (
    <div className="space-y-4">
      <div className="card space-y-4 !p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<PracticeMode>
            value={mode}
            onChange={setMode}
            options={[
              { value: 'wait', label: '⏸ Attente', title: 'Le curseur attend la bonne note' },
              { value: 'tempo', label: '⏱ Rythme', title: 'Défilement en tempo réel avec décompte' },
              { value: 'demo', label: '👂 Écouter', title: 'L’application joue le morceau' },
            ]}
          />
          <Segmented<HandSelection>
            value={hands}
            onChange={setHands}
            options={[
              { value: 'R', label: 'Main droite', disabled: !piece.hasRight },
              { value: 'L', label: 'Main gauche', disabled: !piece.hasLeft },
              { value: 'both', label: 'Deux mains', disabled: !(piece.hasRight && piece.hasLeft) },
            ]}
          />
          <label className="flex min-w-[220px] flex-1 items-center gap-3 text-sm">
            <span className="whitespace-nowrap font-medium">Tempo {tempoPct} %</span>
            <input type="range" min={40} max={120} step={5} value={tempoPct} onChange={(e) => setTempoPct(+e.target.value)} className="flex-1" />
            <span className="w-16 text-right tabular-nums text-slate-500">♩= {bpm}</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Toggle checked={settings.showNames} onChange={(v) => setSettings({ showNames: v })} label="Noms des notes" />
          <Toggle checked={settings.showFingers} onChange={(v) => setSettings({ showFingers: v })} label="Doigtés" />
          <Toggle checked={showHints} onChange={setShowHints} label="Indices sur le clavier" />
          {piece.hasLeft && piece.hasRight && (
            <Toggle checked={autoOther} onChange={setAutoOther} label="Jouer l’autre main" />
          )}
          {mode === 'tempo' && <Toggle checked={metronome} onChange={setMetronome} label="Métronome" />}
          <Toggle
            checked={settings.practiceIgnoreOctave}
            onChange={(v) => setSettings({ practiceIgnoreOctave: v })}
            label="Ignorer l’octave"
          />
          <div className="flex items-center gap-1 text-sm">
            <span className="text-slate-500">Zoom</span>
            <button type="button" className="btn-secondary !px-2 !py-0.5" onClick={() => setSettings({ zoom: Math.max(0.7, +(settings.zoom - 0.1).toFixed(1)) })}>
              −
            </button>
            <span className="w-10 text-center tabular-nums">{Math.round(settings.zoom * 100)}%</span>
            <button type="button" className="btn-secondary !px-2 !py-0.5" onClick={() => setSettings({ zoom: Math.min(1.8, +(settings.zoom + 0.1).toFixed(1)) })}>
              +
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800/60">
          <Toggle checked={loopOn} onChange={(v) => { setLoopOn(v); setPickStage(0); }} label={<strong>Boucle A-B</strong>} />
          <label className="flex items-center gap-1">
            A : mesure
            <select className="rounded-md border border-slate-300 bg-white px-1 py-0.5 dark:border-slate-600 dark:bg-slate-900" value={loopA} onChange={(e) => { setLoopA(+e.target.value); setLoopOn(true); }}>
              {measures.map((m) => (
                <option key={m} value={m}>
                  {m + 1}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            B : mesure
            <select className="rounded-md border border-slate-300 bg-white px-1 py-0.5 dark:border-slate-600 dark:bg-slate-900" value={loopB} onChange={(e) => { setLoopB(+e.target.value); setLoopOn(true); }}>
              {measures.map((m) => (
                <option key={m} value={m}>
                  {m + 1}
                </option>
              ))}
            </select>
          </label>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {pickStage === 1 ? 'Cliquez maintenant sur la mesure de fin (B).' : 'Astuce : cliquez sur une mesure de la partition pour placer A, puis B.'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!running ? (
            <button type="button" className="btn-primary !px-6 !py-3 !text-base" onClick={() => void start()}>
              ▶ {mode === 'wait' ? 'Commencer (mode Attente)' : mode === 'tempo' ? 'Commencer (décompte)' : 'Écouter le morceau'}
            </button>
          ) : (
            <>
              <button type="button" className="btn-danger !px-6 !py-3 !text-base" onClick={stop}>
                ■ Arrêter
              </button>
              {mode !== 'demo' && (
                <button type="button" className="btn-secondary !py-3" onClick={() => session.current?.finish()}>
                  ✓ Terminer et noter
                </button>
              )}
            </>
          )}
          {mode !== 'demo' && (
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="chip bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">✓ {stats.correct}</span>
              {stats.ok > 0 && (
                <span className="chip bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200" title={mode === 'tempo' ? 'Bonne note, rythme approximatif' : 'Juste après une erreur'}>
                  ≈ {stats.ok}
                </span>
              )}
              <span className="chip bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200">✗ {stats.wrong}</span>
              {mode === 'tempo' && <span className="chip bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">⌀ {stats.missed} ratées</span>}
              {loopOn && <span className="chip bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">↻ {stats.loops}</span>}
            </div>
          )}
          {best !== undefined && <span className="ml-auto text-sm text-slate-500">Meilleur score : {best} %</span>}
        </div>
        {running && <ProgressBar value={progress * 100} />}
        {source === 'mic' && autoOther && hands !== 'both' && (
          <Tip tone="warn">Mode micro : l’accompagnement automatique peut être capté par le micro. Désactivez « Jouer l’autre main » ou utilisez un casque.</Tip>
        )}
      </div>

      <div className="relative">
        <ScoreView
          piece={piece}
          statuses={statuses}
          currentId={currentId}
          showNames={settings.showNames}
          showFingers={settings.showFingers}
          naming={settings.naming}
          zoom={settings.zoom}
          loop={loop}
          onMeasureClick={running ? undefined : onMeasureClick}
          maxHeight="58vh"
        />
        {countIn !== null && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div key={countIn} className="animate-pop grid h-28 w-28 place-items-center rounded-full bg-indigo-600/90 text-6xl font-black text-white shadow-2xl">
              {countIn}
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="card animate-pop flex flex-wrap items-center gap-6 border-indigo-300 dark:border-indigo-700">
          {result.score >= 0 ? (
            <>
              <div className="text-center">
                <div className="text-5xl font-black tabular-nums">{result.score}%</div>
                <Stars n={starsFor(result.score)} />
              </div>
              <div className="flex-1 space-y-1 text-sm">
                <div className="text-lg font-semibold">
                  {result.score >= 95 ? 'Magnifique ! 🎉' : result.score >= 80 ? 'Très bien ! 👏' : result.score >= 60 ? 'Bon travail, continuez !' : 'Courage : ralentissez le tempo et isolez les passages difficiles.'}
                </div>
                <div className="text-slate-500">
                  {result.stats.correct} justes du premier coup · {result.stats.ok} {result.mode === 'tempo' ? 'avec rythme approximatif' : 'après hésitation'} · {result.stats.wrong} fausses notes
                  {result.mode === 'tempo' ? ` · ${result.stats.missed} ratées` : ''} · {Math.round(result.seconds)} s
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1">Écoute terminée. À vous de jouer !</div>
          )}
          <button type="button" className="btn-primary" onClick={() => void start()}>
            ↻ Rejouer
          </button>
          <button type="button" className="btn-ghost" onClick={() => setResult(null)}>
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
