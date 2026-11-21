// Reconnaissance auditive : direction, intervalles, retrouver la note.
import { useEffect, useRef, useState } from 'react';
import { Interval, Note } from 'tonal';
import { audio } from '../../audio/AudioEngine';
import { useNoteInput } from '../../input/InputContext';
import { useProgress, withActivity } from '../../state/progress';
import { FR_NAMES, LETTERS, midiLabel } from '../../lib/music';
import { Segmented, Stat } from '../../components/ui';

type Game = 'direction' | 'interval' | 'find';
const ROUNDS = 10;

const INTERVAL_NAMES: Record<string, string> = {
  '2M': 'Seconde majeure',
  '3m': 'Tierce mineure',
  '3M': 'Tierce majeure',
  '4P': 'Quarte juste',
  '5P': 'Quinte juste',
  '6M': 'Sixte majeure',
  '8P': 'Octave',
};
const INTERVAL_SETS: Record<string, string[]> = {
  facile: ['3M', '5P', '8P'],
  moyen: ['2M', '3M', '4P', '5P', '8P'],
  complet: ['2M', '3m', '3M', '4P', '5P', '6M', '8P'],
};
const WHITE_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

interface Question {
  notes: number[];
  answer: string;
  options: { value: string; label: string }[];
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeQuestion(game: Game, set: string): Question {
  if (game === 'direction') {
    const pool = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'].map((n) => Note.midi(n)!);
    const a = randomFrom(pool);
    let b = randomFrom(pool);
    if (Math.random() < 0.15) b = a;
    else while (b === a) b = randomFrom(pool);
    return {
      notes: [a, b],
      answer: b > a ? 'up' : b < a ? 'down' : 'same',
      options: [
        { value: 'up', label: '⬆ Ça monte' },
        { value: 'same', label: '= Identique' },
        { value: 'down', label: '⬇ Ça descend' },
      ],
    };
  }
  if (game === 'interval') {
    const ivls = INTERVAL_SETS[set];
    const ivl = randomFrom(ivls);
    const root = randomFrom(['C4', 'D4', 'E4', 'F4', 'G4']);
    const top = Note.transpose(root, ivl);
    const rm = Note.midi(root)!;
    const tm = Note.midi(top) ?? rm + Interval.semitones(ivl)!;
    return { notes: [rm, tm], answer: ivl, options: ivls.map((v) => ({ value: v, label: INTERVAL_NAMES[v] })) };
  }
  const target = randomFrom(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'].map((n) => Note.midi(n)!));
  return {
    notes: [60, target],
    answer: String(target % 12),
    options: LETTERS.map((l) => ({ value: String(WHITE_PC[l]), label: FR_NAMES[l] })),
  };
}

export function EarTraining() {
  const { data, update, settings } = useProgress();
  const [game, setGame] = useState<Game>('direction');
  const [set, setSet] = useState('facile');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const gameId = game === 'interval' ? `interval-${set}` : game;

  const play = (question: Question) => {
    void audio.ensureStarted().then(() => {
      if (game === 'find') {
        audio.playPrompt(question.notes[0], 0.7, 0.05);
        audio.playPrompt(question.notes[1], 0.9, 1.1);
      } else {
        audio.playPrompt(question.notes[0], 0.7, 0.05);
        audio.playPrompt(question.notes[1], 0.9, 0.85);
      }
    });
  };

  const begin = () => {
    setRound(1);
    setScore(0);
    setDone(false);
    setPicked(null);
    const nq = makeQuestion(game, set);
    setQ(nq);
    play(nq);
  };

  const choose = (value: string) => {
    if (!q || picked || done) return;
    setPicked(value);
    const ok = value === q.answer;
    const newScore = score + (ok ? 1 : 0);
    setScore(newScore);
    if (game === 'interval') {
      // Rejoue l'intervalle en harmonique pour fixer le son
      audio.playPrompt(q.notes, 1, 0.2);
    }
    timer.current = window.setTimeout(() => {
      if (round >= ROUNDS) {
        setDone(true);
        update((p) => {
          const prev = p.ear[gameId] ?? { best: 0, plays: 0 };
          return withActivity({ ...p, ear: { ...p.ear, [gameId]: { best: Math.max(prev.best, newScore), plays: prev.plays + 1 } } });
        });
      } else {
        setRound(round + 1);
        setPicked(null);
        const nq = makeQuestion(game, set);
        setQ(nq);
        play(nq);
      }
    }, ok ? 700 : 1500);
  };

  useNoteInput((e) => {
    if (e.type === 'on' && game === 'find' && q && !picked) choose(String(e.midi % 12));
  });

  const reset = (g: Game) => {
    clearTimeout(timer.current);
    setGame(g);
    setQ(null);
    setRound(0);
    setDone(false);
    setPicked(null);
  };

  const best = data.ear[gameId]?.best;
  const options = q?.options ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented<Game>
          value={game}
          onChange={reset}
          options={[
            { value: 'direction', label: '⬆⬇ Monte ou descend ?' },
            { value: 'interval', label: '↔ Intervalles' },
            { value: 'find', label: '🎯 Retrouve la note' },
          ]}
        />
        {game === 'interval' && (
          <Segmented
            value={set}
            onChange={(v) => {
              setSet(v);
              reset('interval');
            }}
            size="sm"
            options={Object.keys(INTERVAL_SETS).map((k) => ({ value: k, label: k }))}
          />
        )}
      </div>
      <div className="card space-y-5 text-center">
        <p className="text-slate-600 dark:text-slate-300">
          {game === 'direction' && 'Deux notes sont jouées. La seconde est-elle plus aiguë, plus grave ou identique ?'}
          {game === 'interval' && 'Deux notes sont jouées l’une après l’autre. Quel est l’écart (l’intervalle) entre elles ?'}
          {game === 'find' && 'On joue d’abord le Do de référence, puis une note mystère entre Do4 et Do5. Retrouvez-la sur le clavier ou avec les boutons.'}
        </p>
        {round === 0 ? (
          <button type="button" className="btn-primary !px-8 !py-3 !text-base" onClick={begin}>
            ▶ Commencer ({ROUNDS} questions)
          </button>
        ) : done ? (
          <div className="animate-pop space-y-4">
            <div className="text-4xl font-black">
              {score}/{ROUNDS}
            </div>
            <p>{score >= 9 ? 'Excellente oreille ! 🎧' : score >= 7 ? 'Très bien !' : 'L’oreille se travaille : refaites une série demain.'}</p>
            <button type="button" className="btn-primary" onClick={begin}>
              ↻ Nouvelle série
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="question" value={`${round}/${ROUNDS}`} />
              <Stat label="score" value={score} />
              <Stat label="record" value={best ?? '—'} />
            </div>
            <button type="button" className="btn-secondary" onClick={() => q && play(q)}>
              🔁 Réécouter
            </button>
            <div className={`grid gap-2 ${options.length > 4 ? 'grid-cols-4 sm:grid-cols-7' : 'grid-cols-3'}`}>
              {options.map((o) => {
                const isAnswer = picked && o.value === q?.answer;
                const isWrong = picked === o.value && o.value !== q?.answer;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => choose(o.value)}
                    className={`btn !py-3 ${isAnswer ? 'bg-emerald-600 text-white' : isWrong ? 'bg-rose-600 text-white' : 'btn-secondary'}`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            {picked && q && (
              <p className={`animate-pop font-semibold ${picked === q.answer ? 'text-emerald-600' : 'text-rose-600'}`}>
                {picked === q.answer ? 'Bravo !' : 'Non…'}{' '}
                {game === 'find'
                  ? `C’était ${midiLabel(q.notes[1], settings.naming, true)}.`
                  : game === 'interval'
                    ? `C’était une ${INTERVAL_NAMES[q.answer].toLowerCase()} (${midiLabel(q.notes[0], 'fr')} → ${midiLabel(q.notes[1], 'fr')}).`
                    : ''}
              </p>
            )}
          </>
        )}
      </div>
      <p className="text-center text-xs text-slate-500">Astuce : en mode micro, l’application ignore automatiquement ce qu’elle joue elle-même.</p>
    </div>
  );
}
