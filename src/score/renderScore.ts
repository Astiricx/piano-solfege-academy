// Moteur de gravure VexFlow : grande portée multi-lignes, doigtés, noms de notes,
// et positions des notes pour le curseur / la surbrillance dynamique.
import {
  Accidental,
  Annotation,
  Barline,
  Beam,
  Dot,
  Formatter,
  Renderer,
  Stave,
  StaveConnector,
  StaveNote,
  Voice,
} from 'vexflow';

/** Résolution interne des durées VexFlow (Tables.RESOLUTION, non exporté en v4). */
const RESOLUTION = 16384;
import type { Clef, Hand, Naming, Piece, ScoreNote } from '../types';
import { KEY_SIGNATURES, pitchNameLabel } from '../lib/music';

export interface RenderOptions {
  width: number;
  zoom?: number;
  showNames?: boolean;
  showFingers?: boolean;
  naming?: Naming;
  maxPerLine?: number;
  minMeasureWidth?: number;
}

export interface NotePos {
  x: number;
  top: number;
  height: number;
  row: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ScoreLayout {
  noteEls: Map<string, Element>;
  notePos: Map<string, NotePos>;
  measureRects: Rect[];
  width: number;
  height: number;
  rowHeight: number;
}

function makeVoice(piece: Piece): Voice {
  const v = new Voice({ num_beats: piece.timeSig[0], beat_value: piece.timeSig[1], resolution: RESOLUTION });
  v.setMode(Voice.Mode.SOFT);
  return v;
}

function durString(n: ScoreNote): string {
  return n.dur + 'd'.repeat(n.dots) + (n.isRest ? 'r' : '');
}

function buildNote(n: ScoreNote, clef: Clef | 'percussion', o: RenderOptions): StaveNote {
  const restKey = clef === 'bass' ? 'd/3' : 'b/4';
  const keys = n.isRest ? [restKey] : n.keys;
  const sn = new StaveNote({ keys, duration: durString(n), clef, auto_stem: true });
  if (!n.isRest) {
    n.displayAcc.forEach((acc, i) => {
      if (acc) sn.addModifier(new Accidental(acc), i);
    });
  }
  for (let d = 0; d < n.dots; d++) {
    keys.forEach((_, i) => sn.addModifier(new Dot(), i));
  }
  if (!n.isRest && clef !== 'percussion') {
    const naming = o.naming ?? 'fr';
    const fingerJust = n.hand === 'R' ? Annotation.VerticalJustify.TOP : Annotation.VerticalJustify.BOTTOM;
    const nameJust = n.hand === 'R' ? Annotation.VerticalJustify.BOTTOM : Annotation.VerticalJustify.TOP;
    if (o.showFingers) {
      const fingers = n.fingers.slice().reverse();
      fingers.forEach((f) => {
        if (f !== null) {
          const a = new Annotation(String(f));
          a.setFont('Arial', 11, 'bold');
          a.setVerticalJustification(fingerJust);
          sn.addModifier(a, 0);
        }
      });
    }
    if (o.showNames) {
      const names = (n.hand === 'R' ? n.pitches.slice().reverse() : n.pitches.slice()).map((p) =>
        pitchNameLabel(p, naming === 'both' ? 'fr' : naming),
      );
      names.forEach((label) => {
        const a = new Annotation(label);
        a.setFont('Arial', 10, 'normal');
        a.setVerticalJustification(nameJust);
        sn.addModifier(a, 0);
      });
    }
  }
  return sn;
}

function fullRest(piece: Piece, hand: Hand, measure: number): ScoreNote {
  return {
    id: `__rest-${hand}-${measure}`,
    hand,
    midis: [],
    pitches: [],
    keys: [],
    displayAcc: [],
    dur: piece.beatsPerMeasure >= 4 ? 'w' : 'h',
    dots: piece.beatsPerMeasure === 3 ? 1 : 0,
    beats: piece.beatsPerMeasure,
    start: measure * piece.beatsPerMeasure,
    measure,
    fingers: [],
    isRest: true,
  };
}

export function renderScore(el: HTMLDivElement, piece: Piece, o: RenderOptions): ScoreLayout {
  el.innerHTML = '';
  const zoom = o.zoom ?? 1;
  const W = Math.max(300, Math.floor(o.width / zoom));
  const showT = piece.hasRight || piece.percussion;
  const showB = piece.hasLeft && !piece.percussion;
  const keyAccs = Object.keys(KEY_SIGNATURES[piece.keySig] ?? {}).length;
  const annotSpace = o.showNames || o.showFingers ? 34 : 22;

  const minW = o.minMeasureWidth ?? 200;
  const mpl = Math.max(1, Math.min(o.maxPerLine ?? 4, Math.floor((W - 90) / minW)));
  const rows = Math.ceil(piece.measureCount / mpl);
  const trebleToBass = 70 + (o.showNames || o.showFingers ? 40 : 20);
  const staffH = 80;
  const rowH = annotSpace + staffH + (showT && showB ? trebleToBass : 0) + annotSpace;
  const H = rows * rowH + 10;

  const renderer = new Renderer(el, Renderer.Backends.SVG);
  renderer.resize(W, H);
  const ctx = renderer.getContext();

  // Notes par mesure et par main
  const byMeasure: Record<string, ScoreNote[]> = {};
  for (const n of piece.notes) {
    const k = `${n.hand}${n.measure}`;
    (byMeasure[k] ??= []).push(n);
  }

  const drawOrder: string[] = [];
  const staveNotes = new Map<string, { sn: StaveNote; row: number; rowTop: number }>();
  const measureRects: Rect[] = [];

  for (let row = 0; row < rows; row++) {
    const rowTop = 5 + row * rowH;
    const yT = rowTop + annotSpace - 10;
    const yB = showT ? yT + trebleToBass : yT;
    const extraFirst = 38 + keyAccs * 11 + (row === 0 ? 32 : 0);
    const baseW = (W - 12 - extraFirst) / mpl;

    for (let col = 0; col < mpl; col++) {
      const m = row * mpl + col;
      if (m >= piece.measureCount) break;
      const first = col === 0;
      const x = 6 + (first ? 0 : extraFirst + col * baseW);
      const w = baseW + (first ? extraFirst : 0);
      const isLast = m === piece.measureCount - 1;

      const st = showT ? new Stave(x, yT, w) : null;
      const sb = showB ? new Stave(x, yB, w) : null;
      if (first) {
        if (st) {
          st.addClef(piece.percussion ? 'percussion' : 'treble');
          if (!piece.percussion && piece.keySig !== 'C') st.addKeySignature(piece.keySig);
          if (row === 0) st.addTimeSignature(`${piece.timeSig[0]}/${piece.timeSig[1]}`);
        }
        if (sb) {
          sb.addClef('bass');
          if (piece.keySig !== 'C') sb.addKeySignature(piece.keySig);
          if (row === 0) sb.addTimeSignature(`${piece.timeSig[0]}/${piece.timeSig[1]}`);
        }
      }
      if (isLast) {
        st?.setEndBarType(Barline.type.END);
        sb?.setEndBarType(Barline.type.END);
      }
      if (st && sb) {
        const sx = Math.max(st.getNoteStartX(), sb.getNoteStartX());
        st.setNoteStartX(sx);
        sb.setNoteStartX(sx);
      }
      st?.setContext(ctx).draw();
      sb?.setContext(ctx).draw();
      if (st && sb) {
        if (first) {
          new StaveConnector(st, sb).setType(StaveConnector.type.BRACE).setContext(ctx).draw();
          new StaveConnector(st, sb).setType(StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw();
        }
        new StaveConnector(st, sb)
          .setType(isLast ? StaveConnector.type.BOLD_DOUBLE_RIGHT : StaveConnector.type.SINGLE_RIGHT)
          .setContext(ctx)
          .draw();
      }

      const voices: { voice: Voice; stave: Stave; beams: Beam[]; ids: string[] }[] = [];
      const addVoice = (hand: Hand, stave: Stave | null, clef: Clef | 'percussion') => {
        if (!stave) return;
        const list = byMeasure[`${hand}${m}`] ?? [fullRest(piece, hand, m)];
        const sns = list.map((n) => {
          const sn = buildNote(n, clef, o);
          staveNotes.set(n.id, { sn, row, rowTop });
          return sn;
        });
        const voice = makeVoice(piece);
        voice.addTickables(sns);
        const beams = Beam.generateBeams(sns);
        voices.push({ voice, stave, beams, ids: list.map((n) => n.id) });
      };
      addVoice('R', st, piece.percussion ? 'percussion' : 'treble');
      addVoice('L', sb, 'bass');

      const ref = (st ?? sb)!;
      const avail = Math.max(40, ref.getNoteEndX() - ref.getNoteStartX() - 14);
      const fmt = new Formatter();
      voices.forEach((v) => fmt.joinVoices([v.voice]));
      fmt.format(
        voices.map((v) => v.voice),
        avail,
      );
      voices.forEach((v) => {
        v.voice.draw(ctx, v.stave);
        v.beams.forEach((b) => b.setContext(ctx).draw());
        drawOrder.push(...v.ids);
      });

      measureRects.push({ x: x * zoom, y: rowTop * zoom, w: w * zoom, h: rowH * zoom });
    }
  }

  // Ajuste l'échelle (zoom) via viewBox
  const svg = el.querySelector('svg');
  if (svg) {
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', String(Math.round(W * zoom)));
    svg.setAttribute('height', String(Math.round(H * zoom)));
    svg.style.width = `${Math.round(W * zoom)}px`;
    svg.style.height = `${Math.round(H * zoom)}px`;
    svg.classList.add('score-svg');
  }

  // Association éléments SVG <-> notes (même ordre que le dessin)
  const noteEls = new Map<string, Element>();
  const groups = el.querySelectorAll('.vf-stavenote');
  if (groups.length === drawOrder.length) {
    groups.forEach((g, i) => noteEls.set(drawOrder[i], g));
  }

  const notePos = new Map<string, NotePos>();
  staveNotes.forEach(({ sn, row, rowTop }, id) => {
    let x = 0;
    try {
      x = sn.getAbsoluteX();
    } catch {
      x = 0;
    }
    notePos.set(id, { x: x * zoom, top: rowTop * zoom, height: rowH * zoom, row });
  });

  return { noteEls, notePos, measureRects, width: W * zoom, height: H * zoom, rowHeight: rowH * zoom };
}

/** Rendu d'une seule note (jeux de lecture). */
export function renderSingleNote(
  el: HTMLDivElement,
  pitch: { key: string; acc: string | null; clef: Clef } | null,
  display: 'treble' | 'bass' | 'grand',
  color: string,
) {
  el.innerHTML = '';
  const W = 230;
  const grand = display === 'grand';
  const H = grand ? 250 : 150;
  const renderer = new Renderer(el, Renderer.Backends.SVG);
  renderer.resize(W, H);
  const ctx = renderer.getContext();
  const y0 = grand ? 20 : 25;
  const st = display !== 'bass' ? new Stave(10, y0, W - 20) : null;
  const sb = display !== 'treble' ? new Stave(10, grand ? y0 + 120 : y0, W - 20) : null;
  st?.addClef('treble');
  sb?.addClef('bass');
  if (st && sb) {
    const sx = Math.max(st.getNoteStartX(), sb.getNoteStartX());
    st.setNoteStartX(sx);
    sb.setNoteStartX(sx);
  }
  st?.setContext(ctx).draw();
  sb?.setContext(ctx).draw();
  if (st && sb) {
    new StaveConnector(st, sb).setType(StaveConnector.type.BRACE).setContext(ctx).draw();
    new StaveConnector(st, sb).setType(StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw();
  }
  if (pitch) {
    const stave = pitch.clef === 'bass' ? sb ?? st : st ?? sb;
    if (stave) {
      const sn = new StaveNote({ keys: [pitch.key], duration: 'w', clef: pitch.clef, auto_stem: true });
      if (pitch.acc) sn.addModifier(new Accidental(pitch.acc), 0);
      sn.setStyle({ fillStyle: color, strokeStyle: color });
      const voice = new Voice({ num_beats: 4, beat_value: 4, resolution: RESOLUTION });
      voice.setMode(Voice.Mode.SOFT);
      voice.addTickables([sn]);
      new Formatter().joinVoices([voice]).format([voice], W - 120);
      voice.draw(ctx, stave);
    }
  }
  const svg = el.querySelector('svg');
  if (svg) {
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.style.width = '100%';
    svg.style.height = 'auto';
  }
}
