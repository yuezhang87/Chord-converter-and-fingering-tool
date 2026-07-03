import React, { useState } from 'react';
import { CHORD_QUALITIES, ChordQuality, NOTES_SHARP, NOTES_FLAT } from '../types';
import { parseChordString } from '../utils/music';
import { Plus, HelpCircle, Music, Keyboard } from 'lucide-react';

interface ChordSelectorProps {
  onAddChord: (root: string, quality: ChordQuality) => void;
  onSetSequence: (chords: { root: string; quality: ChordQuality }[]) => void;
}

export const ChordSelector: React.FC<ChordSelectorProps> = ({ onAddChord, onSetSequence }) => {
  const [selectedRoot, setSelectedRoot] = useState<string>('C');
  const [selectedQuality, setSelectedQuality] = useState<ChordQuality>('maj');
  const [textInput, setTextInput] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);

  const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

  const handleAddClick = () => {
    onAddChord(selectedRoot, selectedQuality);
  };

  const handleTextImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) {
      setParseError('Please enter some chords first.');
      return;
    }

    // Split by whitespace, dashes, commas, or arrows
    const parts = textInput.split(/[\s\-\,→]+/);
    const parsedChords: { root: string; quality: ChordQuality }[] = [];
    const failedParts: string[] = [];

    parts.forEach(part => {
      const cleaned = part.trim();
      if (!cleaned) return;

      const parsed = parseChordString(cleaned);
      if (parsed) {
        parsedChords.push(parsed);
      } else {
        failedParts.push(cleaned);
      }
    });

    if (failedParts.length > 0) {
      setParseError(`Could not understand: ${failedParts.join(', ')}`);
    } else {
      setParseError(null);
    }

    if (parsedChords.length > 0) {
      onSetSequence(parsedChords);
      setTextInput('');
    }
  };

  const loadExample = (progression: string) => {
    setTextInput(progression);
    setParseError(null);
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6" id="chord-selector-pane">
      
      {/* Tab 1: Creator Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <h2 className="text-stone-100 font-sans text-lg font-semibold flex items-center gap-2">
            <Plus className="text-amber-500 w-5 h-5" />
            Chord Builder
          </h2>
          <span className="text-stone-500 font-mono text-xs">Click to select & preview</span>
        </div>

        {/* Root Selector */}
        <div>
          <label className="block text-stone-400 font-mono text-xs uppercase tracking-wide mb-2">
            1. Root Note
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2" id="root-pad-grid">
            {roots.map(root => {
              const active = selectedRoot === root;
              return (
                <button
                  key={root}
                  type="button"
                  onClick={() => setSelectedRoot(root)}
                  className={`py-2 px-3 rounded-xl font-mono text-sm font-bold transition-all border duration-150 cursor-pointer ${
                    active
                      ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-900/30'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700 hover:text-white'
                  }`}
                  id={`root-pad-${root}`}
                >
                  {root}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality Selector */}
        <div>
          <label className="block text-stone-400 font-mono text-xs uppercase tracking-wide mb-2">
            2. Chord Quality
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" id="quality-pad-grid">
            {CHORD_QUALITIES.map(q => {
              const active = selectedQuality === q.value;
              return (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => setSelectedQuality(q.value)}
                  className={`p-3 rounded-xl font-sans text-left transition-all border duration-150 cursor-pointer ${
                    active
                      ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-900/30'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700 hover:text-white'
                  }`}
                  id={`quality-pad-${q.value}`}
                >
                  <div className="font-bold text-sm">
                    {selectedRoot}
                    {q.suffix}
                  </div>
                  <div className={`text-[10px] ${active ? 'text-amber-100' : 'text-stone-500'}`}>
                    {q.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleAddClick}
          className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-sans font-bold rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          id="add-chord-to-sequence-btn"
        >
          <Plus className="w-5 h-5 stroke-[2.5px]" />
          Add {selectedRoot}
          {CHORD_QUALITIES.find(q => q.value === selectedQuality)?.suffix} to Sequence
        </button>
      </div>

      {/* Tab 2: Batch Paste Progression */}
      <div className="flex flex-col gap-4 border-t border-stone-800 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-stone-100 font-sans text-base font-semibold flex items-center gap-2">
            <Music className="text-amber-500 w-5 h-5" />
            Paste Sequence
          </h2>
        </div>

        <form onSubmit={handleTextImport} className="flex flex-col gap-3">
          <p className="text-stone-500 text-xs">
            Type chords separated by spaces or dashes. Example: <span className="font-mono text-stone-400">C G Am F</span>
          </p>

          <div className="relative">
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="e.g. C Am Dm G7"
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-200 font-mono placeholder-stone-600 focus:outline-none focus:border-amber-500 text-sm"
              id="chord-sequence-input-field"
            />
          </div>

          {parseError && (
            <p className="text-rose-500 text-xs font-mono" id="import-parse-error-msg">
              {parseError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 font-sans font-semibold rounded-xl text-sm transition-all cursor-pointer"
              id="import-chord-progression-btn"
            >
              Parse & Set Sequence
            </button>
          </div>
        </form>

        {/* Quick progression templates for users */}
        <div>
          <span className="block text-stone-500 font-mono text-[10px] uppercase tracking-wider mb-2">
            Try standard progressions:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadExample('C G Am F')}
              className="px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 text-xs font-mono rounded-lg transition-all cursor-pointer"
            >
              Pop standard (C-G-Am-F)
            </button>
            <button
              onClick={() => loadExample('Am F C G')}
              className="px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 text-xs font-mono rounded-lg transition-all cursor-pointer"
            >
              Minor vibe (Am-F-C-G)
            </button>
            <button
              onClick={() => loadExample('D G A7 D')}
              className="px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 text-xs font-mono rounded-lg transition-all cursor-pointer"
            >
              Classic folk (D-G-A7-D)
            </button>
            <button
              onClick={() => loadExample('Dm7 G7 Cmaj7')}
              className="px-2.5 py-1.5 bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 text-xs font-mono rounded-lg transition-all cursor-pointer"
            >
              Jazz II-V-I (Dm7-G7-Cmaj7)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
