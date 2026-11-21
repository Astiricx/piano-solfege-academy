// Cours en diapositives avant chaque niveau de lecture (Niveau 0 d'introduction + niveaux 1 à 9).
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { SolfegeLevel, SolfegeNote } from '../../data/solfege';
import { audio } from '../../audio/AudioEngine';
import { useProgress, withActivity } from '../../state/progress';
import { parsePitch } from '../../lib/music';
import { noteName, positionText } from '../../lib/staff';
import { StaffDiagram, type DiagramHighlight } from '../../score/StaffDiagram';
import type { DiagramSlot } from '../../score/staffDiagram';
import { MiniKeyboard } from '../../components/MiniKeyboard';
import { Segmented, Tip } from '../../components/ui';
import { useKeyHints } from '../../input/InputContext';

interface Slide {
  title: string;
  body: ReactNode;
}

interface Props {
  level: SolfegeLevel;
  onPractice(): void;
  onKeyGame(): void;
  onNextLevel?(): void;
  onExit(): void;
}

/** Joue une suite de notes en signalant l'indice en cours (pour la surbrillance). */
function useSequence() {
  const [idx, setIdx] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const stop = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    setIdx(null);
  }, []);
  useEffect(() => stop, [stop]);
  const play = useCallback(
    async (midis: number[], step = 0.75) => {
      stop();
      await audio.ensureStarted();
      midis.forEach((m, i) => {
        audio.playPrompt(m, step * 0.95, i * step);
        timers.current.push(window.setTimeout(() => setIdx(i), i * step * 1000));
      });
      timers.current.push(window.setTimeout(() => setIdx(null), midis.length * step * 1000 + 200));
    },
    [stop],
  );
  return { idx, play, stop };
}

const midiOf = (p: string) => parsePitch(p)?.midi ?? 60;

function kbRange(midis: number[]): [number, number] {
  const lo = Math.min(...midis);
  const hi = Math.max(...midis);
  const start = Math.floor(lo / 12) * 12;
  const end = Math.max(start + 12, Math.ceil((hi + 1) / 12) * 12);
  return [start, end];
}

function sortNotes(notes: SolfegeNote[]): SolfegeNote[] {
  return notes.slice().sort((a, b) => (a.clef === b.clef ? midiOf(a.pitch) - midiOf(b.pitch) : a.clef === 'treble' ? -1 : 1));
}

function ListenButton({ onClick, label = '🔊 Écouter chaque note' }: { onClick(): void; label?: string }) {
  return (
    <button type="button" className="btn-secondary" onClick={onClick}>
      {label}
    </button>
  );
}

// ------------------------------------------------------------------ Niveau 0
function IntroSlides(seq: ReturnType<typeof useSequence>, linesMode: 'lines' | 'spaces', setLinesMode: (m: 'lines' | 'spaces') => void): Slide[] {
  const scale = [60, 62, 64, 65, 67, 69, 71, 72];
  const scalePitches = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
  const frNames = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do'];
  const lineHighlights: DiagramHighlight[] =
    linesMode === 'lines'
      ? ['E4', 'G4', 'B4', 'D5', 'F5'].map((p, i) => ({ pitch: p, clef: 'treble', tag: `ligne ${i + 1}`, tagAt: 70 + i * 34, color: 'indigo' }))
      : ['F4', 'A4', 'C5', 'E5'].map((p, i) => ({ pitch: p, clef: 'treble', tag: `interligne ${i + 1}`, tagAt: 70 + i * 44, color: 'emerald' }));
  return [
    {
      title: '1. Le clavier : des groupes de 2 et de 3 touches noires',
      body: (
        <>
          <p>
            Regardez les touches noires : elles sont toujours groupées <strong className="text-sky-600">par 2</strong> puis{' '}
            <strong className="text-amber-600">par 3</strong>, et ce motif se répète sur tout le clavier. C’est votre carte pour vous repérer.
          </p>
          <MiniKeyboard
            start={48}
            end={71}
            marks={{ 49: { color: '#0284c7' }, 51: { color: '#0284c7' }, 61: { color: '#0284c7' }, 63: { color: '#0284c7' }, 54: { color: '#d97706' }, 56: { color: '#d97706' }, 58: { color: '#d97706' }, 66: { color: '#d97706' }, 68: { color: '#d97706' }, 70: { color: '#d97706' } }}
            caption="Bleu : groupes de 2 touches noires · Orange : groupes de 3"
          />
        </>
      ),
    },
    {
      title: '2. Trouver le Do',
      body: (
        <>
          <p>
            Le <strong>Do</strong> est la touche blanche <strong>juste à gauche d’un groupe de 2 touches noires</strong>. Il y a un Do à chaque groupe de 2 ! Celui du milieu du
            clavier s’appelle le <strong>Do central</strong> (Do4) : c’est le point de départ de tout le parcours.
          </p>
          <MiniKeyboard
            start={48}
            end={72}
            marks={{ 48: { label: 'Do3', color: '#bbf7d0' }, 60: { label: 'Do4', color: '#4ade80' }, 72: { label: 'Do5', color: '#bbf7d0' }, 49: { color: '#0284c7' }, 51: { color: '#0284c7' }, 61: { color: '#0284c7' }, 63: { color: '#0284c7' } }}
            caption="Do4 (vert foncé) = Do central"
          />
          <ListenButton label="🔊 Écouter les trois Do" onClick={() => void seq.play([48, 60, 72])} />
        </>
      ),
    },
    {
      title: '3. Les 7 notes',
      body: (
        <>
          <p>
            Les touches blanches portent 7 noms qui se suivent toujours dans le même ordre : <strong>Do – Ré – Mi – Fa – Sol – La – Si</strong>, puis on recommence à Do. De
            Do à Do, on parcourt une <strong>octave</strong>.
          </p>
          <MiniKeyboard
            start={60}
            end={72}
            marks={Object.fromEntries(scale.map((m, i) => [m, { label: frNames[i], color: seq.idx === i ? '#fbbf24' : '#e0e7ff' }]))}
          />
          <ListenButton label="🔊 Écouter Do-Ré-Mi-Fa-Sol-La-Si-Do" onClick={() => void seq.play(scale, 0.5)} />
        </>
      ),
    },
    {
      title: '4. La portée : 5 lignes et 4 interlignes',
      body: (
        <>
          <p>
            Les notes s’écrivent sur une <strong>portée</strong> de <strong>5 lignes</strong>, séparées par <strong>4 interlignes</strong> (les espaces). On compte toujours{' '}
            <strong>de bas en haut</strong>. Une note est soit <em>sur une ligne</em> (la ligne la traverse), soit <em>dans un interligne</em>. Quand la portée ne suffit pas, on
            ajoute de petites <strong>lignes supplémentaires</strong>.
          </p>
          <Segmented<'lines' | 'spaces'>
            value={linesMode}
            onChange={setLinesMode}
            options={[
              { value: 'lines', label: 'Les 5 lignes' },
              { value: 'spaces', label: 'Les 4 interlignes' },
            ]}
          />
          <StaffDiagram display="treble" slots={[]} highlights={lineHighlights} width={260} />
          <p className="text-sm text-slate-500">Le signe au début est la clé de Sol : elle s’enroule autour de la 2e ligne, qui devient la ligne du Sol.</p>
        </>
      ),
    },
    {
      title: '5. Plus la note monte, plus on va vers la droite',
      body: (
        <>
          <p>
            Sur la portée, chaque note monte d’un cran : ligne, interligne, ligne… Sur le clavier, cela correspond à la <strong>touche blanche suivante vers la droite</strong>, et
            le son devient <strong>plus aigu</strong>. Écoutez et regardez les deux en même temps :
          </p>
          <StaffDiagram
            display="treble"
            slots={scalePitches.map((p, i) => ({
              notes: [{ pitch: p, clef: 'treble', color: seq.idx === i ? '#d97706' : '#111827' }],
              label: frNames[i],
              labelColor: seq.idx === i ? '#d97706' : undefined,
            }))}
            width={430}
          />
          <MiniKeyboard start={60} end={72} marks={Object.fromEntries(scale.map((m, i) => [m, { label: frNames[i], color: seq.idx === i ? '#fbbf24' : '#e0e7ff' }]))} />
          <ListenButton label="🔊 Écouter la montée" onClick={() => void seq.play(scale, 0.6)} />
        </>
      ),
    },
  ];
}

// ------------------------------------------------------------------ Niveaux 1 à 9
function NoteFocus({ level, notes }: { level: SolfegeLevel; notes: SolfegeNote[] }) {
  const { settings } = useProgress();
  const [sel, setSel] = useState(0);
  const cur = notes[Math.min(sel, notes.length - 1)];
  const midis = notes.map((n) => midiOf(n.pitch));
  const [start, end] = kbRange(midis);
  useKeyHints({ expected: [midiOf(cur.pitch)] });
  const choose = (i: number) => {
    setSel(i);
    void audio.ensureStarted().then(() => audio.playPrompt(midiOf(notes[i].pitch), 0.9));
  };
  const slots: DiagramSlot[] = notes.map((n, i) => ({
    notes: [{ pitch: n.pitch, clef: n.clef, color: i === sel ? '#4f46e5' : '#94a3b8' }],
    label: noteName(n.pitch, settings.naming, false),
    labelColor: i === sel ? '#4f46e5' : '#94a3b8',
  }));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {notes.map((n, i) => (
          <button
            key={`${n.pitch}-${n.clef}`}
            type="button"
            onClick={() => choose(i)}
            className={`btn !py-1.5 ${i === sel ? 'bg-indigo-600 text-white' : 'btn-secondary'}`}
          >
            🔊 {noteName(n.pitch, settings.naming, true)}
          </button>
        ))}
      </div>
      <StaffDiagram
        display={level.display}
        slots={slots}
        highlights={[{ pitch: cur.pitch, clef: cur.clef, slot: sel, color: 'indigo' }]}
        width={Math.max(300, 120 + notes.length * 52)}
      />
      <div className="rounded-xl bg-indigo-50 px-4 py-3 text-lg dark:bg-indigo-950/50">
        <strong>{noteName(cur.pitch, settings.naming, true)}</strong> : {positionText(cur.pitch, cur.clef)}.
      </div>
      <MiniKeyboard
        start={start}
        end={end}
        marks={Object.fromEntries(
          notes.map((n, i) => [midiOf(n.pitch), { label: noteName(n.pitch, settings.naming, false), color: i === sel ? '#fbbf24' : '#e0e7ff' }]),
        )}
        caption="La touche jaune correspond à la note sélectionnée (elle s’allume aussi sur le piano en bas)."
      />
    </div>
  );
}

function chunkNotes(level: SolfegeLevel): SolfegeNote[][] {
  const sorted = sortNotes(level.notes);
  if (level.display === 'grand') return [sorted.filter((n) => n.clef === 'treble'), sorted.filter((n) => n.clef === 'bass')];
  const max = level.accidentals ? 2 : 3;
  const size = Math.max(3, Math.ceil(sorted.length / max));
  const out: SolfegeNote[][] = [];
  for (let i = 0; i < sorted.length; i += size) out.push(sorted.slice(i, i + size));
  return out;
}

function LevelSlides(level: SolfegeLevel, seq: ReturnType<typeof useSequence>, naming: 'fr' | 'en' | 'both'): Slide[] {
  const sorted = sortNotes(level.notes);
  const midis = sorted.map((n) => midiOf(n.pitch));
  const [start, end] = kbRange(midis);
  const playingMidi = seq.idx !== null ? midis[seq.idx] : null;
  const chunks = chunkNotes(level);
  const slides: Slide[] = [
    {
      title: `Les notes du niveau ${level.number}`,
      body: (
        <>
          <p>{level.description}</p>
          <StaffDiagram
            display={level.display}
            slots={sorted.map((n, i) => ({
              notes: [{ pitch: n.pitch, clef: n.clef, color: seq.idx === i ? '#d97706' : '#111827' }],
              label: noteName(n.pitch, naming, false),
              labelColor: seq.idx === i ? '#d97706' : undefined,
            }))}
            width={Math.max(300, 120 + sorted.length * 44)}
          />
          <MiniKeyboard
            start={start}
            end={end}
            marks={Object.fromEntries(sorted.map((n) => [midiOf(n.pitch), { label: noteName(n.pitch, naming, false), color: playingMidi === midiOf(n.pitch) ? '#fbbf24' : '#c7d2fe' }]))}
            caption="Les touches à connaître pour ce niveau"
          />
          <ListenButton onClick={() => void seq.play(midis, 0.7)} />
        </>
      ),
    },
  ];
  if (level.accidentals) {
    slides.push({
      title: 'Dièses ♯ et bémols ♭',
      body: (
        <>
          <p>
            Le <strong>dièse ♯</strong> monte la note d’un demi-ton : on joue la touche <strong>juste à droite</strong>. Le <strong>bémol ♭</strong> la descend d’un demi-ton :
            touche <strong>juste à gauche</strong>. L’altération s’écrit <em>devant</em> la note, sur la même ligne ou le même interligne.
          </p>
          <StaffDiagram
            display="treble"
            slots={[
              { notes: [{ pitch: 'F4', clef: 'treble' }], label: 'Fa' },
              { notes: [{ pitch: 'F#4', clef: 'treble', color: '#4f46e5' }], label: 'Fa♯' },
              { notes: [{ pitch: 'Gb4', clef: 'treble', color: '#4f46e5' }], label: 'Sol♭' },
              { notes: [{ pitch: 'G4', clef: 'treble' }], label: 'Sol' },
            ]}
            width={340}
          />
          <MiniKeyboard start={60} end={72} marks={{ 65: { label: 'Fa' }, 66: { label: 'Fa♯', color: '#4f46e5' }, 67: { label: 'Sol' } }} caption="Fa♯ et Sol♭ : la même touche noire" />
          <ListenButton label="🔊 Fa → Fa♯ → Sol" onClick={() => void seq.play([65, 66, 67], 0.7)} />
        </>
      ),
    });
  }
  chunks.forEach((c, i) => {
    slides.push({
      title:
        level.display === 'grand'
          ? i === 0
            ? 'Où sont les notes ? Portée du haut (clé de Sol)'
            : 'Où sont les notes ? Portée du bas (clé de Fa)'
          : chunks.length > 1
            ? `Où sont les notes ? (${i + 1}/${chunks.length})`
            : 'Où sont les notes ?',
      body: (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">Touchez chaque note : la flèche montre sa ligne ou son interligne, la touche s’allume et le son est joué.</p>
          <NoteFocus key={`${level.id}-${i}`} level={level} notes={c} />
        </>
      ),
    });
  });
  return slides;
}

export function SolfegeLesson({ level, onPractice, onKeyGame, onNextLevel, onExit }: Props) {
  const { settings, update } = useProgress();
  const seq = useSequence();
  const [i, setI] = useState(0);
  const [linesMode, setLinesMode] = useState<'lines' | 'spaces'>('lines');

  const content = level.intro ? IntroSlides(seq, linesMode, setLinesMode) : LevelSlides(level, seq, settings.naming);
  const slides: Slide[] = [
      ...content,
      {
        title: level.intro ? 'Bravo, vous savez vous repérer !' : 'À retenir',
        body: (
          <>
            {level.tips && (
              <ul className="list-disc space-y-2 pl-6 text-lg">
                {level.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            {level.intro ? (
              <>
                <p>
                  Vous connaissez maintenant le clavier (Do à gauche des 2 touches noires), les 7 notes, la portée et la règle « plus c’est haut, plus c’est à droite ». Testez-vous
                  avec le jeu du clavier, puis passez au Niveau 1.
                </p>
                <Tip>Astuce : pour le jeu, vous pouvez masquer les noms sur le piano du bas (bouton « Noms des notes »).</Tip>
              </>
            ) : (
              <Tip>En mode Zen, prenez votre temps : la vitesse viendra avec la répétition. En cas d’erreur, la note jouée s’affiche en rouge à côté de la bonne.</Tip>
            )}
          </>
        ),
      },
  ];
  const last = i === slides.length - 1;

  const completeIntro = () =>
    update((p) => {
      const prev = p.solfege[level.id] ?? { best: 0, plays: 0, stars: 0 };
      return withActivity({ ...p, solfege: { ...p.solfege, [level.id]: { ...prev, stars: Math.max(prev.stars, 1) } } });
    });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="btn-ghost -ml-2" onClick={onExit}>
          ← Niveaux
        </button>
        <div className="text-sm text-slate-500">
          📖 Cours · Niveau {level.number} — {level.title}
        </div>
      </div>
      <div className="flex gap-1.5" aria-label={`Diapositive ${i + 1} sur ${slides.length}`}>
        {slides.map((_, k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              seq.stop();
              setI(k);
            }}
            className={`h-2 flex-1 rounded-full transition ${k <= i ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            aria-label={`Aller à la diapositive ${k + 1}`}
          />
        ))}
      </div>
      <div key={i} className="card animate-pop space-y-4">
        <div className="label">
          Diapositive {i + 1} / {slides.length}
        </div>
        <h2 className="text-2xl font-bold">{slides[i].title}</h2>
        <div className="space-y-4 leading-relaxed">{slides[i].body}</div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="btn-secondary"
          disabled={i === 0}
          onClick={() => {
            seq.stop();
            setI(i - 1);
          }}
        >
          ← Précédent
        </button>
        {!last ? (
          <button
            type="button"
            className="btn-primary !px-6"
            onClick={() => {
              seq.stop();
              setI(i + 1);
            }}
          >
            Suivant →
          </button>
        ) : level.intro ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                completeIntro();
                onKeyGame();
              }}
            >
              🎯 Jeu : trouve la note sur le clavier
            </button>
            <button
              type="button"
              className="btn-primary !px-6"
              onClick={() => {
                completeIntro();
                onNextLevel?.();
              }}
            >
              Passer au Niveau 1 (cours) →
            </button>
          </div>
        ) : (
          <button type="button" className="btn-success !px-6 !py-3 !text-base" onClick={onPractice}>
            ▶ Passer à la pratique (Mode Zen)
          </button>
        )}
      </div>
    </div>
  );
}
