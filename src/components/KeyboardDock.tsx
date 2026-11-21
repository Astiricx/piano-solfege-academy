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
  const start = (narrow ? 60 : 48) + input.octaveShift * 12;
  const end = start + octaves * 12;

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
              {!narrow && (
                <button
                  type="button"
                  className="btn-ghost !px-2 !py-0.5 !text-xs"
                  onClick={() => setSettings({ keyboardOctaves: settings.keyboardOctaves === 3 ? 2 : 3 })}
                >
                  {settings.keyboardOctaves} octaves
                </button>
              )}
              <span className="ml-auto hidden md:inline">
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
            onPress={input.pressVirtual}
            onRelease={input.releaseVirtual}
            height={narrow ? 110 : 140}
          />
        )}
      </div>
    </div>
  );
}
