// Parseur de la notation compacte utilisée dans les fichiers de données.
//
// Grammaire (une chaîne par main) :
//   mesures séparées par "|", jetons séparés par des espaces.
//   jeton  = HAUTEURS ":" DURÉE [ ":" DOIGTÉS ]
//   HAUTEURS = "r" (silence) | P ("+" P)*        ex. C4, F#4, Bb3, C3+E3+G3
//   DURÉE  = w | h | q | 8 | 16, suivi éventuellement de "." (pointée)
//   DOIGTÉS = n ("+" n)* ou "-"                    ex. 1, 1+3+5
//
// Exemple : "E4:q:3 E4:q:3 F4:q:4 G4:q:5 | G4:h:5 G4:h:5"
import type { DurCode, Hand, Piece, PieceSource, ScoreNote } from '../types';
import { KEY_SIGNATURES, parsePitch } from './music';

const DUR_BEATS: Record<DurCode, number> = { w: 4, h: 2, q: 1, '8': 0.5, '16': 0.25 };

export class NotationError extends Error {}

interface ParsedToken {
  pitches: string[];
  dur: DurCode;
  dots: number;
  beats: number;
  fingers: (number | null)[];
  isRest: boolean;
}

function parseToken(tok: string, ctx: string): ParsedToken {
  const parts = tok.split(':');
  if (parts.length < 2) throw new NotationError(`Jeton invalide "${tok}" (${ctx})`);
  const [pitchPart, durPartRaw, fingerPart] = parts;
  let durPart = durPartRaw;
  let dots = 0;
  while (durPart.endsWith('.')) {
    dots++;
    durPart = durPart.slice(0, -1);
  }
  if (!(durPart in DUR_BEATS)) throw new NotationError(`Durée inconnue "${durPartRaw}" (${ctx})`);
  const dur = durPart as DurCode;
  let beats = DUR_BEATS[dur];
  let add = beats / 2;
  for (let i = 0; i < dots; i++) {
    beats += add;
    add /= 2;
  }
  const isRest = pitchPart === 'r';
  const pitches = isRest ? [] : pitchPart.split('+');
  for (const p of pitches) {
    if (!parsePitch(p)) throw new NotationError(`Hauteur inconnue "${p}" (${ctx})`);
  }
  let fingers: (number | null)[] = pitches.map(() => null);
  if (fingerPart && fingerPart !== '-' && !isRest) {
    const f = fingerPart.split('+').map((x) => (x === '-' ? null : parseInt(x, 10)));
    fingers = pitches.map((_, i) => (f[i] !== undefined && !Number.isNaN(f[i]) ? f[i] : null));
  }
  return { pitches, dur, dots, beats, fingers, isRest };
}

function parseHand(src: string, hand: Hand, piece: PieceSource, bpm: number): { notes: ScoreNote[]; measures: number } {
  const keyMap = KEY_SIGNATURES[piece.keySig ?? 'C'] ?? {};
  const measures = src
    .split('|')
    .map((m) => m.trim())
    .filter((m, i, arr) => m.length > 0 || i < arr.length - 1);
  const notes: ScoreNote[] = [];
  let counter = 0;
  measures.forEach((measureStr, mi) => {
    const tokens = measureStr.split(/\s+/).filter(Boolean);
    let offset = 0;
    // État des altérations dans la mesure : clé "lettre+octave" -> altération courante.
    const accState: Record<string, string> = {};
    for (const tok of tokens) {
      const ctx = `${piece.id}, main ${hand === 'R' ? 'droite' : 'gauche'}, mesure ${mi + 1}`;
      const t = parseToken(tok, ctx);
      const parsed = t.pitches
        .map((p, i) => ({ p: parsePitch(p)!, name: p, finger: t.fingers[i] }))
        .sort((a, b) => a.p.midi - b.p.midi);
      const displayAcc = parsed.map(({ p }) => {
        const k = `${p.letter}${p.octave}`;
        const current = k in accState ? accState[k] : keyMap[p.letter] ?? '';
        if (current === p.acc) return null;
        accState[k] = p.acc;
        return p.acc === '' ? 'n' : p.acc;
      });
      notes.push({
        id: `${hand}${counter++}`,
        hand,
        midis: parsed.map(({ p }) => p.midi),
        pitches: parsed.map(({ name }) => name),
        keys: parsed.map(({ p }) => `${p.letter.toLowerCase()}${p.acc}/${p.octave}`),
        displayAcc,
        dur: t.dur,
        dots: t.dots,
        beats: t.beats,
        start: mi * bpm + offset,
        measure: mi,
        fingers: parsed.map(({ finger }) => finger),
        isRest: t.isRest,
      });
      offset += t.beats;
    }
    if (Math.abs(offset - bpm) > 1e-6) {
      throw new NotationError(
        `${piece.id} : la mesure ${mi + 1} (main ${hand === 'R' ? 'droite' : 'gauche'}) contient ${offset} temps au lieu de ${bpm}`,
      );
    }
  });
  return { notes, measures: measures.length };
}

export function parsePiece(src: PieceSource): Piece {
  const timeSig: [number, number] = src.timeSig ?? [4, 4];
  const bpm = timeSig[0] * (4 / timeSig[1]);
  const r = src.right ? parseHand(src.right, 'R', src, bpm) : { notes: [], measures: 0 };
  const l = src.left ? parseHand(src.left, 'L', src, bpm) : { notes: [], measures: 0 };
  if (src.right && src.left && r.measures !== l.measures) {
    throw new NotationError(`${src.id} : ${r.measures} mesures à droite mais ${l.measures} à gauche`);
  }
  const measureCount = Math.max(r.measures, l.measures);
  const notes = [...r.notes, ...l.notes].sort((a, b) => a.start - b.start || (a.hand === 'R' ? -1 : 1));
  return {
    id: src.id,
    title: src.title,
    composer: src.composer,
    description: src.description,
    level: src.level,
    timeSig,
    tempo: src.tempo,
    keySig: src.keySig ?? 'C',
    beatsPerMeasure: bpm,
    measureCount,
    totalBeats: measureCount * bpm,
    notes,
    hasRight: r.notes.length > 0,
    hasLeft: l.notes.length > 0,
    percussion: !!src.percussion,
  };
}

/** Convertit un motif rythmique ("q q h | w | qr q") en notation de main droite sur Si4. */
export function rhythmToNotation(pattern: string): string {
  return pattern
    .split('|')
    .map((m) =>
      m
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => {
          const rest = /r/.test(t);
          const d = t.replace('r', '');
          return rest ? `r:${d}` : `B4:${d}`;
        })
        .join(' '),
    )
    .join(' | ');
}
