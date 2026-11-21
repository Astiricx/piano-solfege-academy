// Composant React des diagrammes de portée : flèches de position, surlignage de la
// ligne / de l'interligne, étiquettes sous les notes, survol et clic sur la portée.
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { Clef } from '../types';
import { pitchFromPos, positionTag, staffPos } from '../lib/staff';
import { renderStaffDiagram, yForPos, type DiagramGeometry, type DiagramSlot, type StaffDisplay } from './staffDiagram';

export interface DiagramHighlight {
  pitch: string;
  clef: Clef;
  /** Indice de la colonne (pour la flèche verticale au-dessus de la note). */
  slot?: number;
  tag?: string;
  /** Abscisse (unités du viewBox) de l'étiquette, pour décaler des étiquettes voisines. */
  tagAt?: number;
  color?: 'indigo' | 'emerald' | 'rose' | 'amber';
}

interface Props {
  display: StaffDisplay;
  slots: DiagramSlot[];
  highlights?: DiagramHighlight[];
  width?: number;
  slotWidth?: number;
  className?: string;
  /** Clic sur une ligne / un interligne : renvoie la note naturelle. */
  onPick?(pitch: string, clef: Clef): void;
  hoverLabel?(pitch: string, clef: Clef): string;
}

const BAND: Record<NonNullable<DiagramHighlight['color']>, string> = {
  indigo: 'bg-indigo-500/25 ring-indigo-500',
  emerald: 'bg-emerald-500/25 ring-emerald-500',
  rose: 'bg-rose-500/25 ring-rose-500',
  amber: 'bg-amber-400/40 ring-amber-500',
};
const TAG: Record<NonNullable<DiagramHighlight['color']>, string> = {
  indigo: 'bg-indigo-600',
  emerald: 'bg-emerald-600',
  rose: 'bg-rose-600',
  amber: 'bg-amber-500',
};

export function StaffDiagram({ display, slots, highlights = [], width, slotWidth, className = '', onPick, hoverLabel }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<DiagramGeometry | null>(null);
  const [hover, setHover] = useState<{ pitch: string; clef: Clef; pos: number } | null>(null);
  const hasLabels = slots.some((s) => s.label);
  const key = JSON.stringify({ display, slots, width, slotWidth });

  useEffect(() => {
    if (!host.current) return;
    try {
      setGeo(renderStaffDiagram(host.current, display, slots, { width, slotWidth, labelSpace: hasLabels ? 26 : 0 }));
    } catch (e) {
      console.error(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const locate = (e: RPointerEvent<HTMLDivElement>) => {
    if (!geo) return null;
    const r = e.currentTarget.getBoundingClientRect();
    const y = ((e.clientY - r.top) / r.height) * geo.H;
    let clef: Clef = display === 'bass' ? 'bass' : 'treble';
    if (display === 'grand' && geo.trebleBottomY !== null && geo.bassBottomY !== null) {
      const bassTop = geo.bassBottomY - 4 * geo.spacing;
      clef = y < (geo.trebleBottomY + bassTop) / 2 ? 'treble' : 'bass';
    }
    const bottom = clef === 'treble' ? geo.trebleBottomY : geo.bassBottomY;
    if (bottom === null) return null;
    const pos = Math.max(-6, Math.min(14, Math.round((bottom - y) / (geo.spacing / 2))));
    return { pitch: pitchFromPos(pos, clef), clef, pos };
  };

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  const renderBand = (pos: number, clef: Clef, color: NonNullable<DiagramHighlight['color']>, tag: string | undefined, slot: number | undefined, k: string, tagAt?: number) => {
    if (!geo) return null;
    const y = yForPos(geo, clef, pos);
    if (y === null) return null;
    const onLine = pos % 2 === 0;
    const h = onLine ? 4 : geo.spacing - 2;
    const sx = slot !== undefined ? geo.slotX[slot] : undefined;
    return (
      <div key={k} className="pointer-events-none">
        <div
          className={`absolute rounded ring-1 ${BAND[color]}`}
          style={{ left: pct(geo.staveX + 34, geo.W), width: pct(geo.staveW - 34, geo.W), top: pct(y - h / 2, geo.H), height: pct(h, geo.H) }}
        />
        {tag !== undefined && (
          <div
            className={`absolute -translate-y-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white shadow ${TAG[color]}`}
            style={tagAt !== undefined ? { left: pct(tagAt, geo.W), top: pct(y, geo.H) } : sx !== undefined ? { left: pct(sx + 14, geo.W), top: pct(y, geo.H) } : { right: '0.5%', top: pct(y, geo.H) }}
          >
            ⬅ {tag}
          </div>
        )}
        {sx !== undefined && (
          <div
            className={`absolute -translate-x-1/2 animate-bounce text-lg leading-none ${color === 'rose' ? 'text-rose-600' : color === 'emerald' ? 'text-emerald-600' : 'text-indigo-600'}`}
            style={{ left: pct(sx, geo.W), top: pct(Math.min(y, (clef === 'treble' ? geo.trebleBottomY! - 4 * geo.spacing : geo.bassBottomY! - 4 * geo.spacing)) - 30, geo.H) }}
          >
            ⬇
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`score-paper rounded-xl bg-white p-2 text-black shadow-inner ${className}`}>
      <div
        className={`relative ${onPick ? 'cursor-pointer' : ''}`}
        onPointerMove={onPick ? (e) => setHover(locate(e)) : undefined}
        onPointerLeave={onPick ? () => setHover(null) : undefined}
        onPointerDown={
          onPick
            ? (e) => {
                const l = locate(e);
                if (l) onPick(l.pitch, l.clef);
              }
            : undefined
        }
      >
        <div ref={host} />
        {geo &&
          highlights.map((h, i) => renderBand(staffPos(h.pitch, h.clef), h.clef, h.color ?? 'indigo', h.tag ?? positionTag(staffPos(h.pitch, h.clef)), h.slot, `h${i}`, h.tagAt))}
        {geo && hover && (
          <>
            {renderBand(hover.pos, hover.clef, 'amber', undefined, undefined, 'hover')}
            <div
              className="pointer-events-none absolute left-1 -translate-y-1/2 rounded bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold text-white"
              style={{ top: pct(yForPos(geo, hover.clef, hover.pos) ?? 0, geo.H) }}
            >
              {hoverLabel ? hoverLabel(hover.pitch, hover.clef) : hover.pitch}
            </div>
          </>
        )}
        {geo &&
          hasLabels &&
          slots.map((s, i) =>
            s.label ? (
              <div
                key={`l${i}`}
                className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap text-xs font-semibold"
                style={{ left: pct(geo.slotX[i] ?? 0, geo.W), bottom: 2, color: s.labelColor ?? '#334155' }}
              >
                {s.label}
              </div>
            ) : null,
          )}
      </div>
    </div>
  );
}
