// Progression, statistiques et réglages, persistés dans localStorage (+ export/import JSON).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Naming } from '../types';
import { todayKey } from '../lib/music';
import { DEFAULT_MIC_SETTINGS, type MicSettings } from '../input/MicPitchDetector';

export const STORAGE_KEY = 'psa-progress-v1';

export interface Settings {
  theme: 'dark' | 'light';
  naming: Naming;
  showNames: boolean;
  showFingers: boolean;
  /** Lecture de notes : exiger la bonne octave. */
  exactOctave: boolean;
  /** Lecteur : accepter la note dans n'importe quelle octave (pratique au clavier PC). */
  practiceIgnoreOctave: boolean;
  unlockAll: boolean;
  /** Compensation de latence pour les exercices de rythme (ms). */
  latencyMs: number;
  /** Jouer le son du moteur pour les notes reçues en MIDI (si le piano n'a pas de haut-parleur). */
  midiEcho: boolean;
  /** Son des notes jouées au clavier PC / virtuel. */
  soundOn: boolean;
  zoom: number;
  keyboardOctaves: 2 | 3;
  showKeyboard: boolean;
  mic: MicSettings;
  inputSource: 'keyboard' | 'mic' | 'midi';
}

export interface NoteStat {
  attempts: number;
  correct: number;
  totalMs: number;
}

export interface ProgressData {
  version: 1;
  settings: Settings;
  solfege: Record<string, { best: number; plays: number; stars: number; bestChallenge?: number }>;
  noteStats: Record<string, NoteStat>;
  ear: Record<string, { best: number; plays: number }>;
  rhythm: Record<string, { best: number; plays: number }>;
  lessons: Record<string, { completed: boolean }>;
  pieces: Record<string, { best: number; bestTempo?: number; plays: number; lastPlayed: string }>;
  streak: { current: number; best: number; lastDay: string | null };
  days: Record<string, number>;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  naming: 'fr',
  showNames: true,
  showFingers: true,
  exactOctave: false,
  practiceIgnoreOctave: false,
  unlockAll: false,
  latencyMs: 0,
  midiEcho: false,
  soundOn: true,
  zoom: 1,
  keyboardOctaves: 3,
  showKeyboard: true,
  mic: DEFAULT_MIC_SETTINGS,
  inputSource: 'keyboard',
};

export function emptyProgress(): ProgressData {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    solfege: {},
    noteStats: {},
    ear: {},
    rhythm: {},
    lessons: {},
    pieces: {},
    streak: { current: 0, best: 0, lastDay: null },
    days: {},
  };
}

function normalize(raw: unknown): ProgressData {
  const base = emptyProgress();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<ProgressData>;
  return {
    ...base,
    ...r,
    version: 1,
    settings: { ...base.settings, ...(r.settings ?? {}), mic: { ...DEFAULT_MIC_SETTINGS, ...(r.settings?.mic ?? {}) } },
    streak: { ...base.streak, ...(r.streak ?? {}) },
  };
}

function load(): ProgressData {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? normalize(JSON.parse(s)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T12:00:00');
  const db = new Date(b + 'T12:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

/** Met à jour la série quotidienne (appelé à chaque exercice terminé). */
export function withActivity(p: ProgressData): ProgressData {
  const today = todayKey();
  const s = { ...p.streak };
  if (s.lastDay !== today) {
    const diff = s.lastDay ? dayDiff(s.lastDay, today) : Infinity;
    s.current = diff === 1 ? s.current + 1 : 1;
    s.lastDay = today;
    s.best = Math.max(s.best, s.current);
  }
  return { ...p, streak: s, days: { ...p.days, [today]: (p.days[today] ?? 0) + 1 } };
}

/** Série « vivante » : remise à 0 à l'affichage si un jour a été sauté. */
export function liveStreak(p: ProgressData): number {
  if (!p.streak.lastDay) return 0;
  const diff = dayDiff(p.streak.lastDay, todayKey());
  return diff <= 1 ? p.streak.current : 0;
}

interface ProgressCtx {
  data: ProgressData;
  settings: Settings;
  update(fn: (p: ProgressData) => ProgressData): void;
  setSettings(patch: Partial<Settings>): void;
  exportJson(): void;
  importJson(file: File): Promise<void>;
  reset(): void;
}

const Ctx = createContext<ProgressCtx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProgressData>(load);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* stockage plein ou désactivé */
    }
  }, [data]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', data.settings.theme === 'dark');
  }, [data.settings.theme]);

  const update = useCallback((fn: (p: ProgressData) => ProgressData) => setData((p) => fn(p)), []);
  const setSettings = useCallback(
    (patch: Partial<Settings>) => setData((p) => ({ ...p, settings: { ...p.settings, ...patch } })),
    [],
  );

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify({ app: 'piano-solfege-academy', exportedAt: new Date().toISOString(), data }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `piano-solfege-academy-sauvegarde-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [data]);

  const importJson = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as { data?: unknown; version?: number };
    const payload = parsed && typeof parsed === 'object' && 'data' in parsed ? parsed.data : parsed;
    if (!payload || typeof payload !== 'object' || (payload as { version?: number }).version !== 1) {
      throw new Error('Fichier de sauvegarde non reconnu.');
    }
    setData(normalize(payload));
  }, []);

  const reset = useCallback(() => setData((p) => ({ ...emptyProgress(), settings: p.settings })), []);

  const value = useMemo(
    () => ({ data, settings: data.settings, update, setSettings, exportJson, importJson, reset }),
    [data, update, setSettings, exportJson, importJson, reset],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useProgress hors ProgressProvider');
  return c;
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const { settings, setSettings } = useProgress();
  return [settings, setSettings];
}
