// Correspondance clavier d'ordinateur -> notes, basée sur la position physique des touches
// (event.code), donc valable en AZERTY, QWERTY, QWERTZ…

/** Décalage en demi-tons depuis Do3 (MIDI 48). */
export const KEY_CODE_TO_OFFSET: Record<string, number> = {
  // Rangée du bas : octave de Do3
  KeyZ: 0,
  KeyS: 1,
  KeyX: 2,
  KeyD: 3,
  KeyC: 4,
  KeyV: 5,
  KeyG: 6,
  KeyB: 7,
  KeyH: 8,
  KeyN: 9,
  KeyJ: 10,
  KeyM: 11,
  Comma: 12,
  KeyL: 13,
  Period: 14,
  Semicolon: 15,
  Slash: 16,
  // Rangée du haut : octave du Do central (Do4)
  KeyQ: 12,
  Digit2: 13,
  KeyW: 14,
  Digit3: 15,
  KeyE: 16,
  KeyR: 17,
  Digit5: 18,
  KeyT: 19,
  Digit6: 20,
  KeyY: 21,
  Digit7: 22,
  KeyU: 23,
  KeyI: 24,
  Digit9: 25,
  KeyO: 26,
  Digit0: 27,
  KeyP: 28,
  BracketLeft: 29,
  Equal: 30,
  BracketRight: 31,
};

export const BASE_MIDI = 48;

/** Touches utilisées pour les étiquettes (on évite les doublons de la rangée du bas). */
export const LABEL_CODES = Object.keys(KEY_CODE_TO_OFFSET).filter(
  (c) => !['Comma', 'KeyL', 'Period', 'Semicolon', 'Slash'].includes(c),
);

/** Libellés QWERTY par défaut (remplacés par la vraie disposition si le navigateur la fournit). */
export const QWERTY_LABELS: Record<string, string> = {
  KeyZ: 'Z', KeyS: 'S', KeyX: 'X', KeyD: 'D', KeyC: 'C', KeyV: 'V', KeyG: 'G', KeyB: 'B', KeyH: 'H',
  KeyN: 'N', KeyJ: 'J', KeyM: 'M', KeyQ: 'Q', Digit2: '2', KeyW: 'W', Digit3: '3', KeyE: 'E', KeyR: 'R',
  Digit5: '5', KeyT: 'T', Digit6: '6', KeyY: 'Y', Digit7: '7', KeyU: 'U', KeyI: 'I', Digit9: '9', KeyO: 'O',
  Digit0: '0', KeyP: 'P', BracketLeft: '[', Equal: '=', BracketRight: ']',
};

export function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  if (t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) return true;
  if (t instanceof HTMLInputElement) {
    return !['range', 'checkbox', 'radio', 'button', 'submit', 'color', 'file'].includes(t.type);
  }
  return false;
}
