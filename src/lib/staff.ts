// Position des notes sur la portée (lignes, interlignes, lignes supplémentaires)
// et explications en français simple.
import type { Clef, Naming } from '../types';
import { midiToName, parsePitch, pitchLabel, type ParsedPitch } from './music';

const LETTER_IDX: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const IDX_LETTER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/** Indice diatonique (nombre de « crans » depuis Do0). */
export function diatonic(p: ParsedPitch): number {
  return p.octave * 7 + LETTER_IDX[p.letter];
}

/** Indice diatonique de la 1re ligne (en bas) : Mi4 en clé de Sol, Sol2 en clé de Fa. */
const BOTTOM_LINE: Record<Clef, number> = { treble: 4 * 7 + 2, bass: 2 * 7 + 4 };

/** Position sur la portée : 0 = 1re ligne, 1 = 1er interligne, 2 = 2e ligne… (négatif = dessous). */
export function staffPos(pitch: string, clef: Clef): number {
  const p = parsePitch(pitch);
  if (!p) return 0;
  return diatonic(p) - BOTTOM_LINE[clef];
}

/** Note naturelle correspondant à une position de la portée. */
export function pitchFromPos(pos: number, clef: Clef): string {
  const d = BOTTOM_LINE[clef] + pos;
  const octave = Math.floor(d / 7);
  return `${IDX_LETTER[((d % 7) + 7) % 7]}${octave}`;
}

const ordF = (n: number) => (n === 1 ? '1re' : `${n}e`);
const ordM = (n: number) => (n === 1 ? '1er' : `${n}e`);

/** Description courte de la position : « sur la 2e ligne », « dans le 3e interligne »… */
export function positionPhrase(pos: number): string {
  if (pos >= 0 && pos <= 8) return pos % 2 === 0 ? `sur la ${ordF(pos / 2 + 1)} ligne` : `dans le ${ordM((pos + 1) / 2)} interligne`;
  if (pos === -1) return 'juste sous la 1re ligne';
  if (pos === 9) return 'juste au-dessus de la 5e ligne';
  if (pos < -1) {
    return pos % 2 === 0
      ? `traversée par la ${ordF(-pos / 2)} ligne supplémentaire sous la portée`
      : `juste sous la ${ordF((-pos - 1) / 2)} ligne supplémentaire du bas`;
  }
  return pos % 2 === 0
    ? `traversée par la ${ordF((pos - 8) / 2)} ligne supplémentaire au-dessus de la portée`
    : `juste au-dessus de la ${ordF((pos - 9) / 2)} ligne supplémentaire du haut`;
}

/** Étiquette très courte pour les flèches : « 1re ligne », « 2e interligne », « ligne sup. »… */
export function positionTag(pos: number): string {
  if (pos >= 0 && pos <= 8) return pos % 2 === 0 ? `${ordF(pos / 2 + 1)} ligne` : `${ordM((pos + 1) / 2)} interligne`;
  if (pos === -1) return 'sous la portée';
  if (pos === 9) return 'au-dessus';
  if (pos < -1) return pos % 2 === 0 ? `${ordF(-pos / 2)} ligne sup. (bas)` : 'sous les lignes sup.';
  return pos % 2 === 0 ? `${ordF((pos - 8) / 2)} ligne sup. (haut)` : 'au-dessus des lignes sup.';
}

const REMARKS: Record<string, string> = {
  'C4|treble': 'c’est le Do central',
  'C4|bass': 'c’est le Do central',
  'G4|treble': 'là où s’enroule la clé de Sol',
  'B4|treble': 'la ligne du milieu',
  'F3|bass': 'entre les deux points de la clé de Fa',
  'D3|bass': 'la ligne du milieu',
};

export const CLEF_NAME: Record<Clef, string> = { treble: 'clé de Sol', bass: 'clé de Fa' };

/** Explication complète, ex. « sur la 2e ligne de la clé de Sol (là où s’enroule la clé de Sol) ». */
export function positionText(pitch: string, clef: Clef, withClef = true): string {
  const p = parsePitch(pitch);
  if (!p) return '';
  const pos = diatonic(p) - BOTTOM_LINE[clef];
  let s = positionPhrase(pos);
  if (withClef) s += ` (${CLEF_NAME[clef]})`;
  const natural = `${p.letter}${p.octave}`;
  const remark = REMARKS[`${natural}|${clef}`];
  if (remark) s += ` — ${remark}`;
  if (p.acc === '#') s += ', avec un dièse ♯ devant';
  if (p.acc === 'b') s += ', avec un bémol ♭ devant';
  return s;
}

/** Clé « naturelle » d'une note pour un affichage en grande portée. */
export function clefFor(midi: number): Clef {
  return midi >= 60 ? 'treble' : 'bass';
}

export function noteName(pitch: string, naming: Naming, withOctave = true): string {
  const p = parsePitch(pitch);
  return p ? pitchLabel(p, naming === 'both' ? 'fr' : naming, withOctave) : pitch;
}

export function midiPitch(midi: number, preferFlat = false): string {
  return midiToName(midi, preferFlat);
}
