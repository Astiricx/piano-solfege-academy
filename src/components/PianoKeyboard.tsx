// Clavier de piano virtuel interactif (souris / tactile / clavier PC).
import { useRef, type PointerEvent as RPointerEvent } from 'react';
import type { Naming } from '../types';
import { isBlackKey, midiLabel, midiToPitch, pitchLabel } from '../lib/music';
import type { KeyHints } from '../input/InputContext';

interface Props {
  start: number;
  end: number;
  active: number[];
  hints: KeyHints;
  labels?: Record<number, string>;
  showNames?: boolean;
  naming?: Naming;
  onPress(midi: number): void;
  onRelease(midi: number): void;
  height?: number;
}

export function PianoKeyboard({ start, end, active, hints, labels = {}, showNames = false, naming = 'fr', onPress, onRelease, height = 150 }: Props) {
  const down = useRef(new Set<number>());
  const whites: number[] = [];
  for (let m = start; m <= end; m++) if (!isBlackKey(m)) whites.push(m);
  const ww = 100 / whites.length;
  const expected = new Set(hints.expected ?? []);
  const correct = new Set(hints.correct ?? []);
  const wrong = new Set(hints.wrong ?? []);
  const act = new Set(active);

  const press = (m: number) => {
    if (down.current.has(m)) return;
    down.current.add(m);
    onPress(m);
  };
  const release = (m: number) => {
    if (!down.current.has(m)) return;
    down.current.delete(m);
    onRelease(m);
  };

  const keyHandlers = (m: number) => ({
    onPointerDown: (e: RPointerEvent) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      press(m);
    },
    onPointerUp: () => release(m),
    onPointerLeave: () => release(m),
    onPointerCancel: () => release(m),
    onPointerEnter: (e: RPointerEvent) => {
      if (e.buttons === 1) press(m);
    },
  });

  const whiteClass = (m: number) => {
    if (wrong.has(m)) return 'bg-rose-400';
    if (correct.has(m)) return 'bg-emerald-400';
    if (act.has(m)) return 'bg-sky-300';
    if (expected.has(m)) return 'bg-amber-200';
    return 'bg-white hover:bg-slate-50';
  };
  const blackClass = (m: number) => {
    if (wrong.has(m)) return 'bg-rose-600';
    if (correct.has(m)) return 'bg-emerald-600';
    if (act.has(m)) return 'bg-sky-600';
    if (expected.has(m)) return 'bg-amber-500';
    return 'bg-slate-900 hover:bg-slate-700';
  };

  return (
    <div className="relative w-full touch-none select-none" style={{ height }} role="group" aria-label="Clavier de piano virtuel">
      {whites.map((m, i) => (
        <div
          key={m}
          {...keyHandlers(m)}
          className={`absolute top-0 flex h-full flex-col items-center justify-end rounded-b-md border border-slate-400 pb-1.5 text-[10px] text-slate-500 transition-colors ${whiteClass(m)}`}
          style={{ left: `${i * ww}%`, width: `${ww}%` }}
          aria-label={midiLabel(m, naming, true)}
        >
          {m % 12 === 0 ? (
            <span className="font-bold leading-tight text-indigo-600">{midiLabel(m, naming === 'both' ? 'fr' : naming, true)}</span>
          ) : (
            showNames && <span className="font-semibold leading-tight text-slate-600">{midiLabel(m, naming === 'both' ? 'fr' : naming)}</span>
          )}
          {labels[m] && <span className="mt-0.5 rounded bg-slate-200/80 px-1 font-mono text-[10px] text-slate-500">{labels[m]}</span>}
        </div>
      ))}
      {Array.from({ length: end - start + 1 }, (_, k) => start + k)
        .filter((m) => isBlackKey(m))
        .map((m) => {
          const leftWhite = whites.indexOf(m - 1);
          const bw = ww * 0.62;
          return (
            <div
              key={m}
              {...keyHandlers(m)}
              className={`absolute top-0 z-10 flex flex-col items-center justify-end rounded-b-md pb-1 text-[9px] text-slate-300 shadow-md transition-colors ${blackClass(m)}`}
              style={{ left: `${(leftWhite + 1) * ww - bw / 2}%`, width: `${bw}%`, height: '62%' }}
              aria-label={midiLabel(m, naming, true)}
            >
              {showNames && (
                <span className="mb-0.5 flex flex-col items-center text-[8.5px] font-semibold leading-[1.05] text-slate-200">
                  <span>{pitchLabel(midiToPitch(m, false), naming === 'en' ? 'en' : 'fr')}</span>
                  <span>{pitchLabel(midiToPitch(m, true), naming === 'en' ? 'en' : 'fr')}</span>
                </span>
              )}
              {labels[m] && <span className="font-mono">{labels[m]}</span>}
            </div>
          );
        })}
    </div>
  );
}
