import { useEffect, useRef } from 'react';
import type { Clef } from '../types';
import { parsePitch } from '../lib/music';
import { renderSingleNote } from './renderScore';

interface Props {
  pitch: string | null;
  clef: Clef;
  display: 'treble' | 'bass' | 'grand';
  status?: 'neutral' | 'correct' | 'wrong';
}

const COLORS = { neutral: '#111827', correct: '#16a34a', wrong: '#dc2626' };

export function SingleNoteStaff({ pitch, clef, display, status = 'neutral' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const p = pitch ? parsePitch(pitch) : null;
    try {
      renderSingleNote(
        ref.current,
        p ? { key: `${p.letter.toLowerCase()}${p.acc}/${p.octave}`, acc: p.acc || null, clef } : null,
        display,
        COLORS[status],
      );
    } catch (e) {
      console.error(e);
    }
  }, [pitch, clef, display, status]);
  return <div ref={ref} className="score-paper mx-auto w-full max-w-md rounded-xl bg-white p-2 shadow-inner" />;
}
