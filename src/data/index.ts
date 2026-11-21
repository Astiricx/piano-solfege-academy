// Accès aux données analysées (partitions parsées une seule fois, à la demande).
import type { Piece, PieceSource } from '../types';
import { parsePiece } from '../lib/notation';
import { REPERTOIRE } from './repertoire';
import { LESSONS } from './lessons';
import { RHYTHM_EXERCISES, rhythmToPiece } from './rhythm';

const cache = new Map<string, Piece>();

export function getPiece(src: PieceSource): Piece {
  let p = cache.get(src.id);
  if (!p) {
    p = parsePiece(src);
    cache.set(src.id, p);
  }
  return p;
}

export function findPieceSource(id: string): PieceSource | undefined {
  return (
    REPERTOIRE.find((p) => p.id === id) ??
    LESSONS.flatMap((l) => l.exercises).find((p) => p.id === id) ??
    RHYTHM_EXERCISES.map(rhythmToPiece).find((p) => p.id === id)
  );
}

export { REPERTOIRE, LESSONS, RHYTHM_EXERCISES };
