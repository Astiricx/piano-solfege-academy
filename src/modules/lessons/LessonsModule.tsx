// Module 3 : cours de piano progressifs (10 leçons).
import { useState } from 'react';
import { LESSONS, findLesson, type Lesson } from '../../data/lessons';
import { getPiece } from '../../data';
import { navigate } from '../../lib/router';
import { useProgress, withActivity, type ProgressData } from '../../state/progress';
import { BackButton, PageHeader, ProgressBar, Stars, Tip } from '../../components/ui';
import { HandsDiagram, MiniKeyboard } from '../../components/MiniKeyboard';
import { PracticePlayer, starsFor } from '../practice/PracticePlayer';

export function lessonPassed(lesson: Lesson, data: ProgressData): boolean {
  return lesson.exercises.every((e) => (data.pieces[e.id]?.best ?? 0) >= 80);
}

export function lessonDone(lesson: Lesson, data: ProgressData): boolean {
  return !!data.lessons[lesson.id]?.completed || lessonPassed(lesson, data);
}

export function LessonsModule() {
  const { data } = useProgress();
  const done = LESSONS.filter((l) => lessonDone(l, data)).length;
  return (
    <div>
      <PageHeader
        icon="🎹"
        title="Cours de piano"
        subtitle="10 leçons, du premier doigt aux deux mains. Chaque leçon : une explication courte, puis des exercices dans le lecteur."
        right={
          <div className="w-48 text-right text-sm">
            {done}/10 leçons terminées
            <ProgressBar value={done * 10} className="mt-1" />
          </div>
        }
      />
      <Tip>
        Pas encore de piano ? Les leçons fonctionnent avec le piano virtuel et le clavier d’ordinateur, mais elles prendront tout leur sens avec un vrai clavier
        (USB-MIDI ou micro). En attendant, privilégiez les modules Solfège et Rythme.
      </Tip>
      <ol className="mt-6 grid gap-3 md:grid-cols-2">
        {LESSONS.map((l, i) => {
          const isDone = lessonDone(l, data);
          const prevDone = i === 0 || lessonDone(LESSONS[i - 1], data);
          const recommended = !isDone && prevDone;
          return (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => navigate({ name: 'lesson', id: l.id })}
                className={`card flex w-full items-start gap-4 text-left transition hover:border-indigo-400 ${recommended ? 'ring-2 ring-indigo-400/60' : ''}`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg font-black ${
                    isDone ? 'bg-emerald-500 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200'
                  }`}
                >
                  {isDone ? '✓' : l.number}
                </span>
                <span className="flex-1">
                  <span className="block font-bold">{l.title}</span>
                  <span className="block text-sm text-slate-500 dark:text-slate-400">{l.goal}</span>
                  {recommended && <span className="chip mt-2 bg-indigo-600 text-white">Leçon conseillée</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function LessonVisual({ kind }: { kind: NonNullable<Lesson['visual']> }) {
  switch (kind) {
    case 'hands':
      return (
        <div className="flex flex-wrap items-end justify-center gap-8">
          <HandsDiagram />
          <MiniKeyboard
            start={60}
            end={71}
            marks={{ 60: { label: '1', color: '#bfdbfe' }, 62: { label: '2', color: '#bfdbfe' }, 64: { label: '3', color: '#bfdbfe' }, 65: { label: '4', color: '#bfdbfe' }, 67: { label: '5', color: '#bfdbfe' } }}
            caption="Position de Do, main droite : le pouce (1) sur le Do central"
          />
        </div>
      );
    case 'c-position':
      return (
        <MiniKeyboard
          start={48}
          end={71}
          marks={{
            48: { label: '5', color: '#fde68a' },
            50: { label: '4', color: '#fde68a' },
            52: { label: '3', color: '#fde68a' },
            53: { label: '2', color: '#fde68a' },
            55: { label: '1', color: '#fde68a' },
            60: { label: '1', color: '#bfdbfe' },
            62: { label: '2', color: '#bfdbfe' },
            64: { label: '3', color: '#bfdbfe' },
            65: { label: '4', color: '#bfdbfe' },
            67: { label: '5', color: '#bfdbfe' },
          }}
          caption="Position de Do : main gauche (jaune) sur Do3–Sol3, main droite (bleu) sur Do4–Sol4"
        />
      );
    case 'thumb-under':
      return (
        <MiniKeyboard
          start={60}
          end={72}
          marks={{
            60: { label: '1', color: '#bfdbfe' },
            62: { label: '2', color: '#bfdbfe' },
            64: { label: '3', color: '#bfdbfe' },
            65: { label: '1', color: '#bbf7d0' },
            67: { label: '2', color: '#bbf7d0' },
            69: { label: '3', color: '#bbf7d0' },
            71: { label: '4', color: '#bbf7d0' },
            72: { label: '5', color: '#bbf7d0' },
          }}
          caption="Gamme de Do, main droite : le pouce passe sous le 3e doigt pour jouer le Fa"
        />
      );
    case 'black-keys':
      return (
        <MiniKeyboard
          start={60}
          end={71}
          marks={{ 61: { label: 'Do♯' }, 63: { label: 'Ré♯' }, 66: { label: 'Fa♯' }, 68: { label: 'Sol♯' }, 70: { label: 'La♯' } }}
          caption="Do♯ = Ré♭, Ré♯ = Mi♭, Fa♯ = Sol♭, Sol♯ = La♭, La♯ = Si♭"
        />
      );
    case 'chords':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <MiniKeyboard start={60} end={76} marks={{ 60: { label: 'Do', color: '#bfdbfe' }, 64: { label: 'Mi', color: '#bfdbfe' }, 67: { label: 'Sol', color: '#bfdbfe' } }} caption="Do majeur" />
          <MiniKeyboard start={60} end={76} marks={{ 65: { label: 'Fa', color: '#bbf7d0' }, 69: { label: 'La', color: '#bbf7d0' }, 72: { label: 'Do', color: '#bbf7d0' } }} caption="Fa majeur" />
          <MiniKeyboard start={60} end={76} marks={{ 67: { label: 'Sol', color: '#fde68a' }, 71: { label: 'Si', color: '#fde68a' }, 74: { label: 'Ré', color: '#fde68a' } }} caption="Sol majeur" />
          <MiniKeyboard start={60} end={76} marks={{ 69: { label: 'La', color: '#fbcfe8' }, 72: { label: 'Do', color: '#fbcfe8' }, 76: { label: 'Mi', color: '#fbcfe8' } }} caption="La mineur" />
        </div>
      );
  }
}

export function LessonView({ id }: { id: string }) {
  const lesson = findLesson(id);
  const { data, update } = useProgress();
  const [exIdx, setExIdx] = useState(0);
  if (!lesson) {
    return (
      <div>
        <BackButton onClick={() => navigate({ name: 'lessons' })} />
        <p>Leçon introuvable.</p>
      </div>
    );
  }
  const ex = lesson.exercises[Math.min(exIdx, lesson.exercises.length - 1)];
  const piece = getPiece(ex);
  const isDone = lessonDone(lesson, data);
  const next = LESSONS.find((l) => l.number === lesson.number + 1);

  const markDone = (v: boolean) =>
    update((p) => {
      const n = { ...p, lessons: { ...p.lessons, [lesson.id]: { completed: v } } };
      return v ? withActivity(n) : n;
    });

  return (
    <div className="space-y-6">
      <BackButton onClick={() => navigate({ name: 'lessons' })} label="Toutes les leçons" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="label">Leçon {lesson.number} / 10</div>
          <h1 className="text-2xl font-bold sm:text-3xl">{lesson.title}</h1>
          <p className="text-slate-500 dark:text-slate-400">🎯 {lesson.goal}</p>
        </div>
        {isDone ? (
          <span className="chip bg-emerald-500 px-3 py-1 text-sm text-white">✓ Leçon validée</span>
        ) : (
          <button type="button" className="btn-secondary" onClick={() => markDone(true)}>
            Marquer comme terminée
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card space-y-3 lg:col-span-3">
          <h2 className="text-lg font-bold">📖 L’essentiel</h2>
          {lesson.theory.map((t, i) => (
            <p key={i} className="leading-relaxed">
              {t}
            </p>
          ))}
        </div>
        <div className="space-y-4 lg:col-span-2">
          {lesson.visual && (
            <div className="card flex justify-center">
              <LessonVisual kind={lesson.visual} />
            </div>
          )}
          <div className="card">
            <h2 className="mb-2 font-bold">💡 Conseils</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {lesson.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">🎹 Exercices (validation : 80 % sur chacun)</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {lesson.exercises.map((e, i) => {
            const best = data.pieces[e.id]?.best;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => setExIdx(i)}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                  i === exIdx ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50' : 'border-slate-300 hover:border-indigo-300 dark:border-slate-700'
                }`}
              >
                <div className="font-semibold">
                  {i + 1}. {e.title}
                </div>
                <div className="text-xs text-slate-500">{best !== undefined ? <><Stars n={starsFor(best)} /> {best} %</> : 'À faire'}</div>
              </button>
            );
          })}
        </div>
        {ex.description && <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{ex.description}</p>}
        <PracticePlayer key={ex.id} piece={piece} />
      </div>

      {next && (
        <div className="flex justify-end">
          <button type="button" className="btn-primary" onClick={() => navigate({ name: 'lesson', id: next.id })}>
            Leçon suivante : {next.title} →
          </button>
        </div>
      )}
    </div>
  );
}
