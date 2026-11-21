// Composant React d'affichage de partition avec surbrillance dynamique, curseur,
// zone de boucle A-B et défilement automatique.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Naming, NoteStatus, Piece } from '../types';
import { renderScore, type ScoreLayout } from './renderScore';

const STATUS_CLASSES = ['st-current', 'st-correct', 'st-ok', 'st-wrong', 'st-missed', 'st-dim', 'st-pending'];

interface Props {
  piece: Piece;
  statuses?: Record<string, NoteStatus>;
  currentId?: string | null;
  showNames?: boolean;
  showFingers?: boolean;
  naming?: Naming;
  zoom?: number;
  loop?: { a: number; b: number } | null;
  onMeasureClick?: (measure: number) => void;
  maxHeight?: string;
  maxPerLine?: number;
  autoScroll?: boolean;
  /** Position continue du curseur (en noires) pour le mode tempo ; remplace currentId pour le curseur. */
  className?: string;
}

export function ScoreView({
  piece,
  statuses = {},
  currentId = null,
  showNames = false,
  showFingers = false,
  naming = 'fr',
  zoom = 1,
  loop = null,
  onMeasureClick,
  maxHeight = '60vh',
  maxPerLine = 4,
  autoScroll = true,
  className = '',
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [layout, setLayout] = useState<ScoreLayout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastRow = useRef(-1);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = Math.floor(el.clientWidth - 8);
      setWidth((prev) => (Math.abs(prev - w) > 8 ? w : prev));
    });
    ro.observe(el);
    setWidth(Math.floor(el.clientWidth - 8));
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!hostRef.current || width <= 0) return;
    try {
      const l = renderScore(hostRef.current, piece, { width, zoom, showNames, showFingers, naming, maxPerLine });
      setLayout(l);
      setError(null);
      lastRow.current = -1;
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [piece, width, zoom, showNames, showFingers, naming, maxPerLine]);

  // Couleurs des notes (classes CSS sur les groupes SVG, sans re-gravure)
  useEffect(() => {
    if (!layout) return;
    layout.noteEls.forEach((el, id) => {
      el.classList.remove(...STATUS_CLASSES);
      const s = statuses[id];
      if (s) el.classList.add(`st-${s}`);
    });
  }, [layout, statuses]);

  const cur = currentId && layout ? layout.notePos.get(currentId) : undefined;

  useEffect(() => {
    if (!autoScroll || !cur || !scrollRef.current) return;
    if (cur.row === lastRow.current) return;
    lastRow.current = cur.row;
    const box = scrollRef.current;
    const target = Math.max(0, cur.top - 12);
    if (target < box.scrollTop || target + cur.height > box.scrollTop + box.clientHeight) {
      box.scrollTo({ top: target, behavior: 'smooth' });
    }
  }, [cur, autoScroll]);

  return (
    <div
      ref={scrollRef}
      className={`score-paper relative overflow-auto rounded-xl bg-white text-black shadow-inner ${className}`}
      style={{ maxHeight }}
    >
      {error && (
        <div className="p-4 text-sm text-rose-700">Erreur d’affichage de la partition : {error}</div>
      )}
      <div className="relative mx-auto" style={{ width: layout?.width }}>
        {layout && loop && (
          <>
            {layout.measureRects.slice(loop.a, loop.b + 1).map((r, i) => (
              <div
                key={`loop-${i}`}
                className="pointer-events-none absolute rounded bg-amber-300/25 ring-1 ring-amber-400/60"
                style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
              />
            ))}
          </>
        )}
        {cur && (
          <div
            className="pointer-events-none absolute rounded-md bg-sky-400/20 ring-2 ring-sky-500/50 transition-all duration-150"
            style={{ left: cur.x - 8, top: cur.top + 4, width: 30, height: cur.height - 8 }}
          />
        )}
        <div ref={hostRef} />
        {layout &&
          onMeasureClick &&
          layout.measureRects.map((r, i) => (
            <button
              key={`m-${i}`}
              type="button"
              title={`Mesure ${i + 1}`}
              aria-label={`Mesure ${i + 1}`}
              onClick={() => onMeasureClick(i)}
              className="absolute rounded hover:bg-indigo-400/10 focus:outline-none"
              style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
            />
          ))}
      </div>
    </div>
  );
}
