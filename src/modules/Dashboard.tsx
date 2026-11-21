// Tableau de bord : accès aux 4 modules, progression, série quotidienne, notes faibles.
import { LESSONS, REPERTOIRE, RHYTHM_EXERCISES } from '../data';
import { SOLFEGE_LEVELS, WEEKLY_TIP } from '../data/solfege';
import { navigate, type Route } from '../lib/router';
import { liveStreak, useProgress } from '../state/progress';
import { ProgressBar, Tip } from '../components/ui';
import { pitchNameLabel, todayKey } from '../lib/music';
import { lessonDone } from './lessons/LessonsModule';
import { weakNotes } from './solfege/SolfegeModule';

export function Dashboard() {
  const { data, settings } = useProgress();
  const streak = liveStreak(data);
  const solfegeDone = SOLFEGE_LEVELS.filter((l) => (data.solfege[l.id]?.stars ?? 0) >= 1).length;
  const rhythmDone = RHYTHM_EXERCISES.filter((r) => (data.rhythm[r.id]?.best ?? 0) >= 65).length;
  const lessonsDone = LESSONS.filter((l) => lessonDone(l, data)).length;
  const piecesDone = REPERTOIRE.filter((p) => (data.pieces[p.id]?.best ?? 0) >= 80).length;
  const nextLesson = LESSONS.find((l) => !lessonDone(l, data));
  const nextLevel = SOLFEGE_LEVELS.find((l) => (data.solfege[l.id]?.stars ?? 0) < 1);
  const weak = weakNotes(data, 5);
  const today = data.days[todayKey()] ?? 0;

  // 14 derniers jours d'activité
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const k = todayKey(d);
    return { k, n: data.days[k] ?? 0, label: d.toLocaleDateString('fr-FR', { weekday: 'narrow' }) };
  });

  const modules: { route: Route; icon: string; title: string; text: string; done: number; total: number; badge: string }[] = [
    {
      route: { name: 'solfege' },
      icon: '𝄞',
      title: '1. Atelier solfège',
      text: 'Lecture de notes par notes repères, oreille musicale, défi 60 secondes.',
      done: solfegeDone,
      total: SOLFEGE_LEVELS.length,
      badge: 'Sans piano',
    },
    {
      route: { name: 'rhythm' },
      icon: '🥁',
      title: '2. Atelier rythme',
      text: 'Rondes, blanches, noires, croches et silences avec métronome.',
      done: rhythmDone,
      total: RHYTHM_EXERCISES.length,
      badge: 'Sans piano',
    },
    {
      route: { name: 'lessons' },
      icon: '🎹',
      title: '3. Cours de piano',
      text: '10 leçons : posture, position de Do, deux mains, accords, morceau final.',
      done: lessonsDone,
      total: LESSONS.length,
      badge: 'Piano conseillé',
    },
    {
      route: { name: 'practice' },
      icon: '🎼',
      title: '4. Pratique & répertoire',
      text: 'Partition défilante : mode Attente, mode Rythme, boucle A-B, tempo 40–120 %.',
      done: piecesDone,
      total: REPERTOIRE.length,
      badge: 'Piano conseillé',
    },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Bonjour 👋</h1>
          <p className="mt-1 max-w-2xl text-slate-500 dark:text-slate-400">
            Commencez dès aujourd’hui par le solfège et le rythme au clavier d’ordinateur. Quand votre piano arrivera, branchez-le en USB (ou utilisez le micro) : tout le
            parcours est prêt.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-4xl font-black text-orange-500">🔥 {streak}</div>
            <div className="text-xs text-slate-500">jour(s) d’affilée · record {data.streak.best}</div>
          </div>
          <div className="flex items-end gap-1" aria-label="Activité des 14 derniers jours">
            {days.map((d) => (
              <div key={d.k} className="flex flex-col items-center gap-1" title={`${d.k} : ${d.n} exercice(s)`}>
                <div
                  className={`w-3 rounded-sm ${d.n ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  style={{ height: `${8 + Math.min(32, d.n * 4)}px` }}
                />
                <span className="text-[9px] text-slate-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {modules.map((m) => (
          <button
            key={m.title}
            type="button"
            onClick={() => navigate(m.route)}
            className="card group flex flex-col text-left transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 text-2xl text-white shadow">{m.icon}</span>
              <span className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{m.badge}</span>
            </div>
            <h2 className="mt-4 text-lg font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{m.title}</h2>
            <p className="mt-1 flex-1 text-sm text-slate-500 dark:text-slate-400">{m.text}</p>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>Progression</span>
                <span>
                  {m.done}/{m.total}
                </span>
              </div>
              <ProgressBar value={(m.done / m.total) * 100} />
            </div>
          </button>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card space-y-3">
          <h2 className="font-bold">▶ Pour aujourd’hui</h2>
          <p className="text-sm text-slate-500">{today ? `${today} exercice(s) terminé(s) aujourd’hui. Bravo !` : 'Pas encore d’exercice aujourd’hui.'}</p>
          <div className="flex flex-col gap-2">
            {nextLevel && (
              <button type="button" className="btn-secondary justify-start" onClick={() => navigate({ name: 'solfege' })}>
                𝄞 Lecture : niveau {nextLevel.number} – {nextLevel.title}
              </button>
            )}
            <button type="button" className="btn-secondary justify-start" onClick={() => navigate({ name: 'rhythm' })}>
              🥁 5 minutes de rythme
            </button>
            {nextLesson && (
              <button type="button" className="btn-secondary justify-start" onClick={() => navigate({ name: 'lesson', id: nextLesson.id })}>
                🎹 Leçon {nextLesson.number} : {nextLesson.title}
              </button>
            )}
          </div>
        </div>
        <div className="card space-y-3">
          <h2 className="font-bold">🎯 Notes à retravailler</h2>
          {weak.length === 0 ? (
            <p className="text-sm text-slate-500">Vos notes les plus lentes ou les plus souvent ratées apparaîtront ici.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {weak.map((w) => (
                <li key={w.pitch} className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{pitchNameLabel(w.pitch, settings.naming, true)}</span>
                  <span className="text-slate-500">
                    {Math.round(w.accuracy)} % · {w.avgMs ? `${(w.avgMs / 1000).toFixed(1)} s` : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="btn-ghost !px-0 text-sm text-indigo-600" onClick={() => navigate({ name: 'solfege' })}>
            Voir les statistiques →
          </button>
        </div>
        <div className="card space-y-3">
          <h2 className="font-bold">🎛 Entrées disponibles</h2>
          <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
            <li>⌨︎ Clavier d’ordinateur : rangée du haut (Q/A W/Z E R T Y U) = Do central…, chiffres = touches noires.</li>
            <li>🖱 Piano virtuel en bas de l’écran (souris ou tactile).</li>
            <li>🎹 Piano USB-MIDI : détection automatique (Chrome / Edge).</li>
            <li>🎤 Micro : pour un piano acoustique ou les haut-parleurs du piano numérique.</li>
          </ul>
          <button type="button" className="btn-ghost !px-0 text-sm text-indigo-600" onClick={() => navigate({ name: 'settings' })}>
            Réglages & sauvegarde →
          </button>
        </div>
      </section>
      <Tip>{WEEKLY_TIP}</Tip>
    </div>
  );
}
