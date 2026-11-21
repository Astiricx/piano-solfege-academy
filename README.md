# 🎹 Piano Solfège Academy

Application web éducative pour apprendre **le solfège, le rythme puis le piano**, pensée pour un adulte grand débutant :
on commence tout de suite au clavier d’ordinateur, et on branche le piano numérique (USB-MIDI) ou on active le micro le jour où il arrive.

**Application en ligne :** https://astiricx.github.io/piano-solfege-academy/

## Les 4 modules

| Module | Contenu |
| --- | --- |
| **1. Atelier solfège** (sans piano) | 9 niveaux par notes repères (Do central → clé de Sol → clé de Fa → grande portée → altérations). Modes *Zen*, *Chrono* et *Défi 60 s*, temps de réaction par note, entraînement ciblé sur les notes faibles. Oreille : monte/descend, intervalles, retrouver la note. |
| **2. Atelier rythme** | 8 exercices (rondes, blanches, noires, croches, soupirs, 4/4 et 3/4), décompte, métronome, piste de défilement, feedback « Trop tôt / Parfait / Trop tard », compensation de latence, métronome libre. |
| **3. Cours de piano** | 10 leçons progressives (posture et doigts, position de Do, clé de Fa, mains alternées, deux mains, passage du pouce, altérations, accords, accompagnement, morceau final). Explications, illustrations, 2–3 exercices chacune. |
| **4. Pratique & répertoire** | 8 morceaux libres de droits. Lecteur intelligent : **mode Attente**, **mode Rythme** (décompte + notation notes/rythme), **mode Écoute**, choix des mains, tempo 40–120 %, **boucle A-B**, noms de notes et doigtés masquables, accompagnement automatique de l’autre main, zoom. |

## Entrées

- **Clavier d’ordinateur** (positions physiques, donc AZERTY/QWERTY) : rangée du bas = Do3, rangée du haut = Do4 (Do central), chiffres = touches noires.
- **Piano virtuel** de 2 à 3 octaves (souris / tactile) en bas de l’écran.
- **Piano USB-MIDI** via la Web MIDI API (Chrome, Edge), détection automatique et indicateur de statut.
- **Microphone** : détection de hauteur temps réel (`pitchy`, algorithme McLeod) avec tolérance ±35 cents, VU-mètre, note détectée, seuils de volume/clarté, fenêtre de confirmation (60 ms par défaut), anti-larsen (l’appli ignore ce qu’elle joue elle-même).

## Stack

React 18 + TypeScript + Vite · Tailwind CSS (thème clair/sombre) · VexFlow 4 (gravure SVG) · Tone.js (piano Salamander échantillonné, métronome) · Tonal (théorie) · pitchy (détection de hauteur).

Progression, scores et série quotidienne dans `localStorage`, avec export/import JSON (page *Réglages*).

## Développement

```bash
npm install
npm run dev      # serveur local
npm run build    # vérification TypeScript + build de production dans dist/
```

## Structure

```
src/
  audio/AudioEngine.ts        moteur Tone.js (piano, métronome, planificateur)
  input/                      clavier PC, Web MIDI, micro (pitchy), bus d'événements React
  score/                      rendu VexFlow (grande portée, surbrillance, curseur)
  practice/engine.ts          logique Attente / Rythme / Écoute, boucle A-B
  lib/notation.ts             parseur de la notation compacte des partitions
  data/                       niveaux de solfège, rythmes, 10 leçons, répertoire
  modules/                    écrans : tableau de bord, solfège, rythme, leçons, pratique, réglages
```

### Ajouter un morceau

Les partitions sont écrites dans une notation compacte (voir `src/lib/notation.ts`) :

```ts
right: 'E4:q:3 E4:q:3 F4:q:4 G4:q:5 | G4:h:5 G4:h:5',   // hauteur:durée:doigté, mesures séparées par |
left:  'C3+E3+G3:w:5+3+1 | B2+D3+G3:w:5+3+1',          // accords avec +
```

Durées : `w` ronde, `h` blanche, `q` noire, `8` croche, `16` double ; `.` pour pointer ; `r` pour un silence.

## Déploiement

Le workflow `.github/workflows/deploy.yml` compile et publie `dist/` sur GitHub Pages à chaque push sur `main`
(Settings → Pages → Source : **GitHub Actions**).
