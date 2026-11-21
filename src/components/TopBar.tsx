// Barre supérieure : statut du piano, sélecteur de source d'entrée, micro, son, thème, série.
import { useState } from 'react';
import { useInput, type InputSource } from '../input/InputContext';
import { liveStreak, useProgress } from '../state/progress';
import { midiLabel } from '../lib/music';
import { navigate } from '../lib/router';

function MidiStatusBadge() {
  const { midiStatus, midiDevices, source } = useInput();
  if (source === 'mic') return null;
  if (midiStatus === 'connected') {
    return (
      <span className="chip bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" title={midiDevices.join(', ')}>
        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Piano connecté{midiDevices[0] ? ` : ${midiDevices[0]}` : ''}
      </span>
    );
  }
  const msg =
    midiStatus === 'unsupported'
      ? 'Web MIDI non pris en charge (utilisez Chrome ou Edge) — Mode Clavier PC actif'
      : midiStatus === 'denied'
        ? 'Accès MIDI refusé — Mode Clavier PC actif'
        : 'Aucun piano MIDI détecté — Mode Clavier PC actif';
  return (
    <span className="chip bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      <span className="h-2 w-2 rounded-full bg-slate-400" /> {msg}
    </span>
  );
}

function MicPanel() {
  const { mic, startMic, stopMic, setMicSettings } = useInput();
  const { settings, setSettings } = useProgress();
  const [open, setOpen] = useState(false);
  const f = mic.frame;
  const ms = settings.mic;
  return (
    <div className="relative flex flex-wrap items-center gap-2">
      {mic.active ? (
        <button type="button" className="btn-danger !py-1.5" onClick={stopMic}>
          ■ Couper le micro
        </button>
      ) : (
        <button type="button" className="btn-success !py-1.5" onClick={() => void startMic()} disabled={mic.starting}>
          🎤 {mic.starting ? 'Activation…' : 'Activer le micro'}
        </button>
      )}
      {mic.active && (
        <>
          <div className="flex h-3 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" title={`${f ? f.db.toFixed(0) : '-∞'} dB`}>
            <div
              className={`h-full transition-[width] duration-75 ${f && f.db >= ms.minDb ? 'bg-emerald-500' : 'bg-slate-400'}`}
              style={{ width: `${(f?.level ?? 0) * 100}%` }}
            />
          </div>
          <span className="min-w-[7.5rem] rounded-lg bg-slate-900 px-2 py-1 text-center font-mono text-xs text-white">
            {f?.active != null ? (
              <>
                ♪ {midiLabel(f.active, settings.naming === 'en' ? 'en' : 'fr', true)}{' '}
                <span className="text-slate-400">{f.cents >= 0 ? '+' : ''}{f.cents.toFixed(0)}¢</span>
              </>
            ) : f?.midi != null ? (
              <span className="text-slate-400">~ {midiLabel(f.midi, 'fr', true)}</span>
            ) : (
              <span className="text-slate-500">—</span>
            )}
          </span>
        </>
      )}
      <button type="button" className="btn-ghost !px-2 !py-1" onClick={() => setOpen((o) => !o)} aria-expanded={open} title="Réglages du micro">
        ⚙︎
      </button>
      {settings.soundOn && (
        <span
          className="chip cursor-help bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200"
          title="Le son du piano virtuel peut être capté par le micro (larsen / écho). Coupez-le ou portez un casque."
        >
          ⚠︎ Larsen possible —{' '}
          <button type="button" className="underline" onClick={() => setSettings({ soundOn: false })}>
            couper le son
          </button>
        </span>
      )}
      {mic.error && <span className="text-xs text-rose-600 dark:text-rose-400">{mic.error}</span>}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="font-semibold">Calibration anti-bruit</div>
          <label className="block">
            <span className="flex justify-between">
              <span>Volume minimal</span> <span className="tabular-nums text-slate-500">{ms.minDb} dB</span>
            </span>
            <input type="range" min={-75} max={-15} step={1} value={ms.minDb} onChange={(e) => setMicSettings({ minDb: +e.target.value })} className="w-full" />
          </label>
          <label className="block">
            <span className="flex justify-between">
              <span>Seuil de clarté</span> <span className="tabular-nums text-slate-500">{ms.clarity.toFixed(2)}</span>
            </span>
            <input type="range" min={0.7} max={0.99} step={0.01} value={ms.clarity} onChange={(e) => setMicSettings({ clarity: +e.target.value })} className="w-full" />
          </label>
          <label className="block">
            <span className="flex justify-between">
              <span>Confirmation</span> <span className="tabular-nums text-slate-500">{ms.confirmMs} ms</span>
            </span>
            <input type="range" min={20} max={200} step={10} value={ms.confirmMs} onChange={(e) => setMicSettings({ confirmMs: +e.target.value })} className="w-full" />
          </label>
          <label className="block">
            <span className="flex justify-between">
              <span>Tolérance de justesse</span> <span className="tabular-nums text-slate-500">±{ms.toleranceCents} cents</span>
            </span>
            <input type="range" min={15} max={50} step={1} value={ms.toleranceCents} onChange={(e) => setMicSettings({ toleranceCents: +e.target.value })} className="w-full" />
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Restez silencieux : la barre de niveau doit rester grise. Montez le volume minimal si des notes apparaissent toutes seules.
          </p>
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const input = useInput();
  const { data, settings, setSettings } = useProgress();
  const streak = liveStreak(data);
  const sources: { v: InputSource; label: string }[] = [
    { v: 'keyboard', label: '⌨︎ Clavier PC / Virtuel' },
    { v: 'mic', label: '🎤 Microphone' },
    { v: 'midi', label: '🎹 Piano USB-MIDI' },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <button type="button" onClick={() => navigate({ name: 'dashboard' })} className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">𝄞</span>
          <span className="hidden sm:inline">Piano Solfège Academy</span>
        </button>
        <div className="seg" role="radiogroup" aria-label="Source d’entrée">
          {sources.map((s) => (
            <button key={s.v} type="button" aria-pressed={input.source === s.v} onClick={() => input.setSource(s.v)} className="!py-1 !text-xs sm:!text-sm">
              {s.label}
            </button>
          ))}
        </div>
        <MidiStatusBadge />
        {input.source === 'mic' && <MicPanel />}
        {input.source === 'midi' && input.midiStatus !== 'connected' && (
          <span className="text-xs text-slate-500">Branchez le piano en USB puis autorisez l’accès MIDI dans le navigateur.</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <span className="chip bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200" title={`Record : ${data.streak.best} jour(s)`}>
            🔥 {streak} j
          </span>
          <button
            type="button"
            className="btn-ghost !px-2"
            onClick={() => setSettings({ soundOn: !settings.soundOn })}
            title={settings.soundOn ? 'Couper le son du piano virtuel' : 'Activer le son du piano virtuel'}
            aria-label="Son du piano virtuel"
          >
            {settings.soundOn ? '🔊' : '🔇'}
          </button>
          <button
            type="button"
            className="btn-ghost !px-2"
            onClick={() => setSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            title="Thème clair / sombre"
            aria-label="Changer de thème"
          >
            {settings.theme === 'dark' ? '☀︎' : '☾'}
          </button>
          <button type="button" className="btn-ghost !px-2" onClick={() => navigate({ name: 'settings' })} title="Réglages et sauvegarde" aria-label="Réglages">
            ⚙︎
          </button>
        </div>
      </div>
    </header>
  );
}
