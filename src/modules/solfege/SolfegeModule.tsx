// Module 1 : atelier solfège & lecture de notes.
import { useState } from 'react';
import { SOLFEGE_LEVELS, type SolfegeLevel } from '../../data/solfege';
import { useProgress, type ProgressData } from '../../state/progress';
import { PageHeader, Segmented, Stars, Tip } from '../../components/ui';
import { pitchNameLabel } from '../../lib/music';
import { ReadingGame, type GameMode } from './ReadingGame';
import { EarTraining } from './EarTraining';

type Tab = 'reading' | 'ear' | 'stats';

export function weakNotes(data: ProgressData, limit = 8) {
  return Object.entries(data.noteStats)
    .filter(([, s]) => s.attempts >= 3)
    .map(([pitch, s]) => ({
      pitch,
      attempts: s.attempts,
      accuracy: (s.correct / s.attempts) * 100,
      avgMs: s.correct ? s.totalMs / s.correct : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.avgMs - a.avgMs)
    .slice(0, limit);
}

function levelUnlocked(levels: SolfegeLevel[], i: number, data: ProgressData, unlockAll: boolean) {
  return unlockAll || i === 0 || (data.solfege[levels[i - 1].id]?.stars ?? 0) >= 1;
}

export function SolfegeModule() {
  const { data, settings } = useProgress();
  const [tab, setTab] = useState<Tab>('reading');
  const [game, setGame] = useState<{ level: SolfegeLevel; mode: GameMode } | null>(null);

  if (game) return <ReadingGame key={`${game.level.id}-${game.mode}`} level={game.level} mode={game.mode} onExit={() => setGame(null)} />;

  const weak = weakNotes(data, 24);
  const weakLevel: SolfegeLevel | null =
    weak.length >= 2
      ? {
          id: 'weak',
          number: 0,
          title: 'Mes notes faibles',
          description: 'Entraînement ciblé sur les notes les plus lentes ou les plus souvent ratées.',
          display: 'grand',
          notes: weak.slice(0, 8).map((w) => ({ pitch: w.pitch, clef: (parseInt(w.pitch.slice(-1), 10) >= 4 ? 'treble' : 'bass') as 'treble' | 'bass' })),
        }
      : null;

  return (
    <div>
      <PageHeader
        icon="𝄞"
        title="Atelier solfège"
        subtitle="Lecture de notes par notes repères, oreille musicale et statistiques. Aucun piano nécessaire."
        right={
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'reading', label: '👁 Lecture' },
              { value: 'ear', label: '👂 Oreille' },
              { value: 'stats', label: '📊 Statistiques' },
            ]}
          />
        }
      />

      {tab === 'reading' && (
        <>
          <Tip>
            Méthode des <strong>notes repères</strong> : on apprend d’abord quelques notes faciles à reconnaître (Do central, Sol de la clé de Sol, Fa de la clé de Fa), puis on lit
            les autres par rapport à elles. Débloquez chaque niveau avec au moins une étoile.
          </Tip>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SOLFEGE_LEVELS.map((lv, i) => {
              const unlocked = levelUnlocked(SOLFEGE_LEVELS, i, data, settings.unlockAll);
              const st = data.solfege[lv.id];
              return (
                <div key={lv.id} className={`card flex flex-col ${unlocked ? '' : 'opacity-60'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="chip bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                      Niveau {lv.number} · {lv.display === 'treble' ? 'Clé de Sol' : lv.display === 'bass' ? 'Clé de Fa' : 'Grande portée'}
                    </span>
                    <Stars n={st?.stars ?? 0} />
                  </div>
                  <h3 className="mt-3 font-bold">{lv.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-slate-500 dark:text-slate-400">{lv.description}</p>
                  {st && (
                    <p className="mt-2 text-xs text-slate-500">
                      Meilleur : {st.best} %{st.bestChallenge ? ` · défi : ${st.bestChallenge} notes` : ''} · {st.plays} partie(s)
                    </p>
                  )}
                  {unlocked ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" className="btn-secondary !py-1.5" onClick={() => setGame({ level: lv, mode: 'zen' })}>
                        🧘 Zen
                      </button>
                      <button type="button" className="btn-secondary !py-1.5" onClick={() => setGame({ level: lv, mode: 'chrono' })}>
                        ⏱ Chrono
                      </button>
                      <button type="button" className="btn-primary !py-1.5" onClick={() => setGame({ level: lv, mode: 'challenge' })}>
                        ⚡ Défi 60 s
                      </button>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm">🔒 Obtenez 1 étoile au niveau précédent.</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'ear' && <EarTraining />}

      {tab === 'stats' && (
        <div className="space-y-4">
          {weak.length === 0 ? (
            <div className="card text-center text-slate-500">Jouez quelques parties de lecture pour voir apparaître vos statistiques par note.</div>
          ) : (
            <>
              <div className="card overflow-x-auto">
                <h2 className="mb-3 font-bold">Temps de réaction et réussite par note (des plus faibles aux plus solides)</h2>
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-500">
                    <tr>
                      <th className="py-1 pr-4">Note</th>
                      <th className="py-1 pr-4">Essais</th>
                      <th className="py-1 pr-4">Réussite</th>
                      <th className="py-1">Temps moyen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weak.map((w) => (
                      <tr key={w.pitch} className="border-t border-slate-200 dark:border-slate-800">
                        <td className="py-1.5 pr-4 font-semibold">{pitchNameLabel(w.pitch, settings.naming, true)}</td>
                        <td className="py-1.5 pr-4 tabular-nums">{w.attempts}</td>
                        <td className="py-1.5 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
                              <div className={`h-full ${w.accuracy >= 85 ? 'bg-emerald-500' : w.accuracy >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${w.accuracy}%` }} />
                            </div>
                            <span className="tabular-nums">{Math.round(w.accuracy)} %</span>
                          </div>
                        </td>
                        <td className="py-1.5 tabular-nums">{w.avgMs ? `${(w.avgMs / 1000).toFixed(2)} s` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {weakLevel && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-primary" onClick={() => setGame({ level: weakLevel, mode: 'zen' })}>
                    🎯 Entraîner mes notes faibles
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setGame({ level: weakLevel, mode: 'challenge' })}>
                    ⚡ Défi 60 s sur mes notes faibles
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
