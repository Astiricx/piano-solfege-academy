// Module 4 : répertoire et lecteur de partition.
import { REPERTOIRE, findPieceSource, getPiece } from '../../data';
import { navigate } from '../../lib/router';
import { useProgress } from '../../state/progress';
import { BackButton, PageHeader, Stars, Tip } from '../../components/ui';
import { PracticePlayer, starsFor } from './PracticePlayer';

const LEVEL_LABEL = ['', 'Tout premier pas', 'Débutant', 'Débutant +', 'Élémentaire', 'Élémentaire +', 'Défi'];

export function PracticeModule() {
  const { data } = useProgress();
  return (
    <div>
      <PageHeader
        icon="🎼"
        title="Pratique & partition défilante"
        subtitle="Répertoire libre de droits, du plus simple au plus exigeant. Choisissez un morceau pour l’ouvrir dans le lecteur."
      />
      <Tip>
        Conseil de travail : <strong>mode Attente</strong> main par main → deux mains → <strong>mode Rythme</strong> à 60 % → montez le tempo. Utilisez la{' '}
        <strong>boucle A-B</strong> sur les mesures difficiles.
      </Tip>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPERTOIRE.map((src, i) => {
          const p = getPiece(src);
          const st = data.pieces[src.id];
          return (
            <button
              key={src.id}
              type="button"
              onClick={() => navigate({ name: 'piece', id: src.id })}
              className="card group text-left transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="chip bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                  {i + 1}. {LEVEL_LABEL[src.level] ?? `Niveau ${src.level}`}
                </span>
                {st && <Stars n={starsFor(st.best)} />}
              </div>
              <h3 className="mt-3 text-lg font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{src.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{src.composer}</p>
              <p className="mt-2 line-clamp-3 text-sm">{src.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span>
                  {p.timeSig[0]}/{p.timeSig[1]}
                </span>
                <span>· {p.measureCount} mesures</span>
                <span>· {p.hasRight && p.hasLeft ? 'deux mains' : p.hasRight ? 'main droite' : 'main gauche'}</span>
                {p.keySig !== 'C' && <span>· armure : {p.keySig === 'F' ? 'Fa majeur' : p.keySig === 'G' ? 'Sol majeur' : p.keySig}</span>}
                {st && <span className="ml-auto font-semibold text-emerald-600">{st.best} %</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PieceView({ id }: { id: string }) {
  const src = findPieceSource(id);
  if (!src) {
    return (
      <div>
        <BackButton onClick={() => navigate({ name: 'practice' })} />
        <p>Morceau introuvable.</p>
      </div>
    );
  }
  const piece = getPiece(src);
  const fromLesson = id.startsWith('l') && /^l\d+-e\d+$/.test(id);
  return (
    <div>
      <BackButton onClick={() => (fromLesson ? navigate({ name: 'lesson', id: id.split('-')[0] }) : navigate({ name: 'practice' }))} label={fromLesson ? 'Retour à la leçon' : 'Répertoire'} />
      <div className="mb-4 mt-2">
        <h1 className="text-2xl font-bold sm:text-3xl">{piece.title}</h1>
        {piece.composer && <p className="text-slate-500 dark:text-slate-400">{piece.composer}</p>}
        {piece.description && <p className="mt-2 max-w-3xl">{piece.description}</p>}
      </div>
      <PracticePlayer piece={piece} />
    </div>
  );
}
