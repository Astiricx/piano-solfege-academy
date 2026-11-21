// Bus d'entrées unifié : clavier PC, piano virtuel, piano USB-MIDI et micro.
// Les modules s'abonnent via `useNoteInput` et reçoivent des événements note on / off.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { audio } from '../audio/AudioEngine';
import { useSettings } from '../state/progress';
import { BASE_MIDI, KEY_CODE_TO_OFFSET, LABEL_CODES, QWERTY_LABELS, isTypingTarget } from './keymap';
import { MicPitchDetector, type MicFrame, type MicSettings } from './MicPitchDetector';
import { MidiManager, type MidiStatus } from './MidiManager';

export type InputSource = 'keyboard' | 'mic' | 'midi';
export type EventOrigin = 'pc' | 'virtual' | 'midi' | 'mic';

export interface NoteEvent {
  type: 'on' | 'off';
  midi: number;
  velocity: number;
  origin: EventOrigin;
  /** Horloge audio (secondes) au moment de l'événement. */
  time: number;
}

export interface KeyHints {
  expected?: number[];
  correct?: number[];
  wrong?: number[];
}

export interface MicState {
  active: boolean;
  starting: boolean;
  error: string | null;
  frame: MicFrame | null;
}

interface InputCtx {
  source: InputSource;
  setSource(s: InputSource): void;
  midiStatus: MidiStatus;
  midiDevices: string[];
  mic: MicState;
  startMic(): Promise<void>;
  stopMic(): void;
  setMicSettings(patch: Partial<MicSettings>): void;
  activeNotes: number[];
  subscribe(fn: (e: NoteEvent) => void): () => void;
  pressVirtual(midi: number): void;
  releaseVirtual(midi: number): void;
  hints: KeyHints;
  setHints(h: KeyHints): void;
  octaveShift: number;
  setOctaveShift(n: number): void;
  keyLabels: Record<number, string>;
}

const Ctx = createContext<InputCtx | null>(null);

export function InputProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useSettings();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const listeners = useRef(new Set<(e: NoteEvent) => void>());
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const activeRef = useRef(new Map<number, number>()); // midi -> compteur
  const [hints, setHintsState] = useState<KeyHints>({});
  const [octaveShift, setOctaveShift] = useState(0);
  const octaveRef = useRef(0);
  octaveRef.current = octaveShift;
  const [midiStatus, setMidiStatus] = useState<MidiStatus>(MidiManager.isSupported() ? 'pending' : 'unsupported');
  const [midiDevices, setMidiDevices] = useState<string[]>([]);
  const [mic, setMic] = useState<MicState>({ active: false, starting: false, error: null, frame: null });
  const [layoutLabels, setLayoutLabels] = useState<Record<string, string>>(QWERTY_LABELS);
  const source = settings.inputSource;

  const emit = useCallback((e: NoteEvent) => {
    const map = activeRef.current;
    const n = map.get(e.midi) ?? 0;
    if (e.type === 'on') map.set(e.midi, n + 1);
    else if (n <= 1) map.delete(e.midi);
    else map.set(e.midi, n - 1);
    setActiveNotes(Array.from(map.keys()));

    const s = settingsRef.current;
    const audible =
      e.origin === 'pc' || e.origin === 'virtual' ? s.soundOn : e.origin === 'midi' ? s.midiEcho : false;
    if (audible) {
      if (e.type === 'on') audio.noteOn(e.midi, e.velocity);
      else audio.noteOff(e.midi);
    }
    listeners.current.forEach((l) => l(e));
  }, []);

  const subscribe = useCallback((fn: (e: NoteEvent) => void) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  // --- Débloquer l'audio au premier geste ---
  useEffect(() => {
    const unlock = () => void audio.ensureStarted();
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', unlock, { capture: true });
      window.removeEventListener('keydown', unlock, { capture: true });
    };
  }, []);

  // --- Clavier d'ordinateur ---
  useEffect(() => {
    const pressed = new Map<string, number>();
    const down = (ev: KeyboardEvent) => {
      if (ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey || isTypingTarget(ev.target)) return;
      const off = KEY_CODE_TO_OFFSET[ev.code];
      if (off === undefined || pressed.has(ev.code)) return;
      const midi = BASE_MIDI + off + octaveRef.current * 12;
      pressed.set(ev.code, midi);
      ev.preventDefault();
      emit({ type: 'on', midi, velocity: 0.8, origin: 'pc', time: audio.now() });
    };
    const up = (ev: KeyboardEvent) => {
      const midi = pressed.get(ev.code);
      if (midi === undefined) return;
      pressed.delete(ev.code);
      emit({ type: 'off', midi, velocity: 0, origin: 'pc', time: audio.now() });
    };
    const blur = () => {
      pressed.forEach((midi) => emit({ type: 'off', midi, velocity: 0, origin: 'pc', time: audio.now() }));
      pressed.clear();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [emit]);

  // Libellés selon la disposition réelle du clavier (Chrome/Edge).
  useEffect(() => {
    const kb = (navigator as unknown as { keyboard?: { getLayoutMap?: () => Promise<Map<string, string>> } }).keyboard;
    kb?.getLayoutMap?.()
      .then((map) => {
        const labels: Record<string, string> = {};
        LABEL_CODES.forEach((c) => {
          const v = map.get(c);
          labels[c] = v ? v.toUpperCase() : QWERTY_LABELS[c];
        });
        setLayoutLabels(labels);
      })
      .catch(() => undefined);
  }, []);

  const keyLabels = useMemo(() => {
    const out: Record<number, string> = {};
    LABEL_CODES.forEach((c) => {
      const midi = BASE_MIDI + KEY_CODE_TO_OFFSET[c] + octaveShift * 12;
      if (!(midi in out)) out[midi] = layoutLabels[c] ?? '';
    });
    return out;
  }, [layoutLabels, octaveShift]);

  // --- Web MIDI ---
  useEffect(() => {
    const mgr = new MidiManager({
      onNoteOn: (midi, vel) => emit({ type: 'on', midi, velocity: vel, origin: 'midi', time: audio.now() }),
      onNoteOff: (midi) => emit({ type: 'off', midi, velocity: 0, origin: 'midi', time: audio.now() }),
      onStatus: (st, devs) => {
        setMidiStatus(st);
        setMidiDevices(devs);
      },
    });
    void mgr.init();
    return () => mgr.dispose();
  }, [emit]);

  // --- Micro ---
  const detectorRef = useRef<MicPitchDetector | null>(null);
  if (!detectorRef.current) {
    detectorRef.current = new MicPitchDetector({
      onFrame: (frame) => setMic((m) => ({ ...m, frame })),
      onNoteOn: (midi) => emit({ type: 'on', midi, velocity: 0.8, origin: 'mic', time: audio.now() }),
      onNoteOff: (midi) => emit({ type: 'off', midi, velocity: 0, origin: 'mic', time: audio.now() }),
      isSuppressed: () => audio.isBusy(),
    });
  }
  useEffect(() => {
    if (detectorRef.current) detectorRef.current.settings = { ...settings.mic };
  }, [settings.mic]);

  const startMic = useCallback(async () => {
    const det = detectorRef.current;
    if (!det || det.running) return;
    setMic((m) => ({ ...m, starting: true, error: null }));
    try {
      await det.start();
      setMic((m) => ({ ...m, active: true, starting: false }));
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Accès au micro refusé. Autorisez-le dans les réglages du navigateur (icône à gauche de l’adresse).'
          : err instanceof Error
            ? err.message
            : 'Impossible de démarrer le micro.';
      setMic((m) => ({ ...m, active: false, starting: false, error: msg }));
    }
  }, []);

  const stopMic = useCallback(() => {
    detectorRef.current?.stop();
    setMic((m) => ({ ...m, active: false, frame: null }));
  }, []);

  useEffect(() => {
    if (source !== 'mic' && detectorRef.current?.running) stopMic();
  }, [source, stopMic]);

  useEffect(() => () => detectorRef.current?.stop(), []);

  const setMicSettings = useCallback(
    (patch: Partial<MicSettings>) => setSettings({ mic: { ...settingsRef.current.mic, ...patch } }),
    [setSettings],
  );

  const setSource = useCallback((s: InputSource) => setSettings({ inputSource: s }), [setSettings]);

  const pressVirtual = useCallback(
    (midi: number) => {
      void audio.ensureStarted();
      emit({ type: 'on', midi, velocity: 0.8, origin: 'virtual', time: audio.now() });
    },
    [emit],
  );
  const releaseVirtual = useCallback(
    (midi: number) => emit({ type: 'off', midi, velocity: 0, origin: 'virtual', time: audio.now() }),
    [emit],
  );

  const setHints = useCallback((h: KeyHints) => setHintsState(h), []);

  const value: InputCtx = {
    source,
    setSource,
    midiStatus,
    midiDevices,
    mic,
    startMic,
    stopMic,
    setMicSettings,
    activeNotes,
    subscribe,
    pressVirtual,
    releaseVirtual,
    hints,
    setHints,
    octaveShift,
    setOctaveShift,
    keyLabels,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInput(): InputCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useInput hors InputProvider');
  return c;
}

/** Abonnement pratique aux événements de note (le gestionnaire peut changer à chaque rendu). */
export function useNoteInput(handler: (e: NoteEvent) => void, enabled = true) {
  const { subscribe } = useInput();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return;
    return subscribe((e) => ref.current(e));
  }, [subscribe, enabled]);
}

/** Définit les indications du clavier virtuel pendant la durée de vie du composant. */
export function useKeyHints(h: KeyHints) {
  const { setHints } = useInput();
  const key = JSON.stringify(h);
  useEffect(() => {
    setHints(JSON.parse(key) as KeyHints);
  }, [key, setHints]);
  useEffect(() => () => setHints({}), [setHints]);
}
