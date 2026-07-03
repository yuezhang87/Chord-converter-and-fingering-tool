import React from 'react';
import { GuitarFingering } from '../types';

interface GuitarFretboardProps {
  fingering: GuitarFingering;
  chordName: string;
}

export const GuitarFretboard: React.FC<GuitarFretboardProps> = ({ fingering, chordName }) => {
  const { frets, fingers, barre, baseFret } = fingering;

  // Visual layout constants
  const width = 220;
  const height = 260;
  const topPadding = 45;
  const bottomPadding = 25;
  const leftPadding = 35;
  const rightPadding = 25;

  const boardWidth = width - leftPadding - rightPadding;
  const boardHeight = height - topPadding - bottomPadding;

  const numStrings = 6;
  const numFrets = 5; // standard window displays 5 frets

  const stringSpacing = boardWidth / (numStrings - 1);
  const fretSpacing = boardHeight / numFrets;

  // Get string X coordinate
  const getStringX = (stringIdx: number) => {
    // String 6 (low E) is on the left, String 1 (high e) is on the right
    return leftPadding + stringIdx * stringSpacing;
  };

  // Get fret Y coordinate (at the bottom of the fret space)
  const getFretY = (fretIdx: number) => {
    return topPadding + fretIdx * fretSpacing;
  };

  // Render open or muted string indicators above the nut
  const renderStringHeaders = () => {
    return frets.map((fret, idx) => {
      const x = getStringX(idx);
      const y = topPadding - 12;

      if (fret === 'x') {
        return (
          <text
            key={`header-${idx}`}
            x={x}
            y={y}
            textAnchor="middle"
            className="fill-rose-500 font-sans text-sm font-semibold select-none"
            id={`guitar-mute-str-${idx}`}
          >
            ×
          </text>
        );
      } else if (fret === 0) {
        return (
          <circle
            key={`header-${idx}`}
            cx={x}
            cy={y - 4}
            r={4}
            className="fill-none stroke-emerald-500 stroke-2"
            id={`guitar-open-str-${idx}`}
          />
        );
      }
      return null;
    });
  };

  // Render the actual fretting circles (dots) on strings
  const renderFretDots = () => {
    return frets.map((fret, stringIdx) => {
      if (fret === 'x' || fret === 0) return null;

      // Find relative position in our 5-fret display window
      const relativeFret = fret - baseFret + 1;
      
      // If the fret is out of our visual display window, don't render it
      if (relativeFret < 1 || relativeFret > numFrets) return null;

      const x = getStringX(stringIdx);
      // Place dot in the middle of the fret space
      const y = getFretY(relativeFret) - fretSpacing / 2;
      const finger = fingers ? fingers[stringIdx] : null;

      // Skip drawing individual dot if it's covered by a barre
      if (barre && fret === barre.fret && stringIdx >= (6 - barre.startString) && stringIdx <= (6 - barre.endString)) {
        // We will render barre chord arc separately, but if there's a finger labeled inside the barre, we can still show it or let the barre handle it.
        // Let's draw finger numbers on top of the barre for clarity!
      }

      return (
        <g key={`dot-${stringIdx}`} id={`guitar-dot-group-${stringIdx}`}>
          <circle
            cx={x}
            cy={y}
            r={10}
            className="fill-amber-600 stroke-amber-700 stroke-1 shadow-sm"
          />
          {finger && (
            <text
              x={x}
              y={y + 3.5}
              textAnchor="middle"
              className="fill-white font-sans text-xs font-bold select-none"
            >
              {finger}
            </text>
          )}
        </g>
      );
    });
  };

  // Render the barre sweep
  const renderBarreArc = () => {
    if (!barre) return null;

    const relativeFret = barre.fret - baseFret + 1;
    if (relativeFret < 1 || relativeFret > numFrets) return null;

    // Convert string standard numbering (6 is low E, 1 is high e) to 0-indexed indices (0 is low E, 5 is high e)
    const startIdx = 6 - barre.startString;
    const endIdx = 6 - barre.endString;

    const startX = getStringX(startIdx);
    const endX = getStringX(endIdx);
    const y = getFretY(relativeFret) - fretSpacing / 2;

    return (
      <g id="guitar-barre-group">
        {/* Render a rounded thick capsule for the barre finger */}
        <rect
          x={startX - 10}
          y={y - 10}
          width={endX - startX + 20}
          height={20}
          rx={10}
          className="fill-amber-600/90 stroke-amber-700 stroke-1"
        />
        {/* Render finger 1 (index) label at the ends or center */}
        <text
          x={(startX + endX) / 2}
          y={y + 3.5}
          textAnchor="middle"
          className="fill-white font-sans text-xs font-extrabold select-none"
        >
          1
        </text>
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center p-4 bg-stone-900 border border-stone-800 rounded-2xl shadow-lg transition-transform hover:scale-[1.01]" id={`guitar-fretboard-${chordName}`}>
      <span className="text-stone-400 font-mono text-xs uppercase tracking-widest mb-1">Guitar Fingering</span>
      <h3 className="text-amber-500 font-sans text-2xl font-bold tracking-tight mb-2">{chordName}</h3>
      
      <div className="relative w-full flex justify-center">
        <svg width={width} height={height} className="overflow-visible">
          {/* Grid background: Wood-grain or standard slate styling */}
          <rect
            x={leftPadding}
            y={topPadding}
            width={boardWidth}
            height={boardHeight}
            className="fill-stone-950 stroke-none"
          />

          {/* Draw fret horizontal lines */}
          {Array.from({ length: numFrets + 1 }).map((_, idx) => {
            const y = getFretY(idx);
            const isNut = idx === 0 && baseFret === 1;
            return (
              <line
                key={`fret-line-${idx}`}
                x1={leftPadding}
                y1={y}
                x2={leftPadding + boardWidth}
                y2={y}
                className={isNut ? 'stroke-stone-300 stroke-[5px]' : 'stroke-stone-700 stroke-[1.5px]'}
              />
            );
          })}

          {/* Lateral Fret Indicator (e.g. "3fr" if started higher) */}
          {baseFret > 1 && (
            <text
              x={leftPadding - 12}
              y={getFretY(1) - fretSpacing / 2 + 5}
              textAnchor="end"
              className="fill-amber-500/80 font-mono text-xs font-semibold"
              id="guitar-fret-number-label"
            >
              {baseFret}fr
            </text>
          )}

          {/* Draw vertical strings with correct string gauge (thicknesses) */}
          {Array.from({ length: numStrings }).map((_, idx) => {
            const x = getStringX(idx);
            // Gauge thickness: low E (idx 0) is thickest, high e (idx 5) is thinnest
            const thickness = 3.2 - idx * 0.45;
            return (
              <line
                key={`string-line-${idx}`}
                x1={x}
                y1={topPadding}
                x2={x}
                y2={topPadding + boardHeight}
                style={{ strokeWidth: thickness }}
                className="stroke-stone-400"
              />
            );
          })}

          {/* Render Barre shapes */}
          {renderBarreArc()}

          {/* Render Fretted Dots */}
          {renderFretDots()}

          {/* Render String Headers (Muted / Open) */}
          {renderStringHeaders()}
        </svg>
      </div>

      {/* Detail Footer */}
      <div className="mt-2 w-full text-center">
        <p className="text-stone-500 font-mono text-[10px] tracking-wide">
          Strings: E A D G B e
        </p>
      </div>
    </div>
  );
};
