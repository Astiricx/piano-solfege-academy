// Clavier virtuel fixé en bas de l'écran, avec décalage d'octave et repliage.
import { useEffect, useState } from 'react';
import { useInput } from '../input/InputContext';
import { useProgress } from '../state/progress';
import { PianoKeyboard } from './PianoKeyboard';

export function KeyboardDock() {
  const input = useInput();
  const { settings, setSettings } = useProgress();
  const [narrow, setNarrow] = useState(() => window.innerWidth < 760);
  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 760);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const octaves = narrow ? 2 : settings.keyboardOctaves;
  let start = (narrow ? 60 : 48) + input.octaveShift * 12;
  let end = start + octaves * 12;
  // Étend le clavier si une note à montrer (indice, note jouée) sort de la plage affichée.
  const shown = [...(input.hints.expected ?? []), ...(input.hints.correct ?? []), ...(input.hints.wrong ?? []), ...input.activeNotes];
  if (shown.length) {
    const lo = Math.min(...shown);
    const hi = Math.max(...shown);
    if (lo < start) start = Math.max(21, Math.floor(lo / 12) * 12);
    if (hi > end) end = Math.min(108, Math.ceil(hi / 12) * 12);
  }

  return (
    <div className="sticky bottom-0 z-30 border-t border-slate-200 bg-slate-50/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto max-w-7xl px-3 pb-2 pt-1.5">
        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <button type="button" className="btn-ghost !px-2 !py-0.5 !text-xs" onClick={() => setSettings({ showKeyboard: !settings.showKeyboard })}>
            {settings.showKeyboard ? '▼ Masquer le clavier' : '▲ Afficher le clavier'}
          </button>
          {settings.showKeyboard && (
            <>
              <span className="hidden sm:inline">Octave :</span>
              <button type="button" className="btn-secondary !px-2 !py-0.5 !text-xs" onClick={() => input.setOctaveShift(Math.max(-2, input.octaveShift - 1))}>
                −
              </button>
              <span className="w-6 text-center tabular-nums">{input.octaveShift > 0 ? `+${input.octaveShift}` : input.octaveShift}</span>
              <button type="button" className="btn-secondary !px-2 !py-0.5 !text-xs" onClick={() => input.setOctaveShift(Math.min(2, input.octaveShift + 1))}>
                +
              </button>
              <button
                type="button"
                aria-pressed={settings.keyboardNames}
                className={`btn !px-2 !py-0.5 !text-xs ${settings.keyboardNames ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'btn-secondary'}`}
                onClick={() => setSettings({ keyboardNames: !settings.keyboardNames })}
                title="Afficher ou masquer Do, Ré, Mi… sur les touches"
              >
                Noms des notes : {settings.keyboardNames ? 'ON' : 'OFF'}
              </button>
              {!narrow && (
                <button
                  type="button"
                  className="btn-ghost !px-2 !py-0.5 !text-xs"
                  onClick={() => setSettings({ keyboardOctaves: settings.keyboardOctaves === 3 ? 2 : 3 })}
                >
                  {settings.keyboardOctaves} octaves
                </button>
              )}
              <span className="ml-auto hidden xl:inline">
                Clavier PC : rangée du bas = Do3, rangée du haut = Do central (touches noires sur la rangée au-dessus)
              </span>
            </>
          )}
        </div>
        {settings.showKeyboard && (
          <PianoKeyboard
            start={start}
            end={end}
            active={input.activeNotes}
            hints={input.hints}
            labels={input.keyLabels}
            naming={settings.naming}
            showNames={settings.keyboardNames}
            onPress={input.pressVirtual}
            onRelease={input.releaseVirtual}
            height={narrow ? 110 : 140}
          />
        )}
      </div>
    </div>
  );
}
