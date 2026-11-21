// Utilitaires de théorie musicale "purs" (sans dépendance), utilisés par le parseur
// de partitions et l'affichage des noms de notes.
import type { Naming } from '../types';

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const LETTER_SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ACC_OFFSET: Record<string, number> = { '': 0, '#': 1, b: -1, '##': 2, bb: -2 };

export const FR_NAMES: Record<string, string> = {
  C: 'Do',
  D: 'Ré',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
};

export interface ParsedPitch {
  letter: string;
  acc: string;
  octave: number;
  midi: number;
}

/** "F#4" -> { letter: 'F', acc: '#', octave: 4, midi: 66 } */
export function parsePitch(name: string): ParsedPitch | null {
  const m = /^([A-Ga-g])(##|bb|#|b)?(-?\d)$/.exec(name.trim());
  if (!m) return null;
  const letter = m[1].toUpperCase();
  const acc = m[2] ?? '';
  const octave = parseInt(m[3], 10);
  const midi = 12 * (octave + 1) + LETTER_SEMI[letter] + ACC_OFFSET[acc];
  return { letter, acc, octave, midi };
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function midiToPitch(midi: number, preferFlat = false): ParsedPitch {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const name = (preferFlat ? FLAT_NAMES : SHARP_NAMES)[pc];
  return { letter: name[0], acc: name.slice(1), octave, midi };
}

export function midiToName(midi: number, preferFlat = false): string {
  const p = midiToPitch(midi, preferFlat);
  return `${p.letter}${p.acc}${p.octave}`;
}

const ACC_SYMBOL: Record<string, string> = { '': '', '#': '♯', b: '♭', '##': '𝄪', bb: '𝄫', n: '♮' };

export function pitchLabel(p: { letter: string; acc: string; octave?: number }, naming: Naming, withOctave = false): string {
  const acc = ACC_SYMBOL[p.acc] ?? p.acc;
  const oct = withOctave && p.octave !== undefined ? String(p.octave) : '';
  const fr = `${FR_NAMES[p.letter]}${acc}${oct}`;
  const en = `${p.letter}${acc}${oct}`;
  if (naming === 'fr') return fr;
  if (naming === 'en') return en;
  return `${fr} (${en})`;
}

export function midiLabel(midi: number, naming: Naming, withOctave = false, preferFlat = false): string {
  return pitchLabel(midiToPitch(midi, preferFlat), naming, withOctave);
}

export function pitchNameLabel(name: string, naming: Naming, withOctave = false): string {
  const p = parsePitch(name);
  return p ? pitchLabel(p, naming, withOctave) : name;
}

export function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function freqToMidiFloat(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}

/** Altérations de l'armure, par lettre. */
export const KEY_SIGNATURES: Record<string, Record<string, string>> = {
  C: {},
  G: { F: '#' },
  D: { F: '#', C: '#' },
  A: { F: '#', C: '#', G: '#' },
  F: { B: 'b' },
  Bb: { B: 'b', E: 'b' },
  Eb: { B: 'b', E: 'b', A: 'b' },
};

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
