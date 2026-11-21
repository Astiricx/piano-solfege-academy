// Mode Explorateur : grande portée connectée en direct au clavier (et inversement).
import { useEffect, useRef, useState } from 'react';
import type { Clef } from '../../types';
import { audio } from '../../audio/AudioEngine';
import { useInput, useKeyHints, useNoteInput } from '../../input/InputContext';
import { useProgress } from '../../state/progress';
import { midiToName, parsePitch } from '../../lib/music';
import { clefFor, noteName, positionText } from '../../lib/staff';
import { StaffDiagram, type DiagramHighlight } from '../../score/StaffDiagram';
import { Segmented, Tip } from '../../components/ui';

interface Shown {
  midis: number[];
  /** Clé imposée (clic sur la portée) : sinon déduite de la hauteur. */
  clef?: Clef;
  fromStaff?: boolean;
}

export function Explorer() {
  const { settings } = useProgress();
  const { activeNotes } = useInput();
  const [spelling, setSpelling] = useState<'sharp' | 'flat'>('sharp');
  const [shown, setShown] = useState<Shown>({ midis: [60] });
  const [lit, setLit] = useState<number[]>([]);
  const litTimer = useRef(0);
  useEffect(() => () => clearTimeout(litTimer.current), []);

  // Notes jouées au clavier / MIDI / micro : on affiche les notes tenues (accords compris).
  useNoteInput((e) => {
    if (e.type === 'on') {
      const held = Array.from(new Set([...activeNotes, e.midi]));
      setShown({ midis: held.sort((a, b) => a - b) });
    }
  });

  const pickOnStaff = (pitch: string, clef: Clef) => {
    const p = parsePitch(pitch);
    if (!p) return;
    setShown({ midis: [p.midi], clef, fromStaff: true });
    setLit([p.midi]);
    clearTimeout(litTimer.current);
    litTimer.current = window.setTimeout(() => setLit([]), 1200);
    void audio.ensureStarted().then(() => audio.playPrompt(p.midi, 1));
  };

  useKeyHints({ correct: lit });

  const flat = spelling === 'flat';
  const items = shown.midis.map((m) => {
    const pitch = midiToName(m, flat);
    const clef: Clef = shown.clef ?? clefFor(m);
    return { midi: m, pitch, clef };
  });
  const main = items[items.length - 1];
  const highlights: DiagramHighlight[] = main ? [{ pitch: main.pitch, clef: main.clef, color: 'indigo', slot: 0 }] : [];
  const black = main ? [1, 3, 6, 8, 10].includes(main.midi % 12) : false;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Tip>
        Jouez une note (piano du bas, clavier d’ordinateur, piano MIDI ou micro) : elle apparaît sur la portée avec son nom et sa position. Ou <strong>cliquez sur une ligne ou un
        interligne</strong> de la portée : la touche correspondante s’allume en vert et la note est jouée.
      </Tip>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-500">Touches noires écrites avec :</span>
        <Segmented<'sharp' | 'flat'>
          value={spelling}
          onChange={setSpelling}
          size="sm"
          options={[
            { value: 'sharp', label: 'dièse ♯' },
            { value: 'flat', label: 'bémol ♭' },
          ]}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <StaffDiagram
            display="grand"
            slots={items.length ? [{ notes: items.map((it) => ({ pitch: it.pitch, clef: it.clef, color: '#4f46e5' })) }] : []}
            highlights={highlights}
            width={340}
            onPick={pickOnStaff}
            hoverLabel={(p) => noteName(p, settings.naming, true)}
          />
          <p className="mt-1 text-center text-xs text-slate-500">Survolez la portée pour voir le nom de chaque ligne et interligne, cliquez pour l’entendre.</p>
        </div>
        <div className="card space-y-3 lg:col-span-2">
          {main ? (
            <>
              <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400">{noteName(main.pitch, settings.naming, true)}</div>
              <p className="text-lg">
                {main.clef === 'treble' ? 'Clé de Sol' : 'Clé de Fa'} : <strong>{positionText(main.pitch, main.clef, false)}</strong>.
              </p>
              {main.midi === 60 && <p className="text-sm text-slate-500">Le Do central peut aussi s’écrire au-dessus de la clé de Fa, sur une ligne supplémentaire.</p>}
              {black && (
                <p className="text-sm text-slate-500">
                  Touche noire : {noteName(midiToName(main.midi, false), settings.naming, true)} = {noteName(midiToName(main.midi, true), settings.naming, true)} (même touche).
                </p>
              )}
              {items.length > 1 && (
                <p className="text-sm">
                  Accord : <strong>{items.map((it) => noteName(it.pitch, settings.naming, true)).join(' – ')}</strong>
                </p>
              )}
              <p className="text-sm text-slate-500">
                Fréquence ≈ {(440 * Math.pow(2, (main.midi - 69) / 12)).toFixed(1)} Hz · touche n° {main.midi - 20} sur 88
              </p>
            </>
          ) : (
            <p className="text-slate-500">Jouez une note…</p>
          )}
        </div>
      </div>
    </div>
  );
}
