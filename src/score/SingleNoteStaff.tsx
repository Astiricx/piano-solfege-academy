// Portée des jeux de lecture : la note demandée, et en cas d'erreur la note jouée
// (rouge) à côté de la note attendue (verte), avec flèches de position.
import type { Clef } from '../types';
import { StaffDiagram, type DiagramHighlight } from './StaffDiagram';
import type { DiagramSlot } from './staffDiagram';

interface Props {
  pitch: string | null;
  clef: Clef;
  display: 'treble' | 'bass' | 'grand';
  status?: 'neutral' | 'correct' | 'wrong';
  /** Note réellement jouée en cas d'erreur. */
  wrong?: { pitch: string; clef: Clef } | null;
}

const COLORS = { neutral: '#111827', correct: '#16a34a', wrong: '#dc2626' };

export function SingleNoteStaff({ pitch, clef, display, status = 'neutral', wrong = null }: Props) {
  const slots: DiagramSlot[] = [];
  const highlights: DiagramHighlight[] = [];
  if (pitch && wrong) {
    // Diagnostic : note demandée (verte) à gauche, note jouée (rouge) à droite.
    slots.push({ notes: [{ pitch, clef, color: COLORS.correct }], label: '✓ demandée', labelColor: COLORS.correct });
    slots.push({ notes: [{ pitch: wrong.pitch, clef: wrong.clef, color: COLORS.wrong }], label: '✗ jouée', labelColor: COLORS.wrong });
    highlights.push({ pitch, clef, color: 'emerald', slot: 0 });
    highlights.push({ pitch: wrong.pitch, clef: wrong.clef, color: 'rose', slot: 1 });
  } else if (pitch) {
    slots.push({ notes: [{ pitch, clef, color: COLORS[status] }] });
  }
  return (
    <div className="mx-auto w-full max-w-md">
      <StaffDiagram display={display} slots={slots} highlights={highlights} width={wrong ? 320 : 240} />
    </div>
  );
}
