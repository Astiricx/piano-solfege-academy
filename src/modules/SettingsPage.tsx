// Réglages, sauvegarde (export / import JSON) et réinitialisation.
import { useRef, useState } from 'react';
import { useProgress } from '../state/progress';
import { PageHeader, Segmented, Toggle, Tip } from '../components/ui';
import type { Naming } from '../types';

export function SettingsPage() {
  const { settings, setSettings, exportJson, importJson, reset, data } = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      await importJson(f);
      setMsg({ ok: true, text: 'Sauvegarde importée avec succès.' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Import impossible.' });
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const counts = {
    exercices: Object.values(data.days).reduce((a, b) => a + b, 0),
    notes: Object.values(data.noteStats).reduce((a, b) => a + b.attempts, 0),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader icon="⚙︎" title="Réglages & sauvegarde" />

      <div className="card space-y-4">
        <h2 className="font-bold">Affichage</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-40 text-sm">Noms des notes</span>
          <Segmented<Naming>
            value={settings.naming}
            onChange={(v) => setSettings({ naming: v })}
            options={[
              { value: 'fr', label: 'Do Ré Mi' },
              { value: 'en', label: 'C D E' },
              { value: 'both', label: 'Les deux' },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-40 text-sm">Thème</span>
          <Segmented
            value={settings.theme}
            onChange={(v) => setSettings({ theme: v })}
            options={[
              { value: 'dark', label: '☾ Sombre' },
              { value: 'light', label: '☀︎ Clair' },
            ]}
          />
        </div>
        <Toggle checked={settings.showNames} onChange={(v) => setSettings({ showNames: v })} label="Afficher le nom des notes sur les partitions" />
        <Toggle checked={settings.showFingers} onChange={(v) => setSettings({ showFingers: v })} label="Afficher les doigtés (1-5)" />
      </div>

      <div className="card space-y-4">
        <h2 className="font-bold">Exercices</h2>
        <Toggle checked={settings.exactOctave} onChange={(v) => setSettings({ exactOctave: v })} label="Lecture de notes : exiger l’octave exacte" />
        <Toggle checked={settings.practiceIgnoreOctave} onChange={(v) => setSettings({ practiceIgnoreOctave: v })} label="Lecteur : accepter la note dans n’importe quelle octave" />
        <Toggle checked={settings.unlockAll} onChange={(v) => setSettings({ unlockAll: v })} label="Débloquer tous les niveaux de solfège" />
        <label className="flex items-center gap-3 text-sm">
          <span className="w-56">Compensation de latence (rythme)</span>
          <input type="range" min={0} max={200} step={5} value={settings.latencyMs} onChange={(e) => setSettings({ latencyMs: +e.target.value })} className="flex-1" />
          <span className="w-14 tabular-nums">{settings.latencyMs} ms</span>
        </label>
      </div>

      <div className="card space-y-4">
        <h2 className="font-bold">Son & piano</h2>
        <Toggle checked={settings.soundOn} onChange={(v) => setSettings({ soundOn: v })} label="Son du piano virtuel / clavier d’ordinateur" />
        <Toggle checked={settings.midiEcho} onChange={(v) => setSettings({ midiEcho: v })} label="Jouer aussi le son pour les notes reçues en MIDI (piano sans haut-parleur)" />
        <p className="text-sm text-slate-500">Le son de piano (Salamander Grand Piano) se charge au premier clic ; un synthétiseur le remplace en attendant.</p>
      </div>

      <div className="card space-y-4">
        <h2 className="font-bold">Sauvegarde de la progression</h2>
        <p className="text-sm text-slate-500">
          La progression est enregistrée automatiquement dans ce navigateur ({counts.exercices} exercice(s), {counts.notes} note(s) lue(s)). Exportez-la régulièrement pour la
          retrouver sur un autre appareil ou après avoir vidé le cache.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={exportJson}>
            ⬇ Exporter (JSON)
          </button>
          <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
            ⬆ Importer une sauvegarde
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
        </div>
        {msg && <Tip tone={msg.ok ? 'info' : 'warn'}>{msg.text}</Tip>}
        <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
          {confirmReset ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>Effacer toute la progression (les réglages sont conservés) ?</span>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                  setMsg({ ok: true, text: 'Progression réinitialisée.' });
                }}
              >
                Oui, tout effacer
              </button>
              <button type="button" className="btn-ghost" onClick={() => setConfirmReset(false)}>
                Annuler
              </button>
            </div>
          ) : (
            <button type="button" className="btn-ghost text-rose-600" onClick={() => setConfirmReset(true)}>
              Réinitialiser la progression…
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
