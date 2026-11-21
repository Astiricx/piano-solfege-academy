// Exercices de rythme (module 2). Motifs : w h q 8 (+ "." pointé, + "r" silence).
import type { PieceSource } from '../types';
import { rhythmToNotation } from '../lib/notation';

export interface RhythmExercise {
  id: string;
  title: string;
  description: string;
  timeSig: [number, number];
  tempo: number;
  pattern: string;
}

export const RHYTHM_EXERCISES: RhythmExercise[] = [
  {
    id: 'r1',
    title: 'Les noires',
    description: 'Une noire = 1 temps. Tapez sur chaque clic du métronome.',
    timeSig: [4, 4],
    tempo: 70,
    pattern: 'q q q q | q q q q | q q q q | q q q q',
  },
  {
    id: 'r2',
    title: 'Blanches et noires',
    description: 'La blanche dure 2 temps : tapez une fois, puis comptez « 2 » sans taper.',
    timeSig: [4, 4],
    tempo: 72,
    pattern: 'h h | q q h | h q q | q q h',
  },
  {
    id: 'r3',
    title: 'La ronde',
    description: 'La ronde dure 4 temps : une seule frappe pour toute la mesure.',
    timeSig: [4, 4],
    tempo: 76,
    pattern: 'w | h h | q q q q | w | h q q | w',
  },
  {
    id: 'r4',
    title: 'Le soupir',
    description: 'Le soupir est un silence d’un temps : ne tapez pas, mais continuez à compter.',
    timeSig: [4, 4],
    tempo: 72,
    pattern: 'q q q qr | q qr q qr | h q qr | q q h | qr q qr q | w',
  },
  {
    id: 'r5',
    title: 'Les croches',
    description: 'Deux croches = une noire. Dites « 1-et, 2-et… » à voix haute.',
    timeSig: [4, 4],
    tempo: 66,
    pattern: '8 8 q 8 8 q | q 8 8 h | 8 8 8 8 q q | w',
  },
  {
    id: 'r6',
    title: 'La mesure à 3/4',
    description: 'Trois temps par mesure, comme une valse. La blanche pointée dure 3 temps.',
    timeSig: [3, 4],
    tempo: 84,
    pattern: 'q q q | h q | h. | q q q | q h | h.',
  },
  {
    id: 'r7',
    title: 'Valse avec soupirs',
    description: 'Le « boum-tchak-tchak » de la valse, avec des silences.',
    timeSig: [3, 4],
    tempo: 88,
    pattern: 'q qr qr | q q qr | h q | 8 8 q q | h.',
  },
  {
    id: 'r8',
    title: 'Mélange et demi-soupirs',
    description: 'Le demi-soupir est un silence d’une demi-temps. Défi final du module !',
    timeSig: [4, 4],
    tempo: 66,
    pattern: 'q 8r 8 q q | 8 8 8r 8 h | q. 8 q q | h. qr | 8r 8 8r 8 q q | w',
  },
];

export function rhythmToPiece(ex: RhythmExercise): PieceSource {
  return {
    id: `rhythm-${ex.id}`,
    title: ex.title,
    level: 1,
    tempo: ex.tempo,
    timeSig: ex.timeSig,
    right: rhythmToNotation(ex.pattern),
    percussion: true,
  };
}
