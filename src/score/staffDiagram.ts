// Diagrammes de portée pédagogiques (VexFlow) : une ou plusieurs colonnes de notes,
// en clé de Sol, clé de Fa ou grande portée, avec la géométrie nécessaire aux
// flèches, surlignages et clics (Explorateur).
import { Accidental, Dot, Formatter, GhostNote, Renderer, Stave, StaveConnector, StaveNote, Voice } from 'vexflow';
import type { Clef, DurCode } from '../types';
import { parsePitch } from '../lib/music';

const RESOLUTION = 16384;

export type StaffDisplay = 'treble' | 'bass' | 'grand';

export interface DiagramNote {
  pitch: string;
  clef: Clef;
  color?: string;
}

export interface DiagramSlot {
  notes: DiagramNote[];
  label?: string;
  labelColor?: string;
}

export interface DiagramGeometry {
  W: number;
  H: number;
  spacing: number;
  staveX: number;
  staveW: number;
  trebleBottomY: number | null;
  bassBottomY: number | null;
  slotX: number[];
}

export interface DiagramOptions {
  width?: number;
  slotWidth?: number;
  labelSpace?: number;
}

function makeVoice() {
  const v = new Voice({ num_beats: 4, beat_value: 4, resolution: RESOLUTION });
  v.setMode(Voice.Mode.SOFT);
  return v;
}

function buildChord(notes: DiagramNote[], clef: Clef): StaveNote {
  const parsed = notes
    .map((n) => ({ n, p: parsePitch(n.pitch)! }))
    .filter((x) => x.p)
    .sort((a, b) => a.p.midi - b.p.midi);
  const sn = new StaveNote({
    keys: parsed.map(({ p }) => `${p.letter.toLowerCase()}${p.acc}/${p.octave}`),
    duration: 'w',
    clef,
    auto_stem: true,
  });
  parsed.forEach(({ n, p }, i) => {
    if (p.acc) sn.addModifier(new Accidental(p.acc), i);
    if (n.color) sn.setKeyStyle(i, { fillStyle: n.color, strokeStyle: n.color });
  });
  const colors = Array.from(new Set(parsed.map(({ n }) => n.color).filter(Boolean)));
  if (colors.length === 1 && colors[0]) sn.setLedgerLineStyle({ strokeStyle: colors[0], fillStyle: colors[0] });
  return sn;
}

export function renderStaffDiagram(el: HTMLDivElement, display: StaffDisplay, slots: DiagramSlot[], o: DiagramOptions = {}): DiagramGeometry {
  el.innerHTML = '';
  const n = Math.max(1, slots.length);
  const slotW = o.slotWidth ?? 46;
  const W = o.width ?? Math.max(240, 110 + n * slotW);
  const grand = display === 'grand';
  const labelSpace = o.labelSpace ?? 0;
  const yT = 20;
  const yB = grand ? 140 : 20;
  const H = (grand ? 260 : 140) + labelSpace;

  const renderer = new Renderer(el, Renderer.Backends.SVG);
  renderer.resize(W, H);
  const ctx = renderer.getContext();
  const st = display !== 'bass' ? new Stave(10, yT, W - 20) : null;
  const sb = display !== 'treble' ? new Stave(10, yB, W - 20) : null;
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
    new StaveConnector(st, sb).setType(StaveConnector.type.SINGLE_RIGHT).setContext(ctx).draw();
  }

  const voices: { voice: Voice; stave: Stave; ticks: (StaveNote | GhostNote)[] }[] = [];
  const build = (stave: Stave | null, clef: Clef) => {
    if (!stave) return;
    const ticks = (slots.length ? slots : [{ notes: [] }]).map((slot) => {
      const mine = slot.notes.filter((x) => x.clef === clef);
      return mine.length ? buildChord(mine, clef) : new GhostNote({ duration: 'w' });
    });
    const voice = makeVoice();
    voice.addTickables(ticks);
    voices.push({ voice, stave, ticks });
  };
  build(st, 'treble');
  build(sb, 'bass');
  const ref = (st ?? sb)!;
  const avail = Math.max(40, ref.getNoteEndX() - ref.getNoteStartX() - 24);
  const fmt = new Formatter();
  voices.forEach((v) => fmt.joinVoices([v.voice]));
  fmt.format(
    voices.map((v) => v.voice),
    avail,
  );
  voices.forEach((v) => v.voice.draw(ctx, v.stave));

  const slotX = voices.length
    ? voices[0].ticks.map((t) => {
        try {
          return t.getAbsoluteX() + 6;
        } catch {
          return 0;
        }
      })
    : [];

  const svg = el.querySelector('svg');
  if (svg) {
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.style.width = '100%';
    svg.style.height = 'auto';
    svg.style.display = 'block';
  }
  return {
    W,
    H,
    spacing: ref.getSpacingBetweenLines(),
    staveX: 10,
    staveW: W - 20,
    trebleBottomY: st ? st.getYForLine(4) : null,
    bassBottomY: sb ? sb.getYForLine(4) : null,
    slotX,
  };
}

/** Coordonnée y (unités du viewBox) d'une position de portée. */
export function yForPos(g: DiagramGeometry, clef: Clef, pos: number): number | null {
  const bottom = clef === 'treble' ? g.trebleBottomY : g.bassBottomY;
  if (bottom === null) return null;
  return bottom - pos * (g.spacing / 2);
}

/** Dessin d'un symbole rythmique isolé (figure de note ou silence). */
export function renderRhythmSymbol(el: HTMLDivElement, dur: DurCode, dots: number, rest: boolean) {
  el.innerHTML = '';
  const W = 90;
  const H = 110;
  const renderer = new Renderer(el, Renderer.Backends.SVG);
  renderer.resize(W, H);
  const ctx = renderer.getContext();
  const stave = new Stave(0, 5, W);
  stave.setContext(ctx).draw();
  const sn = new StaveNote({ keys: ['b/4'], duration: dur + 'd'.repeat(dots) + (rest ? 'r' : ''), clef: 'treble', auto_stem: true });
  for (let i = 0; i < dots; i++) sn.addModifier(new Dot(), 0);
  const v = makeVoice();
  v.addTickables([sn]);
  new Formatter().joinVoices([v]).format([v], 40);
  // centre le symbole
  sn.setXShift?.(18);
  v.draw(ctx, stave);
  const svg = el.querySelector('svg');
  if (svg) {
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.style.width = '100%';
    svg.style.height = 'auto';
  }
}
