export type ChordQuality = 'maj' | 'min' | '7' | 'maj7' | 'm7' | 'sus4';

export interface ChordDefinition {
  root: string;       // e.g. "C", "F#", "Bb"
  quality: ChordQuality; // e.g. "maj", "min", etc.
  notes: string[];    // e.g. ["C", "E", "G"]
  pianoKeys: number[]; // semitone offsets from C (0 to 23 for a 2-octave range)
  guitar: GuitarFingering;
}

export interface GuitarFingering {
  frets: (number | 'x')[]; // From 6th string (low E) to 1st string (high e). 'x' means muted.
  fingers?: (number | null)[]; // Suggested fingers (1-4, null for open/none)
  barre?: {
    fret: number;
    startString: number; // 1-6
    endString: number;   // 1-6
  };
  baseFret: number; // The starting fret of our display window (usually 1, but higher for barres)
}

export const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const CHORD_QUALITIES: { value: ChordQuality; label: string; suffix: string }[] = [
  { value: 'maj', label: 'Major', suffix: '' },
  { value: 'min', label: 'Minor', suffix: 'm' },
  { value: '7', label: 'Dominant 7th', suffix: '7' },
  { value: 'maj7', label: 'Major 7th', suffix: 'maj7' },
  { value: 'm7', label: 'Minor 7th', suffix: 'm7' },
  { value: 'sus4', label: 'Suspended 4th', suffix: 'sus4' },
];

export interface SavedSequence {
  id: string;
  name: string;
  chords: { root: string; quality: ChordQuality }[];
  key: string; // The baseline key (e.g., "C")
}
