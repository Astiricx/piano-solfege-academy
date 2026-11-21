// Parcours de 10 leçons progressives pour adulte grand débutant.
import type { PieceSource } from '../types';
import { CLAIR_FULL, ODE_FULL } from './repertoire';

export interface Lesson {
  id: string;
  number: number;
  title: string;
  goal: string;
  /** Explications courtes, affichées avant les exercices (un paragraphe par entrée). */
  theory: string[];
  tips: string[];
  /** Illustration optionnelle affichée dans la leçon. */
  visual?: 'hands' | 'c-position' | 'thumb-under' | 'black-keys' | 'chords';
  exercises: PieceSource[];
}

const ODE_RH =
  'E4:q:3 E4:q:3 F4:q:4 G4:q:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:q:1 C4:q:1 D4:q:2 E4:q:3 | E4:q.:3 D4:8:2 D4:h:2 | ' +
  'E4:q:3 E4:q:3 F4:q:4 G4:q:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:q:1 C4:q:1 D4:q:2 E4:q:3 | D4:q.:2 C4:8:1 C4:h:1';

const CLAIR_P1 = 'C4:q:1 C4:q:1 C4:q:1 D4:q:2 | E4:h:3 D4:h:2 | C4:q:1 E4:q:3 D4:q:2 D4:q:2 | C4:w:1';

export const LESSONS: Lesson[] = [
  {
    id: 'l1',
    number: 1,
    title: 'Posture, doigts et position de Do',
    goal: 'S’installer correctement, numéroter ses doigts et trouver le Do central.',
    visual: 'hands',
    theory: [
      'Asseyez-vous face au milieu du clavier, le dos droit, les pieds à plat. Avant-bras à peu près horizontaux, coudes légèrement écartés du corps : vos mains doivent arriver « en descendant » légèrement vers les touches.',
      'Arrondissez les doigts comme si vous teniez une petite balle. On joue avec le bout du doigt (le pouce sur son côté), poignet souple, jamais crispé.',
      'Les doigts sont numérotés de 1 à 5 sur chaque main : 1 = pouce, 2 = index, 3 = majeur, 4 = annulaire, 5 = auriculaire. Ces chiffres au-dessus des notes s’appellent le doigté.',
      'Les touches noires sont groupées par 2 et par 3. Le Do est la touche blanche juste à gauche d’un groupe de 2 noires. Le Do central (Do4) est celui qui est au milieu du clavier.',
      'Position de Do (main droite) : pouce sur le Do central, puis un doigt par touche blanche : 1 Do, 2 Ré, 3 Mi, 4 Fa, 5 Sol.',
    ],
    tips: [
      'Jouez lentement : la précision d’abord, la vitesse viendra toute seule.',
      'Sans piano ? Utilisez le clavier d’ordinateur : la rangée du haut (touches Q/A, W/Z, E…) correspond à l’octave du Do central.',
    ],
    exercises: [
      {
        id: 'l1-e1',
        title: 'Le pouce sur le Do central',
        description: 'Une seule note, différentes durées : ronde (4 temps), blanches (2), noires (1).',
        level: 1,
        tempo: 60,
        right: 'C4:w:1 | C4:h:1 C4:h:1 | C4:q:1 C4:q:1 C4:h:1 | C4:w:1',
      },
      {
        id: 'l1-e2',
        title: 'Les 5 doigts qui montent et descendent',
        level: 1,
        tempo: 66,
        right: 'C4:q:1 D4:q:2 E4:q:3 F4:q:4 | G4:w:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:w:1',
      },
      {
        id: 'l1-e3',
        title: 'Doigts voisins',
        description: 'Alternez deux doigts voisins sans lever la main.',
        level: 1,
        tempo: 72,
        right:
          'C4:q:1 D4:q:2 C4:q:1 D4:q:2 | E4:q:3 D4:q:2 E4:q:3 D4:q:2 | E4:q:3 F4:q:4 E4:q:3 F4:q:4 | G4:q:5 F4:q:4 G4:h:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:w:1',
      },
    ],
  },
  {
    id: 'l2',
    number: 2,
    title: 'Premières mélodies à 5 notes',
    goal: 'Lire et jouer de vraies mélodies en clé de Sol sans bouger la main.',
    visual: 'c-position',
    theory: [
      'La clé de Sol s’enroule autour de la 2e ligne de la portée : la note posée sur cette ligne est un Sol (Sol4).',
      'Le Do central se place sous la portée, sur une petite ligne supplémentaire. Ré est juste en dessous de la 1re ligne, Mi sur la 1re ligne, Fa dans le 1er interligne, Sol sur la 2e ligne.',
      'Quand la note monte sur la portée, elle monte sur le clavier (vers la droite). Lisez la direction (monte, descend, reste) autant que le nom des notes.',
    ],
    tips: ['Utilisez le mode Attente : le curseur vous attend, sans pression de tempo.', 'Masquez progressivement le nom des notes, puis les doigtés.'],
    exercises: [
      {
        id: 'l2-e1',
        title: 'Au clair de la lune (début)',
        composer: 'Traditionnel',
        level: 1,
        tempo: 80,
        right: [CLAIR_P1, CLAIR_P1].join(' | '),
      },
      {
        id: 'l2-e2',
        title: 'Ode à la joie (main droite)',
        composer: 'Beethoven',
        description: 'Attention à la noire pointée suivie d’une croche (mesures 4 et 8).',
        level: 2,
        tempo: 88,
        right: ODE_RH,
      },
      {
        id: 'l2-e3',
        title: 'Frère Jacques (version 5 notes)',
        composer: 'Traditionnel, adapté',
        level: 2,
        tempo: 90,
        right:
          'C4:q:1 D4:q:2 E4:q:3 C4:q:1 | C4:q:1 D4:q:2 E4:q:3 C4:q:1 | E4:q:3 F4:q:4 G4:h:5 | E4:q:3 F4:q:4 G4:h:5 | ' +
          'G4:8:5 G4:8:5 F4:8:4 E4:8:3 D4:q:2 C4:q:1 | G4:8:5 G4:8:5 F4:8:4 E4:8:3 D4:q:2 C4:q:1 | C4:q:1 G4:q:5 C4:h:1 | C4:q:1 G4:q:5 C4:h:1',
      },
    ],
  },
  {
    id: 'l3',
    number: 3,
    title: 'La main gauche et la clé de Fa',
    goal: 'Lire en clé de Fa et jouer en position de Do à la main gauche.',
    visual: 'c-position',
    theory: [
      'La clé de Fa a deux points qui encadrent la 4e ligne : la note sur cette ligne est un Fa (Fa3), juste sous le Do central.',
      'Position de Do main gauche : auriculaire (5) sur le Do3 (une octave sous le Do central), puis 4 Ré, 3 Mi, 2 Fa, 1 Sol. Le pouce est donc sur Sol.',
      'Attention : à la main gauche, les doigtés « descendent » quand la mélodie monte (5-4-3-2-1).',
    ],
    tips: ['Repère : en clé de Fa, Do3 est dans le 2e interligne, Sol3 dans le 4e interligne (en haut).'],
    exercises: [
      {
        id: 'l3-e1',
        title: 'Les doigts 5 et 1',
        level: 1,
        tempo: 60,
        left: 'C3:w:5 | C3:h:5 C3:h:5 | G3:w:1 | G3:h:1 G3:h:1 | C3:q:5 E3:q:3 G3:h:1 | G3:q:1 E3:q:3 C3:h:5',
      },
      {
        id: 'l3-e2',
        title: '5 doigts de la main gauche',
        level: 1,
        tempo: 66,
        left: 'C3:q:5 D3:q:4 E3:q:3 F3:q:2 | G3:w:1 | G3:q:1 F3:q:2 E3:q:3 D3:q:4 | C3:w:5',
      },
      {
        id: 'l3-e3',
        title: 'Ode à la joie (main gauche)',
        level: 2,
        tempo: 80,
        left:
          'E3:q:3 E3:q:3 F3:q:2 G3:q:1 | G3:q:1 F3:q:2 E3:q:3 D3:q:4 | C3:q:5 C3:q:5 D3:q:4 E3:q:3 | E3:q.:3 D3:8:4 D3:h:4 | ' +
          'E3:q:3 E3:q:3 F3:q:2 G3:q:1 | G3:q:1 F3:q:2 E3:q:3 D3:q:4 | C3:q:5 C3:q:5 D3:q:4 E3:q:3 | D3:q.:4 C3:8:5 C3:h:5',
      },
    ],
  },
  {
    id: 'l4',
    number: 4,
    title: 'Mains alternées',
    goal: 'Passer la mélodie d’une main à l’autre en lisant la grande portée.',
    theory: [
      'La grande portée réunit la clé de Sol (main droite, en haut) et la clé de Fa (main gauche, en bas), reliées par une accolade. Les deux se lisent en même temps, de gauche à droite.',
      'Ici, une seule main joue à la fois : pendant que l’une joue, l’autre se prépare au-dessus de ses touches.',
      'Le silence (pause) écrit sur la portée de la main qui ne joue pas indique qu’elle se repose.',
    ],
    tips: ['Placez les deux mains en position de Do avant de commencer.'],
    exercises: [
      {
        id: 'l4-e1',
        title: 'Questions – réponses',
        level: 2,
        tempo: 72,
        right: 'C4:q:1 D4:q:2 E4:h:3 | r:w | E4:q:3 F4:q:4 G4:h:5 | r:w | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | r:w | C4:w:1 | r:w',
        left: 'r:w | C3:q:5 D3:q:4 E3:h:3 | r:w | E3:q:3 F3:q:2 G3:h:1 | r:w | G3:q:1 F3:q:2 E3:q:3 D3:q:4 | r:w | C3:w:5',
      },
      {
        id: 'l4-e2',
        title: 'Au clair de la lune (mains alternées)',
        description: 'La main gauche chante « Ma chandelle est morte » en position de Sol (pouce sur Ré4).',
        level: 2,
        tempo: 80,
        right: [CLAIR_P1, 'r:w | r:w | r:w | r:w', CLAIR_P1].join(' | '),
        left: ['r:w | r:w | r:w | r:w', 'D4:q:1 D4:q:1 D4:q:1 D4:q:1 | A3:h:4 A3:h:4 | D4:q:1 C4:q:2 B3:q:3 A3:q:4 | G3:w:5', 'r:w | r:w | r:w | r:w'].join(' | '),
      },
    ],
  },
  {
    id: 'l5',
    number: 5,
    title: 'Deux mains ensemble',
    goal: 'Tenir une note longue à gauche pendant que la droite joue la mélodie.',
    theory: [
      'Jouer à deux mains, c’est d’abord synchroniser les débuts de notes : quand deux notes sont alignées verticalement, elles se jouent en même temps.',
      'La main gauche tient ici des rondes et des blanches : posez-la, puis laissez-la immobile en comptant pendant que la droite continue.',
      'Méthode : chaque main seule d’abord (sélecteur de mains), puis les deux mains très lentement (tempo 50–60 %).',
    ],
    tips: ['En mode Attente, la note suivante n’est validée que lorsque toutes les notes alignées sont jouées.'],
    exercises: [
      {
        id: 'l5-e1',
        title: 'Bourdon de Do',
        level: 2,
        tempo: 66,
        right: 'C4:q:1 D4:q:2 E4:q:3 F4:q:4 | G4:h:5 G4:h:5 | G4:q:5 F4:q:4 E4:q:3 D4:q:2 | C4:w:1',
        left: 'C3:w:5 | C3:w:5 | C3:w:5 | C3:w:5',
      },
      {
        id: 'l5-e2',
        title: 'Au clair de la lune – basse en blanches',
        level: 3,
        tempo: 76,
        right: [CLAIR_P1, CLAIR_P1].join(' | '),
        left: 'C3:w:5 | C3:h:5 G3:h:1 | C3:h:5 G3:h:1 | C3:w:5 | C3:w:5 | C3:h:5 G3:h:1 | C3:h:5 G3:h:1 | C3:w:5',
      },
      {
        id: 'l5-e3',
        title: 'Ode à la joie – basse en rondes',
        level: 3,
        tempo: 80,
        right: ODE_RH,
        left: 'C3:w:5 | G3:w:1 | C3:w:5 | G3:w:1 | C3:w:5 | G3:w:1 | C3:w:5 | G3:h:1 C3:h:5',
      },
    ],
  },
  {
    id: 'l6',
    number: 6,
    title: 'Passage du pouce et gamme de Do majeur',
    goal: 'Dépasser 5 notes grâce au passage du pouce.',
    visual: 'thumb-under',
    theory: [
      'Pour jouer plus de 5 notes sans sauter, on fait glisser le pouce sous la main (en montant à droite) ou on passe le 3e doigt par-dessus le pouce (en descendant).',
      'Gamme de Do majeur, main droite : Do1 Ré2 Mi3, le pouce passe sous le 3 → Fa1 Sol2 La3 Si4 Do5. En redescendant : Do5 Si4 La3 Sol2 Fa1, le 3 passe par-dessus → Mi3 Ré2 Do1.',
      'Main gauche (en montant) : Do5 Ré4 Mi3 Fa2 Sol1, le 3 passe par-dessus le pouce → La3 Si2 Do1.',
    ],
    tips: ['Le coude reste souple et accompagne le mouvement ; le poignet ne se tord pas.', 'Préparez le pouce tôt : il glisse sous la main pendant que le 3e doigt joue.'],
    exercises: [
      {
        id: 'l6-e1',
        title: 'Préparation : le pouce glisse',
        level: 3,
        tempo: 60,
        right: 'C4:q:1 D4:q:2 E4:q:3 F4:q:1 | E4:q:3 D4:q:2 C4:h:1 | C4:q:1 D4:q:2 E4:q:3 F4:q:1 | G4:q:2 A4:q:3 G4:h:2 | G4:q:2 F4:q:1 E4:q:3 D4:q:2 | C4:w:1',
      },
      {
        id: 'l6-e2',
        title: 'Gamme de Do majeur (main droite)',
        level: 3,
        tempo: 66,
        right: 'C4:q:1 D4:q:2 E4:q:3 F4:q:1 | G4:q:2 A4:q:3 B4:q:4 C5:q:5 | C5:q:5 B4:q:4 A4:q:3 G4:q:2 | F4:q:1 E4:q:3 D4:q:2 C4:q:1 | C4:w:1',
      },
      {
        id: 'l6-e3',
        title: 'Gamme de Do majeur (main gauche)',
        level: 3,
        tempo: 66,
        left: 'C3:q:5 D3:q:4 E3:q:3 F3:q:2 | G3:q:1 A3:q:3 B3:q:2 C4:q:1 | C4:q:1 B3:q:2 A3:q:3 G3:q:1 | F3:q:2 E3:q:3 D3:q:4 C3:q:5 | C3:w:5',
      },
    ],
  },
  {
    id: 'l7',
    number: 7,
    title: 'Dièses, bémols et touches noires',
    goal: 'Comprendre et jouer les altérations.',
    visual: 'black-keys',
    theory: [
      'Le dièse (♯) hausse la note d’un demi-ton : on joue la touche juste à droite (souvent une noire). Le bémol (♭) la baisse d’un demi-ton : touche juste à gauche.',
      'Une altération écrite devant une note vaut pour toute la mesure, sur la même ligne ou le même interligne. Le bécarre (♮) annule l’altération.',
      'Une même touche noire a deux noms : Fa♯ = Sol♭, Do♯ = Ré♭… On parle de notes enharmoniques.',
      'Les altérations placées au début de chaque ligne forment l’armure : elles s’appliquent à tout le morceau.',
    ],
    tips: ['Sur une touche noire, avancez légèrement la main vers le fond du clavier.'],
    exercises: [
      {
        id: 'l7-e1',
        title: 'Position de Ré : le Fa dièse',
        level: 3,
        tempo: 66,
        right: 'D4:q:1 E4:q:2 F#4:q:3 G4:q:4 | A4:w:5 | A4:q:5 G4:q:4 F#4:q:3 E4:q:2 | D4:w:1 | D4:q:1 F#4:q:3 A4:h:5 | A4:q:5 F#4:q:3 D4:h:1',
      },
      {
        id: 'l7-e2',
        title: 'Position de Fa : le Si bémol',
        level: 3,
        tempo: 66,
        right: 'F4:q:1 G4:q:2 A4:q:3 Bb4:q:4 | C5:w:5 | C5:q:5 Bb4:q:4 A4:q:3 G4:q:2 | F4:w:1',
      },
      {
        id: 'l7-e3',
        title: 'Majeur et mineur : le Mi bémol',
        description: 'Le même motif en Do majeur puis en Do mineur : écoutez le changement de couleur.',
        level: 3,
        tempo: 66,
        right: 'C4:q:1 D4:q:2 E4:q:3 F4:q:4 | G4:w:5 | C4:q:1 D4:q:2 Eb4:q:3 F4:q:4 | G4:w:5 | G4:q:5 F4:q:4 Eb4:q:3 D4:q:2 | C4:w:1',
      },
    ],
  },
  {
    id: 'l8',
    number: 8,
    title: 'Premiers accords : Do, Fa, Sol, La mineur',
    goal: 'Plaquer les 4 accords les plus utiles de la musique populaire.',
    visual: 'chords',
    theory: [
      'Un accord de 3 sons (triade) s’obtient en empilant une note sur deux : fondamentale, tierce, quinte. Do majeur = Do-Mi-Sol, Fa majeur = Fa-La-Do, Sol majeur = Sol-Si-Ré, La mineur = La-Do-Mi.',
      'Main droite en position fondamentale : doigts 1-3-5. Les trois notes doivent sonner exactement ensemble.',
      'Main gauche : pour éviter les grands déplacements, on utilise des renversements (mêmes notes, dans un autre ordre) : Do = Do-Mi-Sol, Fa = Do-Fa-La, Sol = Si-Ré-Sol, La m = Do-Mi-La.',
    ],
    tips: ['Préparez la forme de l’accord au-dessus des touches avant de l’enfoncer.', 'En mode Attente, l’ordre des notes d’un accord n’a pas d’importance.'],
    exercises: [
      {
        id: 'l8-e1',
        title: 'Accords plaqués (main droite)',
        level: 3,
        tempo: 60,
        right: 'C4+E4+G4:w:1+3+5 | F4+A4+C5:w:1+3+5 | G4+B4+D5:w:1+3+5 | A4+C5+E5:w:1+3+5 | C4+E4+G4:w:1+3+5',
      },
      {
        id: 'l8-e2',
        title: 'Accords en rythme',
        level: 3,
        tempo: 66,
        right:
          'C4+E4+G4:h:1+3+5 C4+E4+G4:h:1+3+5 | F4+A4+C5:h:1+3+5 F4+A4+C5:h:1+3+5 | G4+B4+D5:q:1+3+5 G4+B4+D5:q:1+3+5 G4+B4+D5:h:1+3+5 | C4+E4+G4:w:1+3+5',
      },
      {
        id: 'l8-e3',
        title: 'Accords proches (main gauche)',
        level: 3,
        tempo: 60,
        left: 'C3+E3+G3:w:5+3+1 | C3+F3+A3:w:5+2+1 | B2+D3+G3:w:5+3+1 | C3+E3+A3:w:5+3+1 | C3+E3+G3:w:5+3+1',
      },
    ],
  },
  {
    id: 'l9',
    number: 9,
    title: 'Accompagnement en accords + mélodie',
    goal: 'Mélodie à droite, accords plaqués à gauche.',
    theory: [
      'C’est la formule de base de l’accompagnement : la main gauche plaque l’harmonie sur le premier temps, la main droite chante.',
      'Commencez par jouer la main gauche seule en disant le nom des accords, puis ajoutez la mélodie très lentement.',
      'Astuce : l’option « Jouer l’autre main » du lecteur fait entendre la main que vous ne travaillez pas.',
    ],
    tips: ['Si un accord vous ralentit, isolez les deux mesures avec la boucle A-B.'],
    exercises: [
      {
        id: 'l9-e1',
        title: 'Ode à la joie + accords',
        level: 4,
        tempo: 80,
        right: ODE_RH,
        left:
          'C3+E3+G3:w:5+3+1 | B2+D3+G3:w:5+3+1 | C3+E3+G3:w:5+3+1 | B2+D3+G3:w:5+3+1 | C3+E3+G3:w:5+3+1 | B2+D3+G3:w:5+3+1 | C3+E3+G3:w:5+3+1 | B2+D3+G3:h:5+3+1 C3+E3+G3:h:5+3+1',
      },
      {
        id: 'l9-e2',
        title: 'Au clair de la lune + accords',
        level: 4,
        tempo: 76,
        right: [CLAIR_P1, CLAIR_P1].join(' | '),
        left:
          'C3+E3+G3:w:5+3+1 | C3+E3+G3:h:5+3+1 B2+D3+G3:h:5+3+1 | C3+E3+G3:h:5+3+1 B2+D3+G3:h:5+3+1 | C3+E3+G3:w:5+3+1 | ' +
          'C3+E3+G3:w:5+3+1 | C3+E3+G3:h:5+3+1 B2+D3+G3:h:5+3+1 | C3+E3+G3:h:5+3+1 B2+D3+G3:h:5+3+1 | C3+E3+G3:w:5+3+1',
      },
      {
        id: 'l9-e3',
        title: 'Progression pop : Do – Sol – La m – Fa',
        description: 'La suite d’accords de milliers de chansons.',
        level: 4,
        tempo: 72,
        right:
          'E4:h:3 G4:h:5 | D4:h:2 G4:h:5 | C4:h:1 E4:h:3 | C4:h:1 F4:h:4 | ' +
          'G4:q:5 F4:q:4 E4:h:3 | D4:q:2 E4:q:3 D4:h:2 | C4:q:1 D4:q:2 E4:h:3 | F4:q:4 E4:q:3 D4:h:2 | C4:w:1',
        left:
          'C3+E3+G3:w:5+3+1 | B2+D3+G3:w:5+3+1 | C3+E3+A3:w:5+3+1 | C3+F3+A3:w:5+2+1 | ' +
          'C3+E3+G3:w:5+3+1 | B2+D3+G3:w:5+3+1 | C3+E3+A3:w:5+3+1 | C3+F3+A3:w:5+2+1 | C3+E3+G3:w:5+3+1',
      },
    ],
  },
  {
    id: 'l10',
    number: 10,
    title: 'Morceau final de validation',
    goal: 'Jouer deux morceaux complets à deux mains, en tempo.',
    theory: [
      'Bravo, vous avez tous les outils ! Pour valider le parcours, jouez l’Ode à la joie et Au clair de la lune en entier, à deux mains.',
      'Méthode conseillée : 1) mode Attente, mains séparées ; 2) mode Attente, deux mains ; 3) mode Rythme à 60 % ; 4) augmentez progressivement jusqu’à 100 %.',
      'Validation : au moins 80 % de réussite sur chaque morceau.',
    ],
    tips: ['Travaillez les passages difficiles en boucle A-B plutôt que de toujours recommencer au début.'],
    exercises: [ODE_FULL, CLAIR_FULL],
  },
];

export function findLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}
