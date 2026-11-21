// Encart « avant de jouer » : dessin, nom et durée de chaque figure rythmique de l'exercice.
import { useEffect, useRef, useState } from 'react';
import type { DurCode, Piece } from '../../types';
import { audio, LookaheadScheduler } from '../../audio/AudioEngine';
import { renderRhythmSymbol } from '../../score/staffDiagram';

interface SymbolInfo {
  name: string;
  beats: string;
  count: string;
  explain: string;
  /** Démonstration : frappes (en temps) sur une durée totale (en temps). */
  demo: { taps: number[]; beats: number };
}

const INFO: Record<string, SymbolInfo> = {
  w: { name: 'Ronde', beats: '4 temps', count: '1 – 2 – 3 – 4', explain: 'Une seule frappe, puis on tient pendant 4 temps.', demo: { taps: [0], beats: 4 } },
  'h.': { name: 'Blanche pointée', beats: '3 temps', count: '1 – 2 – 3', explain: 'Le point ajoute la moitié de la durée : 2 + 1 = 3 temps.', demo: { taps: [0, 3], beats: 6 } },
  h: { name: 'Blanche', beats: '2 temps', count: '1 – 2', explain: 'Une frappe tous les 2 temps (tête vide avec une hampe).', demo: { taps: [0, 2], beats: 4 } },
  'q.': { name: 'Noire pointée', beats: '1 temps ½', count: '1 – (et) – 2', explain: 'Souvent suivie d’une croche pour compléter les 2 temps.', demo: { taps: [0, 1.5], beats: 2 } },
  q: { name: 'Noire', beats: '1 temps', count: '1', explain: 'Une frappe sur chaque clic du métronome (tête pleine avec une hampe).', demo: { taps: [0, 1, 2, 3], beats: 4 } },
  '8': { name: 'Croche', beats: '½ temps', count: '1 – et', explain: 'Deux croches = une noire. Elles sont souvent reliées par une barre.', demo: { taps: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], beats: 4 } },
  wr: { name: 'Pause', beats: '1 mesure', count: '(silence)', explain: 'Silence d’une mesure entière, accroché sous la 4e ligne.', demo: { taps: [], beats: 4 } },
  'h.r': { name: 'Demi-pause pointée', beats: '3 temps de silence', count: '(1 – 2 – 3)', explain: 'Silence de 3 temps.', demo: { taps: [], beats: 3 } },
  hr: { name: 'Demi-pause', beats: '2 temps de silence', count: '(1 – 2)', explain: 'Posée sur la 3e ligne. On compte sans jouer.', demo: { taps: [2, 3], beats: 4 } },
  qr: { name: 'Soupir', beats: '1 temps de silence', count: '(1)', explain: 'On ne frappe pas, mais le métronome continue : comptez-le dans votre tête.', demo: { taps: [1, 2, 3], beats: 4 } },
  '8r': { name: 'Demi-soupir', beats: '½ temps de silence', count: '(1) – et', explain: 'Silence d’une croche : la frappe suivante tombe sur le « et ».', demo: { taps: [0.5, 1.5, 2.5, 3.5], beats: 4 } },
};

function keyOf(dur: DurCode, dots: number, rest: boolean) {
  return `${dur}${dots ? '.' : ''}${rest ? 'r' : ''}`;
}

function SymbolDrawing({ dur, dots, rest }: { dur: DurCode; dots: number; rest: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      renderRhythmSymbol(ref.current, dur, dots, rest);
    } catch (e) {
      console.error(e);
    }
  }, [dur, dots, rest]);
  return <div ref={ref} className="score-paper w-24 shrink-0 rounded-lg bg-white p-1" />;
}

export function RhythmSymbols({ piece, tempo }: { piece: Piece; tempo: number }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const timer = useRef(0);
  const raf = useRef(0);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      cancelAnimationFrame(raf.current);
    },
    [],
  );

  const seen = new Map<string, { dur: DurCode; dots: number; rest: boolean }>();
  piece.notes.forEach((n) => {
    const k = keyOf(n.dur, n.dots, n.isRest);
    if (INFO[k] && !seen.has(k)) seen.set(k, { dur: n.dur, dots: n.dots, rest: n.isRest });
  });
  const order = Object.keys(INFO);
  const items = Array.from(seen.entries()).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));

  const listen = async (k: string) => {
    await audio.ensureStarted();
    cancelAnimationFrame(raf.current);
    const { taps, beats } = INFO[k].demo;
    const spb = 60 / tempo;
    const s = new LookaheadScheduler();
    const t0 = audio.now() + 0.15;
    for (let b = 0; b < Math.ceil(beats); b++) s.add(t0 + b * spb, (t) => audio.click(b === 0, t));
    taps.forEach((x) => s.add(t0 + x * spb, (t) => audio.tap(t)));
    const end = t0 + beats * spb;
    const tick = () => {
      const now = audio.now();
      s.pump(now);
      if (now < end) raf.current = requestAnimationFrame(tick);
    };
    tick();
    setPlaying(k);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPlaying(null), (beats * spb + 0.3) * 1000);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([k, v]) => {
        const info = INFO[k];
        return (
          <div key={k} className={`flex gap-3 rounded-xl border p-3 transition ${playing === k ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' : 'border-slate-200 dark:border-slate-700'}`}>
            <SymbolDrawing dur={v.dur} dots={v.dots} rest={v.rest} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-lg font-bold">{info.name}</span>
                <span className="chip bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">{info.beats}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{info.explain}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-500">On compte : <strong>{info.count}</strong></span>
                <button type="button" className="btn-secondary !px-2 !py-1 !text-xs" onClick={() => void listen(k)}>
                  🔊 Écouter un exemple
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
