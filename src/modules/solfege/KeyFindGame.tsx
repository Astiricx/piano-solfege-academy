// Niveau 0 : jeu « trouve la note sur le clavier » (sans portée).
import { useEffect, useRef, useState } from 'react';
import { audio } from '../../audio/AudioEngine';
import { useKeyHints, useNoteInput } from '../../input/InputContext';
import { useProgress, withActivity } from '../../state/progress';
import { FR_NAMES, LETTERS, midiLabel } from '../../lib/music';
import { Stars, Stat, Tip } from '../../components/ui';

const ROUNDS = 10;
const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function KeyFindGame({ onExit, onNext }: { onExit(): void; onNext(): void }) {
  const { settings, update } = useProgress();
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState<string>('C');
  const [fb, setFb] = useState<{ ok: boolean; text: string; midi: number } | null>(null);
  const [done, setDone] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const pick = (prev: string | null) => {
    let l = LETTERS[Math.floor(Math.random() * 7)] as string;
    while (l === prev) l = LETTERS[Math.floor(Math.random() * 7)] as string;
    return l;
  };
  const start = () => {
    void audio.ensureStarted();
    setRound(1);
    setScore(0);
    setDone(false);
    setFb(null);
    setTarget(pick(null));
  };

  const name = (l: string) => (settings.naming === 'en' ? l : FR_NAMES[l]);

  useNoteInput((e) => {
    if (e.type !== 'on' || round === 0 || done || fb) return;
    const ok = ((e.midi % 12) + 12) % 12 === PC[target];
    const newScore = score + (ok ? 1 : 0);
    setScore(newScore);
    const correctMidi = 60 + PC[target];
    setFb({
      ok,
      midi: correctMidi,
      text: ok ? `Oui ! C’est bien ${name(target)}.` : `Non, c’était ${midiLabel(e.midi, 'fr')}. ${name(target)} est la touche allumée en vert.`,
    });
    timer.current = window.setTimeout(
      () => {
        if (round >= ROUNDS) {
          setDone(true);
          const stars = newScore >= 9 ? 3 : newScore >= 7 ? 2 : newScore >= 5 ? 1 : 0;
          update((p) => {
            const prev = p.solfege.s0 ?? { best: 0, plays: 0, stars: 0 };
            return withActivity({
              ...p,
              solfege: { ...p.solfege, s0: { best: Math.max(prev.best, newScore * 10), plays: prev.plays + 1, stars: Math.max(prev.stars, stars) } },
            });
          });
        } else {
          setRound(round + 1);
          setFb(null);
          setTarget(pick(target));
        }
      },
      ok ? 700 : 1800,
    );
  });

  useKeyHints({ correct: fb ? [fb.midi, fb.midi - 12, fb.midi + 12] : [] });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <button type="button" className="btn-ghost -ml-2" onClick={onExit}>
        ← Niveaux
      </button>
      <div className="card space-y-5 text-center">
        <h2 className="text-2xl font-bold">🎯 Trouve la note sur le clavier</h2>
        {round === 0 ? (
          <>
            <p>Un nom de note s’affiche : appuyez sur une touche qui porte ce nom (n’importe quelle octave), sur le piano du bas, le clavier d’ordinateur ou votre piano.</p>
            <Tip>Repère : Do est à gauche des 2 touches noires, Fa à gauche des 3 touches noires.</Tip>
            <button type="button" className="btn-primary !px-8 !py-3 !text-base" onClick={start}>
              ▶ Commencer ({ROUNDS} notes)
            </button>
          </>
        ) : done ? (
          <div className="animate-pop space-y-4">
            <div className="text-4xl font-black">
              {score}/{ROUNDS}
            </div>
            <Stars n={score >= 9 ? 3 : score >= 7 ? 2 : score >= 5 ? 1 : 0} />
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" className="btn-secondary" onClick={start}>
                ↻ Rejouer
              </button>
              <button type="button" className="btn-primary" onClick={onNext}>
                Passer au Niveau 1 (cours) →
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="note" value={`${round}/${ROUNDS}`} />
              <Stat label="justes" value={score} />
            </div>
            <div className="py-4 text-6xl font-black text-indigo-600 dark:text-indigo-400">{name(target)}</div>
            <div className="h-8 text-lg font-semibold">
              {fb && <span className={`animate-pop inline-block ${fb.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{fb.text}</span>}
            </div>
            <p className="text-sm text-slate-500">Jouez sur le piano en bas de l’écran ⬇</p>
          </>
        )}
      </div>
    </div>
  );
}
