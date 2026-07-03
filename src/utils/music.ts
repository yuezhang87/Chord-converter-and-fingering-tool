import { ChordDefinition, ChordQuality, GuitarFingering, NOTES_SHARP, NOTES_FLAT } from '../types';

// Standard MIDI base values for guitar strings: E2, A2, D3, G3, B3, E4
export const GUITAR_STRING_MIDI_BASES = [40, 45, 50, 55, 59, 64]; // from string 6 to string 1

export function getNoteIndex(note: string): number {
  const normalized = note.trim();
  let idx = NOTES_SHARP.indexOf(normalized);
  if (idx !== -1) return idx;
  idx = NOTES_FLAT.indexOf(normalized);
  if (idx !== -1) return idx;
  
  // Try mapping flat equivalents if case differs or with minor matches
  const upper = normalized.toUpperCase();
  const sharpIdx = NOTES_SHARP.findIndex(n => n.toUpperCase() === upper);
  if (sharpIdx !== -1) return sharpIdx;
  const flatIdx = NOTES_FLAT.findIndex(n => n.toUpperCase() === upper);
  if (flatIdx !== -1) return flatIdx;
  
  return 0; // Default fallback to C
}

export function transposeNote(note: string, semitones: number, preferFlats: boolean = false): string {
  const startIdx = getNoteIndex(note);
  const targetIdx = (startIdx + semitones + 1200) % 12;
  return preferFlats ? NOTES_FLAT[targetIdx] : NOTES_SHARP[targetIdx];
}

// Map chord quality to semitone intervals relative to root
export function getIntervals(quality: ChordQuality): number[] {
  switch (quality) {
    case 'min': return [0, 3, 7];
    case '7': return [0, 4, 7, 10];
    case 'maj7': return [0, 4, 7, 11];
    case 'm7': return [0, 3, 7, 10];
    case 'sus4': return [0, 5, 7];
    case 'maj':
    default:
      return [0, 4, 7];
  }
}

// Static database of open CAGED chord configurations
const CAGED_BASE_CHORDS: Record<string, Record<ChordQuality, GuitarFingering>> = {
  E: {
    maj: { frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null], baseFret: 1 },
    min: { frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null], baseFret: 1 },
    '7': { frets: [0, 2, 0, 1, 0, 0], fingers: [null, 2, null, 1, null, null], baseFret: 1 },
    maj7: { frets: [0, 2, 1, 1, 0, 0], fingers: [null, 3, 1, 2, null, null], baseFret: 1 },
    m7: { frets: [0, 2, 0, 0, 0, 0], fingers: [null, 2, null, null, null, null], baseFret: 1 },
    sus4: { frets: [0, 2, 2, 2, 0, 0], fingers: [null, 2, 3, 4, null, null], baseFret: 1 }
  },
  A: {
    maj: { frets: ['x', 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null], baseFret: 1 },
    min: { frets: ['x', 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null], baseFret: 1 },
    '7': { frets: ['x', 0, 2, 0, 2, 0], fingers: [null, null, 2, null, 3, null], baseFret: 1 },
    maj7: { frets: ['x', 0, 2, 1, 2, 0], fingers: [null, null, 2, 1, 3, null], baseFret: 1 },
    m7: { frets: ['x', 0, 2, 0, 1, 0], fingers: [null, null, 2, null, 1, null], baseFret: 1 },
    sus4: { frets: ['x', 0, 2, 2, 3, 0], fingers: [null, null, 1, 2, 4, null], baseFret: 1 }
  },
  D: {
    maj: { frets: ['x', 'x', 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2], baseFret: 1 },
    min: { frets: ['x', 'x', 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1], baseFret: 1 },
    '7': { frets: ['x', 'x', 0, 2, 1, 2], fingers: [null, null, null, 2, 1, 3], baseFret: 1 },
    maj7: { frets: ['x', 'x', 0, 2, 2, 2], fingers: [null, null, null, 1, 1, 1], baseFret: 1 },
    m7: { frets: ['x', 'x', 0, 2, 1, 1], fingers: [null, null, null, 2, 1, 1], baseFret: 1 },
    sus4: { frets: ['x', 'x', 0, 2, 3, 3], fingers: [null, null, null, 1, 3, 4], baseFret: 1 }
  },
  C: {
    maj: { frets: ['x', 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null], baseFret: 1 },
    min: { frets: ['x', 3, 5, 5, 4, 3], fingers: [null, 1, 3, 4, 2, 1], barre: { fret: 3, startString: 5, endString: 1 }, baseFret: 3 },
    '7': { frets: ['x', 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, null], baseFret: 1 },
    maj7: { frets: ['x', 3, 2, 0, 0, 0], fingers: [null, 3, 2, null, null, null], baseFret: 1 },
    m7: { frets: ['x', 3, 5, 3, 4, 3], fingers: [null, 1, 3, 1, 2, 1], barre: { fret: 3, startString: 5, endString: 1 }, baseFret: 3 },
    sus4: { frets: ['x', 3, 3, 0, 1, 1], fingers: [null, 3, 4, null, 1, 1], baseFret: 1 }
  },
  G: {
    maj: { frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, null, null, null, 4], baseFret: 1 },
    min: { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 3, startString: 6, endString: 1 }, baseFret: 3 },
    '7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1], baseFret: 1 },
    maj7: { frets: [3, 'x', 4, 4, 3, 'x'], fingers: [1, null, 3, 4, 2, null], baseFret: 1 },
    m7: { frets: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1], barre: { fret: 3, startString: 6, endString: 1 }, baseFret: 3 },
    sus4: { frets: [3, 3, 0, 0, 1, 3], fingers: [3, 4, null, null, 1, 4], baseFret: 1 }
  }
};

/**
 * Creates an exact guitar shape by shifting a baseline open shape up the neck.
 */
function createShiftedFingering(baseShape: GuitarFingering, shiftAmount: number): GuitarFingering {
  const frets = baseShape.frets.map(f => {
    if (f === 'x') return 'x';
    return f + shiftAmount;
  });

  const fingers = baseShape.fingers ? [...baseShape.fingers] : undefined;
  
  let barre = baseShape.barre;
  if (barre) {
    barre = {
      fret: barre.fret + shiftAmount,
      startString: barre.startString,
      endString: barre.endString
    };
  } else if (shiftAmount > 0) {
    // If we're shifting an open chord (which didn't have a barre), we often need to introduce one!
    // For example, E maj shifted by 2 is F# maj, which needs a barre at fret 2.
    // Let's identify the lowest non-zero open string to create a barre
    const openStrings = baseShape.frets.map((f, i) => f === 0 ? i : -1).filter(i => i !== -1);
    const startString = baseShape.frets[0] === 'x' ? 5 : 6;
    if (openStrings.length > 0) {
      barre = {
        fret: shiftAmount,
        startString: startString,
        endString: 1
      };
      // For any fret that was 0 (open), it is now played at the barre fret
      baseShape.frets.forEach((f, i) => {
        if (f === 0) {
          frets[i] = shiftAmount;
        }
      });
      // Set the index finger (1) for strings covered by the new barre
      if (fingers) {
        for (let s = 6 - startString; s < 6; s++) {
          if (fingers[s] === null || baseShape.frets[s] === 0) {
            fingers[s] = 1;
          }
        }
      }
    }
  }

  // Determine a nice baseFret window
  let baseFret = 1;
  const numericFrets = frets.filter((f): f is number => typeof f === 'number' && f > 0);
  if (numericFrets.length > 0) {
    const minFret = Math.min(...numericFrets);
    // If the lowest fret is higher than 3, adjust the viewing window
    if (minFret > 2) {
      baseFret = minFret;
    }
  }

  return {
    frets,
    fingers,
    barre,
    baseFret
  };
}

/**
 * Generates the correct GuitarFingering diagram for any root and quality.
 */
export function getGuitarFingering(root: string, quality: ChordQuality): GuitarFingering {
  const rootNormalized = root.replace('b', 'b').replace('#', '#');
  
  // Directly supported open keys
  if (CAGED_BASE_CHORDS[rootNormalized]?.[quality]) {
    return JSON.parse(JSON.stringify(CAGED_BASE_CHORDS[rootNormalized][quality]));
  }

  // Otherwise, determine the best shift mapping
  // We prefer either an E-root barre or A-root barre based on the note
  const rootIndex = getNoteIndex(rootNormalized);
  
  // Let's find relative shifts
  // E-root barre is at index 4 (E). Shift is (rootIndex - 4 + 12) % 12
  const eShift = (rootIndex - 4 + 12) % 12;
  // A-root barre is at index 9 (A). Shift is (rootIndex - 9 + 12) % 12
  const aShift = (rootIndex - 9 + 12) % 12;

  // Let's choose the shift that gives the lower neck position (more comfortable)
  if (eShift <= aShift && eShift > 0 && eShift < 9) {
    const eBase = CAGED_BASE_CHORDS['E'][quality];
    return createShiftedFingering(eBase, eShift);
  } else {
    const aBase = CAGED_BASE_CHORDS['A'][quality];
    return createShiftedFingering(aBase, aShift);
  }
}

/**
 * Parses and returns a clean, fully detailed ChordDefinition for use in UI.
 */
export function getChordDefinition(root: string, quality: ChordQuality, preferFlats: boolean = false): ChordDefinition {
  const rootIndex = getNoteIndex(root);
  const normalizedRoot = preferFlats ? NOTES_FLAT[rootIndex] : NOTES_SHARP[rootIndex];
  const intervals = getIntervals(quality);
  
  // Notes in standard notation
  const notes = intervals.map(interval => transposeNote(normalizedRoot, interval, preferFlats));
  
  // Piano keys map to semitone offsets from C inside a 2-octave range
  // We place the root note at a beautiful register (Middle C-ish or an octave higher)
  // Let's place the root in the first octave (0-11) and build notes on top
  const basePianoKeys = intervals.map(interval => rootIndex + interval);
  
  return {
    root: normalizedRoot,
    quality,
    notes,
    pianoKeys: basePianoKeys,
    guitar: getGuitarFingering(normalizedRoot, quality)
  };
}

/**
 * Transposes a full chord sequence by a given semitone offset.
 */
export function transposeSequence(
  chords: { root: string; quality: ChordQuality }[],
  semitones: number,
  preferFlats: boolean = false
): { root: string; quality: ChordQuality }[] {
  return chords.map(c => ({
    root: transposeNote(c.root, semitones, preferFlats),
    quality: c.quality
  }));
}

/**
 * Attempts to parse a chord string typed by a user, e.g. "C", "Am", "F#maj7", "D7", "Bbm"
 */
export function parseChordString(input: string): { root: string; quality: ChordQuality } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Pattern to match root note (A-G, optionally followed by # or b)
  const rootMatch = trimmed.match(/^([A-G][#b]?)/i);
  if (!rootMatch) return null;

  let rawRoot = rootMatch[1];
  // Standardize capitalization of root
  let root = rawRoot.charAt(0).toUpperCase();
  if (rawRoot.length > 1) {
    root += rawRoot.charAt(1) === 'b' ? 'b' : '#';
  }

  const remainder = trimmed.slice(rawRoot.length).toLowerCase().trim();

  let quality: ChordQuality = 'maj';
  if (remainder === 'm' || remainder === 'min' || remainder === 'minor') {
    quality = 'min';
  } else if (remainder === '7' || remainder === 'dom7') {
    quality = '7';
  } else if (remainder === 'maj7' || remainder === 'major7' || remainder === 'm7+') {
    quality = 'maj7';
  } else if (remainder === 'm7' || remainder === 'min7' || remainder === 'minor7') {
    quality = 'm7';
  } else if (remainder === 'sus4' || remainder === 'sus') {
    quality = 'sus4';
  }

  return { root, quality };
}
