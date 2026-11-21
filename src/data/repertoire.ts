// Répertoire libre de droits (mélodies traditionnelles ou du domaine public),
// arrangées pour grand débutant. Notation : voir src/lib/notation.ts
import type { PieceSource } from '../types';

const ODE_A = 'E4:q:3 E4:q:3 F4:q:4 G4:q:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:q:1 C4:q:1 D4:q:2 E4:q:3';
const ODE_END1 = 'E4:q.:3 D4:8:2 D4:h:2';
const ODE_END2 = 'D4:q.:2 C4:8:1 C4:h:1';
const ODE_B =
  'D4:q:2 D4:q:2 E4:q:3 C4:q:1 | D4:q:2 E4:8:3 F4:8:4 E4:q:3 C4:q:1 | D4:q:2 E4:8:3 F4:8:4 E4:q:3 D4:q:2 | C4:q:1 D4:q:2 G3:h:1';

const C_CHORD = 'C3+E3+G3';
const G_CHORD = 'B2+D3+G3';

const CLAIR_P1 = 'C4:q:1 C4:q:1 C4:q:1 D4:q:2 | E4:h:3 D4:h:2 | C4:q:1 E4:q:3 D4:q:2 D4:q:2 | C4:w:1';
const CLAIR_BASS = 'C3:w:5 | C3:h:5 G3:h:1 | C3:h:5 G3:h:1 | C3:w:5';
const CLAIR_P3_LH = 'D4:q:1 D4:q:1 D4:q:1 D4:q:1 | A3:h:4 A3:h:4 | D4:q:1 C4:q:2 B3:q:3 A3:q:4 | G3:w:5';
const RESTS4 = 'r:w | r:w | r:w | r:w';

export const ODE_FULL: PieceSource = {
  id: 'ode-joie',
  title: 'Ode à la joie',
  composer: 'L. van Beethoven (arr. débutant)',
  description:
    'Le grand classique de la 9e symphonie. Main droite en position de Do, accords plaqués à la main gauche. Mesure 12 : le pouce descend sur le Sol grave puis revient.',
  level: 4,
  tempo: 92,
  right: [ODE_A, ODE_END1, ODE_A, ODE_END2, ODE_B, ODE_A, ODE_END2].join(' | '),
  left: [
    `${C_CHORD}:w:5+3+1`,
    `${G_CHORD}:w:5+3+1`,
    `${C_CHORD}:w:5+3+1`,
    `${G_CHORD}:w:5+3+1`,
    `${C_CHORD}:w:5+3+1`,
    `${G_CHORD}:w:5+3+1`,
    `${C_CHORD}:w:5+3+1`,
    `${G_CHORD}:h:5+3+1 ${C_CHORD}:h:5+3+1`,
    `${G_CHORD}:w:5+3+1`,
    `${G_CHORD}:h:5+3+1 ${C_CHORD}:h:5+3+1`,
    `${G_CHORD}:w:5+3+1`,
    `${C_CHORD}:h:5+3+1 B2+D3:h:5+3`,
    `${C_CHORD}:w:5+3+1`,
    `${G_CHORD}:w:5+3+1`,
    `${C_CHORD}:w:5+3+1`,
    `${G_CHORD}:h:5+3+1 ${C_CHORD}:h:5+3+1`,
  ].join(' | '),
};

export const CLAIR_FULL: PieceSource = {
  id: 'clair-lune',
  title: 'Au clair de la lune',
  composer: 'Traditionnel français',
  description:
    'Version complète à deux mains : la main gauche accompagne, puis reprend la mélodie au 3e couplet (« Ma chandelle est morte »).',
  level: 2,
  tempo: 84,
  right: [CLAIR_P1, CLAIR_P1, RESTS4, CLAIR_P1].join(' | '),
  left: [CLAIR_BASS, CLAIR_BASS, CLAIR_P3_LH, CLAIR_BASS].join(' | '),
};

export const REPERTOIRE: PieceSource[] = [
  {
    id: 'frere-jacques',
    title: 'Frère Jacques',
    composer: 'Traditionnel',
    description: 'Mélodie à la main droite sur un bourdon de quinte (Do–Sol) à la main gauche.',
    level: 1,
    tempo: 96,
    right:
      'C4:q:1 D4:q:2 E4:q:3 C4:q:1 | C4:q:1 D4:q:2 E4:q:3 C4:q:1 | E4:q:3 F4:q:4 G4:h:5 | E4:q:3 F4:q:4 G4:h:5 | ' +
      'G4:8:4 A4:8:5 G4:8:4 F4:8:3 E4:q:2 C4:q:1 | G4:8:4 A4:8:5 G4:8:4 F4:8:3 E4:q:2 C4:q:1 | C4:q:1 G3:q:1 C4:h:1 | C4:q:1 G3:q:1 C4:h:1',
    left: 'C3+G3:w:5+1 | C3+G3:w:5+1 | C3+G3:w:5+1 | C3+G3:w:5+1 | C3+G3:w:5+1 | C3+G3:w:5+1 | C3:w:5 | C3:w:5',
  },
  {
    id: 'jingle-bells',
    title: 'Vive le vent (Jingle Bells)',
    composer: 'J. Pierpont, 1857',
    description: 'Le refrain tient entièrement dans la position de Do : idéal pour gagner en aisance.',
    level: 2,
    tempo: 100,
    right:
      'E4:q:3 E4:q:3 E4:h:3 | E4:q:3 E4:q:3 E4:h:3 | E4:q:3 G4:q:5 C4:q.:1 D4:8:2 | E4:w:3 | ' +
      'F4:q:4 F4:q:4 F4:q.:4 F4:8:4 | F4:q:4 E4:q:3 E4:q:3 E4:8:3 E4:8:3 | E4:q:3 D4:q:2 D4:q:2 E4:q:3 | D4:h:2 G4:h:5 | ' +
      'E4:q:3 E4:q:3 E4:h:3 | E4:q:3 E4:q:3 E4:h:3 | E4:q:3 G4:q:5 C4:q.:1 D4:8:2 | E4:w:3 | ' +
      'F4:q:4 F4:q:4 F4:q:4 F4:q:4 | F4:q:4 E4:q:3 E4:q:3 E4:8:3 E4:8:3 | G4:q:5 G4:q:5 F4:q:4 D4:q:2 | C4:w:1',
    left:
      'C3:w:5 | C3:w:5 | C3:w:5 | C3:w:5 | F3:w:2 | C3:w:5 | D3:w:4 | G3:w:1 | ' +
      'C3:w:5 | C3:w:5 | C3:w:5 | C3:w:5 | F3:w:2 | C3:w:5 | G3:w:1 | C3:w:5',
  },
  CLAIR_FULL,
  {
    id: 'ah-vous-dirai-je',
    title: 'Ah ! vous dirai-je, maman',
    composer: 'Traditionnel (thème varié par Mozart)',
    description: 'Basse en blanches à la main gauche ; attention au La qui sort de la position.',
    level: 3,
    tempo: 96,
    right:
      'C4:q:1 C4:q:1 G4:q:4 G4:q:4 | A4:q:5 A4:q:5 G4:h:4 | F4:q:4 F4:q:4 E4:q:3 E4:q:3 | D4:q:2 D4:q:2 C4:h:1 | ' +
      'G4:q:5 G4:q:5 F4:q:4 F4:q:4 | E4:q:3 E4:q:3 D4:h:2 | G4:q:5 G4:q:5 F4:q:4 F4:q:4 | E4:q:3 E4:q:3 D4:h:2 | ' +
      'C4:q:1 C4:q:1 G4:q:4 G4:q:4 | A4:q:5 A4:q:5 G4:h:4 | F4:q:4 F4:q:4 E4:q:3 E4:q:3 | D4:q:2 D4:q:2 C4:h:1',
    left:
      'C3:w:5 | F3:h:2 C3:h:5 | F3:h:2 C3:h:5 | G3:h:1 C3:h:5 | ' +
      'C3:h:5 G3:h:1 | C3:h:5 G3:h:1 | C3:h:5 G3:h:1 | C3:h:5 G3:h:1 | ' +
      'C3:w:5 | F3:h:2 C3:h:5 | F3:h:2 C3:h:5 | G3:h:1 C3:h:5',
  },
  ODE_FULL,
  {
    id: 'saints',
    title: 'When the Saints Go Marching In',
    composer: 'Spiritual traditionnel',
    description: 'Chaque phrase commence après un soupir : comptez « 1 » dans votre tête avant de jouer.',
    level: 4,
    tempo: 104,
    right:
      'r:q C4:q:1 E4:q:3 F4:q:4 | G4:w:5 | r:q C4:q:1 E4:q:3 F4:q:4 | G4:w:5 | ' +
      'r:q C4:q:1 E4:q:3 F4:q:4 | G4:h:5 E4:h:3 | C4:h:1 E4:h:3 | D4:w:2 | ' +
      'r:q E4:q:3 E4:q:3 D4:q:2 | C4:h.:1 C4:q:1 | E4:h:3 G4:q:5 G4:q:5 | F4:w:4 | ' +
      'r:q C4:q:1 E4:q:3 F4:q:4 | G4:h:5 E4:h:3 | C4:h:1 D4:h:2 | C4:w:1',
    left:
      'C3:w:5 | C3+G3:w:5+1 | C3:w:5 | C3+G3:w:5+1 | C3:w:5 | C3+G3:w:5+1 | C3:w:5 | G3:w:1 | ' +
      'C3:w:5 | C3+G3:w:5+1 | C3+G3:w:5+1 | F3:w:2 | C3:w:5 | C3+G3:w:5+1 | C3:h:5 G3:h:1 | C3+G3:w:5+1',
  },
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    composer: 'J. Newton / mélodie traditionnelle',
    description: 'Mesure à 3/4 en Fa majeur (un bémol à l’armure, jamais utilisé dans la mélodie !).',
    level: 5,
    tempo: 84,
    timeSig: [3, 4],
    keySig: 'F',
    right:
      'r:h C4:q:1 | F4:h:2 A4:8:4 F4:8:2 | A4:h:4 G4:q:3 | F4:h:2 D4:q:1 | C4:h:1 C4:q:1 | ' +
      'F4:h:2 A4:8:4 F4:8:2 | A4:h:4 G4:q:3 | C5:h:5 A4:q:4 | C5:h:5 A4:8:4 F4:8:2 | A4:h:4 G4:q:3 | ' +
      'F4:h:2 D4:q:1 | C4:h:1 C4:q:1 | F4:h:2 A4:8:4 F4:8:2 | A4:h:4 G4:q:3 | F4:h.:2',
    left:
      'r:h. | F3:h.:1 | F3:h.:1 | Bb2:h.:5 | F3:h.:1 | F3:h.:1 | C3:h.:4 | C3:h.:4 | ' +
      'F3:h.:1 | F3:h.:1 | Bb2:h.:5 | F3:h.:1 | F3:h.:1 | C3:h.:4 | F3:h.:1',
  },
  {
    id: 'menuet-sol',
    title: 'Menuet en Sol (simplifié)',
    composer: 'C. Petzold (attr. J.-S. Bach), BWV Anh. 114',
    description: 'Le défi final du répertoire : croches en 3/4, Fa dièse à l’armure, main droite mobile.',
    level: 6,
    tempo: 96,
    timeSig: [3, 4],
    keySig: 'G',
    right:
      'D5:q:5 G4:8:1 A4:8:2 B4:8:3 C5:8:4 | D5:q:5 G4:q:1 G4:q:1 | E5:q:5 C5:8:1 D5:8:2 E5:8:3 F#5:8:4 | G5:q:5 G4:q:1 G4:q:1 | ' +
      'C5:q:4 D5:8:5 C5:8:4 B4:8:3 A4:8:2 | B4:q:3 C5:8:4 B4:8:3 A4:8:2 G4:8:1 | F#4:q:2 G4:8:1 A4:8:2 B4:8:3 G4:8:1 | A4:h.:2 | ' +
      'D5:q:5 G4:8:1 A4:8:2 B4:8:3 C5:8:4 | D5:q:5 G4:q:1 G4:q:1 | E5:q:5 C5:8:1 D5:8:2 E5:8:3 F#5:8:4 | G5:q:5 G4:q:1 G4:q:1 | ' +
      'C5:q:4 D5:8:5 C5:8:4 B4:8:3 A4:8:2 | B4:q:3 C5:8:4 B4:8:3 A4:8:2 G4:8:1 | A4:q:3 B4:8:4 A4:8:3 G4:8:2 F#4:8:1 | G4:h.:2',
    left:
      'G3:h.:3 | B3:h.:1 | C4:h.:1 | B3:h.:1 | A3:h.:2 | G3:h.:3 | D3:h.:5 | D3:h.:5 | ' +
      'G3:h.:3 | B3:h.:1 | C4:h.:1 | B3:h.:1 | A3:h.:2 | G3:h.:3 | D3:h.:5 | G3:h.:3',
  },
];
