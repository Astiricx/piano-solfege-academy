// Petit clavier SVG statique pour les illustrations des leçons.
import { isBlackKey } from '../lib/music';

interface Mark {
  label?: string;
  color?: string;
}

export function MiniKeyboard({ start, end, marks = {}, caption }: { start: number; end: number; marks?: Record<number, Mark>; caption?: string }) {
  const whites: number[] = [];
  for (let m = start; m <= end; m++) if (!isBlackKey(m)) whites.push(m);
  const ww = 28;
  const W = whites.length * ww;
  const H = 110;
  return (
    <figure className="inline-block">
      <svg viewBox={`0 0 ${W + 2} ${H + 2}`} className="h-auto w-full max-w-xl" role="img" aria-label={caption}>
        {whites.map((m, i) => (
          <g key={m}>
            <rect x={1 + i * ww} y={1} width={ww} height={H} rx={3} fill={marks[m]?.color ?? '#fff'} stroke="#64748b" />
            {marks[m]?.label && (
              <text x={1 + i * ww + ww / 2} y={H - 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e1b4b">
                {marks[m]?.label}
              </text>
            )}
          </g>
        ))}
        {Array.from({ length: end - start + 1 }, (_, k) => start + k)
          .filter((m) => isBlackKey(m))
          .map((m) => {
            const i = whites.indexOf(m - 1);
            const bw = ww * 0.6;
            const x = 1 + (i + 1) * ww - bw / 2;
            return (
              <g key={m}>
                <rect x={x} y={1} width={bw} height={H * 0.6} rx={2} fill={marks[m]?.color ?? '#0f172a'} />
                {marks[m]?.label && (
                  <text x={x + bw / 2} y={H * 0.6 - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">
                    {marks[m]?.label}
                  </text>
                )}
              </g>
            );
          })}
      </svg>
      {caption && <figcaption className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">{caption}</figcaption>}
    </figure>
  );
}

export function HandsDiagram() {
  const finger = (x: number, h: number, n: number, key: string) => (
    <g key={key}>
      <rect x={x} y={100 - h} width={26} height={h} rx={13} fill="#c7d2fe" stroke="#4f46e5" />
      <text x={x + 13} y={100 - h + 20} textAnchor="middle" fontSize="15" fontWeight="800" fill="#1e1b4b">
        {n}
      </text>
    </g>
  );
  const heights = [40, 62, 70, 64, 50];
  return (
    <svg viewBox="0 0 400 160" className="h-auto w-full max-w-lg" role="img" aria-label="Numérotation des doigts : 1 pouce à 5 auriculaire">
      {/* main gauche : 5 4 3 2 1 */}
      <rect x={20} y={100} width={150} height={50} rx={20} fill="#e0e7ff" stroke="#4f46e5" />
      {[5, 4, 3, 2].map((n, i) => finger(24 + i * 30, heights[n - 1], n, `l${n}`))}
      <g transform="rotate(35 160 110)">{finger(150, 46, 1, 'l1')}</g>
      <text x={95} y={140} textAnchor="middle" fontSize="12" fill="#4338ca">
        Main gauche
      </text>
      {/* main droite : 1 2 3 4 5 */}
      <rect x={230} y={100} width={150} height={50} rx={20} fill="#e0e7ff" stroke="#4f46e5" />
      <g transform="rotate(-35 240 110)">{finger(224, 46, 1, 'r1')}</g>
      {[2, 3, 4, 5].map((n, i) => finger(256 + i * 30, heights[n - 1], n, `r${n}`))}
      <text x={305} y={140} textAnchor="middle" fontSize="12" fill="#4338ca">
        Main droite
      </text>
    </svg>
  );
}
