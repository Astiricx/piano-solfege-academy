// Types partagés de l'application.

export type Hand = 'R' | 'L';
export type HandSelection = 'R' | 'L' | 'both';
export type DurCode = 'w' | 'h' | 'q' | '8' | '16';
export type Naming = 'fr' | 'en' | 'both';
export type Clef = 'treble' | 'bass';

/** Une note (ou un accord, ou un silence) d'une partition. */
export interface ScoreNote {
  id: string;
  hand: Hand;
  /** Hauteurs MIDI (vide = silence). Triées du grave à l'aigu. */
  midis: number[];
  /** Noms des hauteurs, ex. "F#4". */
  pitches: string[];
  /** Clés VexFlow, ex. "f#/4". */
  keys: string[];
  /** Altération à afficher pour chaque clé ('#', 'b', 'n' ou null). */
  displayAcc: (string | null)[];
  dur: DurCode;
  dots: number;
  /** Durée en noires. */
  beats: number;
  /** Début en noires depuis le début du morceau. */
  start: number;
  measure: number;
  fingers: (number | null)[];
  isRest: boolean;
}

/** Morceau tel qu'il est écrit dans les fichiers de données (notation compacte). */
export interface PieceSource {
  id: string;
  title: string;
  composer?: string;
  description?: string;
  level: number;
  timeSig?: [number, number];
  /** Tempo de référence (noires par minute). */
  tempo: number;
  keySig?: string;
  right?: string;
  left?: string;
  percussion?: boolean;
}

export interface Piece {
  id: string;
  title: string;
  composer?: string;
  description?: string;
  level: number;
  timeSig: [number, number];
  tempo: number;
  keySig: string;
  beatsPerMeasure: number;
  measureCount: number;
  totalBeats: number;
  notes: ScoreNote[];
  hasRight: boolean;
  hasLeft: boolean;
  percussion: boolean;
}

export type NoteStatus = 'current' | 'correct' | 'ok' | 'wrong' | 'missed' | 'dim' | 'pending';
