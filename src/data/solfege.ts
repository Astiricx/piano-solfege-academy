// Niveaux de lecture de notes (module 1), selon l'approche par notes repères.
import type { Clef } from '../types';

export interface SolfegeNote {
  pitch: string;
  clef: Clef;
}

export interface SolfegeLevel {
  id: string;
  number: number;
  title: string;
  description: string;
  display: 'treble' | 'bass' | 'grand';
  notes: SolfegeNote[];
  accidentals?: boolean;
  /** Niveau d'introduction (cours + jeu du clavier, sans lecture de portée). */
  intro?: boolean;
  /** Astuces mémoire affichées à la fin du cours. */
  tips?: string[];
}

const t = (...p: string[]): SolfegeNote[] => p.map((pitch) => ({ pitch, clef: 'treble' }));
const b = (...p: string[]): SolfegeNote[] => p.map((pitch) => ({ pitch, clef: 'bass' }));

export const SOLFEGE_LEVELS: SolfegeLevel[] = [
  {
    id: 's0',
    number: 0,
    title: 'Comprendre le clavier et la portée',
    description: 'Trouver les Do grâce aux touches noires, les 7 notes, les 5 lignes et 4 interlignes, et la règle « plus c’est haut, plus c’est à droite ».',
    display: 'treble',
    intro: true,
    notes: t('C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'),
  },
  {
    id: 's1',
    number: 1,
    title: 'Le Do central et ses voisins',
    description: 'Do (petite ligne sous la portée), Ré (sous la 1re ligne) et Mi (sur la 1re ligne).',
    display: 'treble',
    notes: t('C4', 'D4', 'E4'),
    tips: [
      'Do central = la note « entre les deux clés » : une petite ligne le traverse.',
      'Ré est accroché sous la 1re ligne, Mi est posé dessus (la ligne le traverse).',
    ],
  },
  {
    id: 's2',
    number: 2,
    title: 'Les 5 notes de la position de Do',
    description: 'Do, Ré, Mi, Fa, Sol : exactement les notes sous vos 5 doigts.',
    display: 'treble',
    notes: t('C4', 'D4', 'E4', 'F4', 'G4'),
    tips: [
      'Chaque note suivante monte d’un cran : ligne, interligne, ligne, interligne…',
      'Do-Ré-Mi-Fa-Sol = vos 5 doigts de la main droite, du pouce à l’auriculaire.',
    ],
  },
  {
    id: 's3',
    number: 3,
    title: 'Repères de la clé de Sol',
    description: 'Sol (2e ligne, là où s’enroule la clé), Si (3e ligne), Do aigu (3e interligne), Mi et Sol aigus.',
    display: 'treble',
    notes: t('C4', 'G4', 'B4', 'C5', 'E5', 'G5'),
    tips: [
      'Sol : sur la 2e ligne, exactement là où s’enroule la clé de Sol.',
      'Si : sur la ligne du milieu (3e ligne).',
      'Do aigu : 3e interligne — une octave au-dessus du Do central.',
    ],
  },
  {
    id: 's4',
    number: 4,
    title: 'Toute la clé de Sol',
    description: 'Du Do central au La au-dessus de la portée.',
    display: 'treble',
    notes: t('C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'),
    tips: [
      'Lignes de bas en haut : Mi – Sol – Si – Ré – Fa (« Mi-Sol, Si Ré-Fa »).',
      'Interlignes de bas en haut : Fa – La – Do – Mi.',
      'Lisez par rapport aux repères (Do central, Sol, Do aigu) plutôt que de compter toutes les lignes.',
    ],
  },
  {
    id: 's5',
    number: 5,
    title: 'Clé de Fa : position de Do',
    description: 'Do3, Ré3, Mi3, Fa3 (4e ligne, entre les deux points de la clé) et Sol3.',
    display: 'bass',
    notes: b('C3', 'D3', 'E3', 'F3', 'G3'),
    tips: [
      'Fa : sur la 4e ligne, entre les deux points de la clé de Fa.',
      'Do3 : dans le 2e interligne, une octave sous le Do central.',
    ],
  },
  {
    id: 's6',
    number: 6,
    title: 'Repères de la clé de Fa',
    description: 'Sol grave (1re ligne), Do (2e interligne), Fa (4e ligne) et le Do central (au-dessus).',
    display: 'bass',
    notes: b('G2', 'C3', 'F3', 'A3', 'C4'),
    tips: [
      'Sol grave : sur la 1re ligne (en bas) de la clé de Fa.',
      'Le Do central se trouve au-dessus de la clé de Fa, sur une ligne supplémentaire.',
      'Fa (4e ligne) est le repère principal : la clé lui donne son nom.',
    ],
  },
  {
    id: 's7',
    number: 7,
    title: 'Toute la clé de Fa',
    description: 'Du Mi grave au Do central.',
    display: 'bass',
    notes: b('E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'),
    tips: [
      'Lignes de bas en haut : Sol – Si – Ré – Fa – La.',
      'Interlignes de bas en haut : La – Do – Mi – Sol.',
      'Astuce : une note en clé de Fa porte le même nom que la note placée une ligne plus haut en clé de Sol (1re ligne en Fa = Sol = 2e ligne en Sol).',
    ],
  },
  {
    id: 's8',
    number: 8,
    title: 'Grande portée : lecture alternée',
    description: 'Les deux clés mélangées, comme dans une vraie partition de piano.',
    display: 'grand',
    notes: [
      ...t('C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'),
      ...b('F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'),
    ],
    tips: [
      'Le Do central est partagé : sous la clé de Sol ou au-dessus de la clé de Fa, c’est la même touche.',
      'Regardez d’abord sur quelle portée se trouve la note, puis cherchez le repère le plus proche.',
    ],
  },
  {
    id: 's9',
    number: 9,
    title: 'Dièses et bémols',
    description: 'Les touches noires en clé de Sol. Sur le clavier, n’importe quel nom enharmonique est accepté.',
    display: 'treble',
    accidentals: true,
    notes: t('C#4', 'Eb4', 'F#4', 'G#4', 'Bb4', 'C#5', 'Db4', 'D#4', 'Gb4', 'Ab4', 'A#4', 'Eb5', 'F4', 'B4', 'E4'),
    tips: [
      'Dièse ♯ = touche juste à droite ; bémol ♭ = touche juste à gauche.',
      'L’altération se place devant la note, sur la même ligne ou le même interligne.',
      'Do♯ et Ré♭ sont la même touche noire : on dit qu’elles sont enharmoniques.',
    ],
  },
];

export const WEEKLY_TIP =
  'Astuce : 10 minutes par jour valent mieux qu’une heure le dimanche. Gardez votre série de jours active !';
