// Gestion de la Web MIDI API (piano numérique branché en USB).

export type MidiStatus = 'unsupported' | 'pending' | 'denied' | 'no-device' | 'connected';

interface MidiMessage {
  data: Uint8Array | null;
}
interface MidiInputLike {
  name?: string | null;
  state?: string;
  onmidimessage: ((e: MidiMessage) => void) | null;
}
interface MidiAccessLike {
  inputs: { forEach(cb: (input: MidiInputLike) => void): void };
  onstatechange: (() => void) | null;
}

export interface MidiCallbacks {
  onNoteOn(midi: number, velocity: number): void;
  onNoteOff(midi: number): void;
  onStatus(status: MidiStatus, devices: string[]): void;
}

export class MidiManager {
  private access: MidiAccessLike | null = null;
  private sustain = false;
  private sustained = new Set<number>();
  private held = new Set<number>();

  constructor(private cb: MidiCallbacks) {}

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
  }

  async init(): Promise<void> {
    const nav = navigator as unknown as {
      requestMIDIAccess?: (o?: { sysex?: boolean }) => Promise<MidiAccessLike>;
    };
    if (!nav.requestMIDIAccess) {
      this.cb.onStatus('unsupported', []);
      return;
    }
    this.cb.onStatus('pending', []);
    try {
      this.access = await nav.requestMIDIAccess({ sysex: false });
      this.attach();
      this.access.onstatechange = () => this.attach();
    } catch {
      this.cb.onStatus('denied', []);
    }
  }

  private attach() {
    if (!this.access) return;
    const names: string[] = [];
    this.access.inputs.forEach((input) => {
      if (input.state === 'disconnected') return;
      input.onmidimessage = this.handle;
      names.push(input.name || 'Périphérique MIDI');
    });
    this.cb.onStatus(names.length ? 'connected' : 'no-device', names);
  }

  private handle = (e: MidiMessage) => {
    const d = e.data;
    if (!d || d.length < 2) return;
    const cmd = d[0] & 0xf0;
    const note = d[1];
    const vel = d.length > 2 ? d[2] : 0;
    if (cmd === 0x90 && vel > 0) {
      this.held.add(note);
      this.sustained.delete(note);
      this.cb.onNoteOn(note, vel / 127);
    } else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) {
      this.held.delete(note);
      if (this.sustain) this.sustained.add(note);
      this.cb.onNoteOff(note);
    } else if (cmd === 0xb0 && note === 64) {
      // Pédale de sustain : on la note seulement (les exercices évaluent les attaques).
      this.sustain = vel >= 64;
      if (!this.sustain) this.sustained.clear();
    }
  };

  dispose() {
    if (!this.access) return;
    this.access.onstatechange = null;
    this.access.inputs.forEach((input) => {
      input.onmidimessage = null;
    });
  }
}
