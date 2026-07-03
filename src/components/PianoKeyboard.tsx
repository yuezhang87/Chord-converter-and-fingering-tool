import React from 'react';
import { NOTES_SHARP, NOTES_FLAT } from '../types';
import { getNoteIndex } from '../utils/music';

interface PianoKeyboardProps {
  activeKeys: number[]; // semitone offsets from C
  chordName: string;
  chordNotes?: string[];
  preferFlats?: boolean;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({ 
  activeKeys, 
  chordName,
  chordNotes,
  preferFlats = false
}) => {
  // SVG configuration
  const keyWidth = 26;
  const keyHeight = 110;
  const blackKeyWidth = 16;
  const blackKeyHeight = 68;

  const numWhiteKeys = 14; // 2 octaves (7 white keys per octave)
  const width = numWhiteKeys * keyWidth;
  const height = keyHeight + 35; // extra padding at top for names

  // List of white keys in order of C, D, E, F, G, A, B, C, D, E, F, G, A, B
  const whiteKeyNoteIndices = [
    0,  2,  4,  5,  7,  9,  11, // Octave 1
    12, 14, 16, 17, 19, 21, 23  // Octave 2
  ];

  // List of black keys in order with their relative position index (where 1 means between white key 0 and 1)
  const blackKeys = [
    { semitone: 1,  positionIndex: 1 },
    { semitone: 3,  positionIndex: 2 },
    { semitone: 6,  positionIndex: 4 },
    { semitone: 8,  positionIndex: 5 },
    { semitone: 10, positionIndex: 6 },
    
    { semitone: 13, positionIndex: 8 },
    { semitone: 15, positionIndex: 9 },
    { semitone: 18, positionIndex: 11 },
    { semitone: 20, positionIndex: 12 },
    { semitone: 22, positionIndex: 13 }
  ];

  // Helper to check if a specific semitone offset is active in this chord
  const isKeyActive = (semitone: number) => {
    const normalized = (semitone + 24) % 24;
    return activeKeys.some(k => (k + 24) % 24 === normalized);
  };

  // Helper to get note name for a semitone, using spelling from chordNotes if matched
  const getNoteName = (semitone: number) => {
    const pitchClass = semitone % 12;
    if (chordNotes && chordNotes.length > 0) {
      const matched = chordNotes.find(note => {
        try {
          return getNoteIndex(note) === pitchClass;
        } catch {
          return false;
        }
      });
      if (matched) return matched;
    }
    return preferFlats ? NOTES_FLAT[pitchClass] : NOTES_SHARP[pitchClass];
  };

  return (
    <div className="flex flex-col items-center p-4 bg-stone-900 border border-stone-800 rounded-2xl shadow-lg transition-transform hover:scale-[1.01]" id={`piano-keyboard-${chordName}`}>
      <span className="text-stone-400 font-mono text-xs uppercase tracking-widest mb-1">Piano Key Map</span>
      <h3 className="text-amber-500 font-sans text-2xl font-bold tracking-tight mb-3">{chordName}</h3>

      <div className="relative overflow-visible" style={{ width: `${width}px`, height: `${height}px` }}>
        <svg width={width} height={height} className="overflow-visible">
          {/* 1. Render White Keys */}
          {whiteKeyNoteIndices.map((semitone, index) => {
            const x = index * keyWidth;
            const active = isKeyActive(semitone);
            const noteName = getNoteName(semitone);

            return (
              <g key={`white-${index}`} id={`piano-white-key-group-${noteName}`}>
                <rect
                  x={x}
                  y={20}
                  width={keyWidth}
                  height={keyHeight}
                  rx={2}
                  className={`stroke-stone-950 transition-colors duration-200 ${
                    active 
                      ? 'fill-amber-500 stroke-amber-600' 
                      : 'fill-stone-100 hover:fill-stone-200'
                  }`}
                  style={{ strokeWidth: '1.5px' }}
                />
                <text
                  x={x + keyWidth / 2}
                  y={keyHeight + 10}
                  textAnchor="middle"
                  className={`font-sans text-[9px] font-bold select-none transition-colors duration-200 ${
                    active 
                      ? 'fill-stone-950 font-extrabold' 
                      : 'fill-stone-400'
                  }`}
                >
                  {noteName}
                </text>
              </g>
            );
          })}

          {/* 2. Render Black Keys (drawn on top of white keys) */}
          {blackKeys.map((bk, index) => {
            const x = bk.positionIndex * keyWidth - blackKeyWidth / 2;
            const active = isKeyActive(bk.semitone);
            const noteName = getNoteName(bk.semitone);

            return (
              <g key={`black-${index}`} id={`piano-black-key-group-${noteName}`}>
                <rect
                  x={x}
                  y={20}
                  width={blackKeyWidth}
                  height={blackKeyHeight}
                  rx={1.5}
                  className={`stroke-stone-950 transition-colors duration-200 ${
                    active 
                      ? 'fill-amber-600 stroke-amber-500' 
                      : 'fill-stone-950 hover:fill-stone-800'
                  }`}
                  style={{ strokeWidth: '1px' }}
                />
                <text
                  x={x + blackKeyWidth / 2}
                  y={55}
                  textAnchor="middle"
                  className={`font-sans text-[7px] font-bold select-none transition-colors duration-200 ${
                    active 
                      ? 'fill-white font-extrabold' 
                      : 'fill-stone-500'
                  }`}
                >
                  {noteName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Piano Keyboard Details */}
      <div className="mt-2 w-full text-center flex justify-between px-1 text-stone-500 font-mono text-[10px]">
        <span>C4 (Middle C)</span>
        <span>B5</span>
      </div>
    </div>
  );
};
