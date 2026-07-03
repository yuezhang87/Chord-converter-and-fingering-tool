import React, { useState, useEffect, useRef } from 'react';
import { ChordQuality, CHORD_QUALITIES } from './types';
import { getChordDefinition, transposeSequence, GUITAR_STRING_MIDI_BASES } from './utils/music';
import { playGuitarStrum, playPianoChord } from './utils/audio';
import { GuitarFretboard } from './components/GuitarFretboard';
import { PianoKeyboard } from './components/PianoKeyboard';
import { ChordSelector } from './components/ChordSelector';
import { 
  Play, 
  Pause, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Music, 
  Keyboard, 
  RotateCcw, 
  Sparkles,
  Volume2,
  Info,
  Undo,
  Save,
  FolderHeart
} from 'lucide-react';

export default function App() {
  // Initial default chord progression (empty to wait for user input)
  const [sequence, setSequence] = useState<{ root: string; quality: ChordQuality }[]>([]);

  // History stack for undo functionality
  const [history, setHistory] = useState<{ root: string; quality: ChordQuality }[][]>([]);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [tempo, setTempo] = useState<number>(90); // default 90 BPM
  const [instrument, setInstrument] = useState<'guitar' | 'piano'>('guitar');
  const [preferFlats, setPreferFlats] = useState<boolean>(false);
  const [transpositionCumulative, setTranspositionCumulative] = useState<number>(0);
  const [flashMetronome, setFlashMetronome] = useState<boolean>(false);

  // Saved progressions states
  const [savedSets, setSavedSets] = useState<{ id: string; name: string; sequence: { root: string; quality: ChordQuality }[] }[]>([]);
  const [saveName, setSaveName] = useState<string>('');
  const [showSaveForm, setShowSaveForm] = useState<boolean>(false);

  // Load saved sets from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chordcraft_saved_sets');
      if (saved) {
        setSavedSets(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load saved sets from localStorage', e);
    }
  }, []);

  const handleSaveSet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim() || sequence.length === 0) return;

    const newSet = {
      id: Date.now().toString(),
      name: saveName.trim(),
      sequence: [...sequence]
    };

    const updated = [...savedSets, newSet];
    setSavedSets(updated);
    localStorage.setItem('chordcraft_saved_sets', JSON.stringify(updated));
    setSaveName('');
    setShowSaveForm(false);
  };

  const handleLoadSet = (set: { id: string; name: string; sequence: { root: string; quality: ChordQuality }[] }) => {
    updateSequenceWithHistory(set.sequence);
    setActiveIndex(0);
    if (set.sequence.length > 0) {
      triggerChordSound(set.sequence[0].root, set.sequence[0].quality, instrument);
    }
  };

  const handleDeleteSet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedSets.filter(s => s.id !== id);
    setSavedSets(updated);
    localStorage.setItem('chordcraft_saved_sets', JSON.stringify(updated));
  };

  // Helper to update sequence while saving the previous state to history
  const updateSequenceWithHistory = (newSeq: { root: string; quality: ChordQuality }[]) => {
    setHistory(prev => [...prev, sequence]);
    setSequence(newSeq);
  };

  const handleGoBack = () => {
    if (history.length === 0) return;
    const prevSequence = history[history.length - 1];
    setSequence(prevSequence);
    setHistory(prev => prev.slice(0, prev.length - 1));
    
    // Adjust active index if out of bounds
    if (activeIndex >= prevSequence.length && prevSequence.length > 0) {
      setActiveIndex(prevSequence.length - 1);
    } else if (prevSequence.length === 0) {
      setActiveIndex(0);
    }
  };

  // Interval reference for sequencer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get active chord definition
  const activeChordRaw = sequence[activeIndex];
  const activeChord = activeChordRaw 
    ? getChordDefinition(activeChordRaw.root, activeChordRaw.quality, preferFlats)
    : null;

  // Sound play helper
  const triggerChordSound = (root: string, quality: ChordQuality, currentInstrument: 'guitar' | 'piano') => {
    const chordDef = getChordDefinition(root, quality, preferFlats);
    if (currentInstrument === 'guitar') {
      playGuitarStrum(chordDef.guitar.frets, GUITAR_STRING_MIDI_BASES);
    } else {
      // Offset piano chords to Middle C (MIDI 60) register
      const pianoMidis = chordDef.pianoKeys.map(keyOffset => 60 + keyOffset);
      playPianoChord(pianoMidis);
    }
  };

  // Play the currently active chord in the UI
  const handlePlayActiveSound = () => {
    if (activeChordRaw) {
      triggerChordSound(activeChordRaw.root, activeChordRaw.quality, instrument);
    }
  };

  // Run the sequencer loop
  useEffect(() => {
    if (isPlaying && sequence.length > 0) {
      const intervalMs = (60 / tempo) * 1000;

      const tick = () => {
        setFlashMetronome(true);
        setTimeout(() => setFlashMetronome(false), 150);

        setActiveIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % sequence.length;
          const nextChord = sequence[nextIndex];
          if (nextChord) {
            triggerChordSound(nextChord.root, nextChord.quality, instrument);
          }
          return nextIndex;
        });
      };

      // Play the first one immediately when starting
      const initialChord = sequence[activeIndex];
      if (initialChord) {
        triggerChordSound(initialChord.root, initialChord.quality, instrument);
      }

      timerRef.current = setInterval(tick, intervalMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, tempo, sequence, instrument, preferFlats]);

  // Handle manual chord clicks
  const handleChordClick = (index: number) => {
    setActiveIndex(index);
    const clicked = sequence[index];
    if (clicked) {
      triggerChordSound(clicked.root, clicked.quality, instrument);
    }
  };

  // Add chord helper
  const handleAddChord = (root: string, quality: ChordQuality) => {
    const newSequence = [...sequence, { root, quality }];
    updateSequenceWithHistory(newSequence);
    setActiveIndex(newSequence.length - 1);
    triggerChordSound(root, quality, instrument);
  };

  // Remove individual chord
  const handleRemoveChord = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent setting active
    const newSequence = sequence.filter((_, i) => i !== index);
    updateSequenceWithHistory(newSequence);
    
    // Adjust active index
    if (activeIndex >= newSequence.length && newSequence.length > 0) {
      setActiveIndex(newSequence.length - 1);
    } else if (newSequence.length === 0) {
      setActiveIndex(0);
    }
  };

  // Clear entire progression
  const handleClearProgression = () => {
    updateSequenceWithHistory([]);
    setActiveIndex(0);
    setIsPlaying(false);
  };

  // Transpose sequence helper
  const handleTranspose = (semitones: number) => {
    if (sequence.length === 0) return;
    const transposed = transposeSequence(sequence, semitones, preferFlats);
    updateSequenceWithHistory(transposed);
    setTranspositionCumulative(prev => prev + semitones);

    // Play active chord in transposed key
    const active = transposed[activeIndex];
    if (active) {
      triggerChordSound(active.root, active.quality, instrument);
    }
  };

  // Reset transposer count
  const handleResetTransposition = () => {
    setTranspositionCumulative(0);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans" id="app-root-container">
      {/* Upper Navigation / Decorative Brand bar */}
      <header className="border-b border-stone-900 bg-stone-950/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4" id="app-header-navigation">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600/10 border border-amber-500/30 rounded-xl">
              <Music className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight font-sans text-stone-100">
                Acoustic <span className="text-amber-500 font-medium">ChordCraft</span>
              </h1>
              <p className="text-xs text-stone-400 font-mono">
                Key Translation & Fingerings Console
              </p>
            </div>
          </div>

          {/* Quick info badges */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-stone-400">
              Audio: <strong className="text-amber-500">Web Audio Synth</strong>
            </span>
            <span className="px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-stone-400">
              System: <strong className="text-emerald-500">Live</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6" id="app-workspace-body">
        
        {/* Banner/Introduction */}
        <div className="bg-gradient-to-br from-amber-950/20 to-stone-900 border border-amber-900/10 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-stone-100 font-sans text-xl font-bold flex items-center gap-2 mb-2">
              <Sparkles className="text-amber-500 w-5 h-5 animate-pulse" />
              Transpose & Learn Chord Fingerings
            </h2>
            <p className="text-stone-400 text-sm leading-relaxed max-w-2xl">
              Construct chord progressions, listen to acoustic-simulated strings or piano chords, 
              and instantly translate between keys. Perfect for singer-songwriters, guitarists, and keyboard players.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => {
                setPreferFlats(!preferFlats);
                // Trigger sound play to reflect label update
                if (activeChordRaw) triggerChordSound(activeChordRaw.root, activeChordRaw.quality, instrument);
              }}
              className="px-4 py-2 bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white font-mono text-xs rounded-xl transition-all cursor-pointer"
            >
              Mode: {preferFlats ? '♭ Flats' : '♯ Sharps'}
            </button>
          </div>
        </div>

        {/* TOP PANEL: Sequence & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sequencer-and-sequence-grid">
          
          {/* LEFT/CENTER 2 COLS: Sequencer timeline */}
          <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-3xl p-6 flex flex-col gap-6" id="sequence-timeline-card">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
              <div>
                <h3 className="text-stone-100 font-sans text-lg font-semibold flex items-center gap-2">
                  <Volume2 className="text-amber-500 w-5 h-5" />
                  Your Chord Sequence
                </h3>
                <p className="text-stone-500 text-xs">
                  Click a card to play individual sounds and load diagrams
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={sequence.length === 0}
                  className={`px-5 py-2.5 rounded-xl font-sans font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                    isPlaying
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-stone-950 disabled:opacity-50'
                  }`}
                  id="sequencer-play-pause-btn"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" /> Pause Sequencer
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-stone-950" /> Play Progression
                    </>
                  )}
                </button>

                <button
                  onClick={handleGoBack}
                  disabled={history.length === 0}
                  className="px-3 py-2 bg-stone-950 border border-stone-800 hover:border-stone-700 hover:text-white text-stone-300 rounded-xl transition-all disabled:opacity-40 disabled:hover:text-stone-500 flex items-center gap-1.5 text-xs cursor-pointer"
                  title="Back to previous chord set (Undo)"
                  id="back-to-previous-btn"
                >
                  <Undo className="w-3.5 h-3.5 text-amber-500" />
                  <span>Prev Chord Set</span>
                </button>

                <button
                  onClick={() => setShowSaveForm(!showSaveForm)}
                  disabled={sequence.length === 0}
                  className={`px-3 py-2 border rounded-xl transition-all text-xs cursor-pointer flex items-center gap-1.5 ${
                    showSaveForm 
                      ? 'bg-amber-600 border-amber-500 text-white' 
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700 hover:text-white text-stone-300 disabled:opacity-40'
                  }`}
                  title="Save current chord set"
                  id="save-current-set-btn"
                >
                  <Save className={`w-3.5 h-3.5 ${showSaveForm ? 'text-white' : 'text-amber-500'}`} />
                  <span>Save Set</span>
                </button>

                <button
                  onClick={handleClearProgression}
                  disabled={sequence.length === 0}
                  className="p-2.5 bg-stone-950 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-rose-500 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  title="Clear progression"
                  id="clear-sequence-btn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Metronome dot */}
                <div 
                  className={`w-3.5 h-3.5 rounded-full border transition-all duration-100 ${
                    flashMetronome 
                      ? 'bg-amber-500 border-amber-400 scale-110 shadow-lg shadow-amber-500/50' 
                      : 'bg-stone-950 border-stone-800'
                  }`}
                  title="Metronome beat indicator"
                />
              </div>
            </div>

            {/* Playback Settings (Tempo, Instrument) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-950 border border-stone-800/60 p-4 rounded-2xl" id="playback-settings-strip">
              
              {/* Instrument select */}
              <div className="flex flex-col gap-2">
                <span className="text-stone-400 font-mono text-xs uppercase tracking-wider">
                  Playback Instrument
                </span>
                <div className="flex gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800">
                  <button
                    onClick={() => setInstrument('guitar')}
                    className={`flex-1 py-1.5 px-3 rounded-lg font-sans font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      instrument === 'guitar'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" /> Guitar Strum
                  </button>
                  <button
                    onClick={() => setInstrument('piano')}
                    className={`flex-1 py-1.5 px-3 rounded-lg font-sans font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      instrument === 'piano'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Keyboard className="w-3.5 h-3.5" /> Piano Block
                  </button>
                </div>
              </div>

              {/* Tempo BPM slider */}
              <div className="flex flex-col justify-center gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-mono text-xs uppercase tracking-wider">
                    Tempo (BPM)
                  </span>
                  <span className="text-amber-500 font-mono text-xs font-bold bg-stone-900 px-2 py-0.5 rounded-md border border-stone-800">
                    {tempo} BPM
                  </span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="185"
                  value={tempo}
                  onChange={(e) => setTempo(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

            </div>

            {/* Horizontal timeline of cards */}
            <div className="min-h-[110px] flex items-center overflow-x-auto py-2 gap-3 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-stone-950" id="sequence-cards-timeline">
              {sequence.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-stone-500 font-mono text-sm">
                    No chords in progression. Add some below or load an example!
                  </p>
                </div>
              ) : (
                sequence.map((chord, index) => {
                  const isActive = index === activeIndex;
                  const chordSuffix = CHORD_QUALITIES.find(q => q.value === chord.quality)?.suffix || '';
                  const chordLabel = `${chord.root}${chordSuffix}`;

                  return (
                    <div
                      key={`seq-chord-${index}`}
                      onClick={() => handleChordClick(index)}
                      className={`relative min-w-[95px] h-[100px] flex flex-col justify-between p-4 border rounded-2xl cursor-pointer select-none transition-all duration-150 ${
                        isActive
                          ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/50 scale-[1.03] ring-1 ring-amber-500/20'
                          : 'bg-stone-950 border-stone-850 hover:border-stone-700 hover:bg-stone-900'
                      }`}
                      id={`seq-chord-card-${index}`}
                    >
                      {/* Step Indicator */}
                      <span className="text-stone-500 font-mono text-[9px]">
                        Step {index + 1}
                      </span>

                      {/* Chord Name */}
                      <span className="text-stone-100 font-sans text-xl font-bold tracking-tight">
                        {chordLabel}
                      </span>

                      {/* Control tags */}
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[9px] text-stone-500 capitalize">
                          {chord.quality}
                        </span>
                        <button
                          onClick={(e) => handleRemoveChord(index, e)}
                          className="text-stone-600 hover:text-rose-500 p-0.5 rounded transition-colors"
                          title="Remove chord"
                          id={`seq-chord-remove-btn-${index}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Active green tracker bar at top */}
                      {isActive && (
                        <div className="absolute top-0 left-4 right-4 h-1 bg-amber-500 rounded-b" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Transposition Actions widget */}
            {sequence.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-stone-800 pt-4 gap-4" id="transposer-widget-strip">
                <div>
                  <h4 className="text-stone-300 font-sans text-xs font-bold uppercase tracking-wider mb-0.5">
                    Global Key Transposer
                  </h4>
                  <p className="text-stone-500 text-xs">
                    Shift all chord pitches relative to their original tuning
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTranspose(-1)}
                    className="px-3.5 py-2 bg-stone-950 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white font-sans font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    id="transpose-down-btn"
                  >
                    <ChevronDown className="w-4 h-4 text-amber-500" />
                    Transpose -1 (♭)
                  </button>

                  <div className="px-3 py-2 bg-stone-950 border border-stone-850 rounded-xl flex items-center gap-1.5 font-mono text-xs">
                    Shift: 
                    <span className={`font-bold ${transpositionCumulative > 0 ? 'text-emerald-500' : transpositionCumulative < 0 ? 'text-rose-500' : 'text-stone-400'}`}>
                      {transpositionCumulative > 0 ? `+${transpositionCumulative}` : transpositionCumulative} semitones
                    </span>
                    {transpositionCumulative !== 0 && (
                      <button
                        onClick={handleResetTransposition}
                        className="p-1 hover:bg-stone-900 rounded text-stone-500 hover:text-stone-200"
                        title="Reset transposer counter"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleTranspose(1)}
                    className="px-3.5 py-2 bg-stone-950 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white font-sans font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    id="transpose-up-btn"
                  >
                    <ChevronUp className="w-4 h-4 text-amber-500" />
                    Transpose +1 (♯)
                  </button>
                </div>
              </div>
            )}

            {/* Save Progression Form */}
            {showSaveForm && (
              <form onSubmit={handleSaveSet} className="bg-stone-950 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3 animate-fadeIn" id="save-progression-form">
                <div className="flex-1 w-full">
                  <label className="block text-stone-400 font-mono text-[10px] uppercase tracking-wider mb-1.5">
                    Name your chord set
                  </label>
                  <input
                    type="text"
                    required
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="e.g., Verse Progressions, Acoustic Jam..."
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 font-sans focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto sm:self-end">
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-sans font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Confirm Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSaveForm(false)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200 font-sans font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Saved progressions list */}
            {savedSets.length > 0 && (
              <div className="border-t border-stone-850 pt-4" id="saved-progressions-section">
                <h4 className="text-stone-300 font-sans text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FolderHeart className="w-4 h-4 text-amber-500" />
                  Your Saved Chord Sets ({savedSets.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {savedSets.map((set) => (
                    <div 
                      key={set.id}
                      onClick={() => handleLoadSet(set)}
                      className="group flex items-center gap-2 px-3 py-1.5 bg-stone-950 border border-stone-850 hover:border-amber-500/50 rounded-xl cursor-pointer transition-all text-xs"
                    >
                      <span className="text-stone-300 font-medium group-hover:text-amber-400 transition-colors">
                        {set.name}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        ({set.sequence.map(c => `${c.root}${CHORD_QUALITIES.find(q => q.value === c.quality)?.suffix || ''}`).join('-')})
                      </span>
                      <button
                        onClick={(e) => handleDeleteSet(set.id, e)}
                        className="text-stone-500 hover:text-rose-500 p-0.5 rounded transition-colors ml-1"
                        title="Delete saved set"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT 1 COL: Chord Selector Builder */}
          <div className="lg:col-span-1">
            <ChordSelector 
              onAddChord={handleAddChord}
              onSetSequence={(newProgression) => {
                updateSequenceWithHistory(newProgression);
                setActiveIndex(0);
                if (newProgression.length > 0) {
                  triggerChordSound(newProgression[0].root, newProgression[0].quality, instrument);
                }
              }}
            />
          </div>

        </div>

        {/* BOTTOM PANEL: Visual Diagram Showcases */}
        {activeChord ? (
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 flex flex-col gap-6" id="visual-diagrams-container">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800 pb-4 gap-2">
              <div>
                <h3 className="text-stone-100 font-sans text-lg font-semibold flex items-center gap-2">
                  <Info className="text-amber-500 w-5 h-5" />
                  Chord Details
                </h3>
                <p className="text-stone-500 text-xs">
                  Acoustic intervals, guitar frets, and piano keys for{' '}
                  <strong className="text-amber-400 font-sans">
                    {activeChord.root}
                    {CHORD_QUALITIES.find(q => q.value === activeChord.quality)?.suffix}
                  </strong>
                </p>
              </div>

              {/* Sound Previewer */}
              <button
                onClick={handlePlayActiveSound}
                className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-sans font-semibold rounded-xl text-xs shadow transition-all flex items-center gap-1.5 cursor-pointer"
                id="preview-chord-details-sound-btn"
              >
                <Volume2 className="w-4 h-4" />
                Listen (Current: {instrument === 'guitar' ? 'Guitar' : 'Piano'})
              </button>
            </div>

            {/* Note breakdown strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-stone-950 border border-stone-800/40 p-4 rounded-2xl text-center font-mono text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-stone-500 text-[10px] uppercase tracking-wider font-semibold">
                  Chord Name
                </span>
                <span className="text-amber-500 font-bold font-sans text-base">
                  {activeChord.root} {CHORD_QUALITIES.find(q => q.value === activeChord.quality)?.label}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-stone-500 text-[10px] uppercase tracking-wider font-semibold">
                  Notes Included
                </span>
                <span className="text-stone-100 font-bold text-base">
                  {activeChord.notes.join(' - ')}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
                <span className="text-stone-500 text-[10px] uppercase tracking-wider font-semibold">
                  Guitar Frets
                </span>
                <span className="text-stone-300 font-semibold text-base">
                  {activeChord.guitar.frets.map(f => (f === 'x' ? '×' : f)).join(' ')}
                </span>
              </div>
            </div>

            {/* Side-by-side diagrams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="visual-diagrams-grid">
              
              {/* Guitar Box */}
              <GuitarFretboard 
                fingering={activeChord.guitar} 
                chordName={`${activeChord.root}${CHORD_QUALITIES.find(q => q.value === activeChord.quality)?.suffix || ''}`}
              />

              {/* Piano Box */}
              <PianoKeyboard 
                activeKeys={activeChord.pianoKeys} 
                chordName={`${activeChord.root}${CHORD_QUALITIES.find(q => q.value === activeChord.quality)?.suffix || ''}`}
                chordNotes={activeChord.notes}
                preferFlats={preferFlats}
              />

            </div>

          </div>
        ) : (
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-12 text-center" id="empty-details-box">
            <Music className="w-12 h-12 text-stone-700 mx-auto mb-4" />
            <h3 className="text-stone-300 font-sans text-base font-bold mb-1">
              No Chord Selected
            </h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto">
              Please enter some chords or click on the Chord Builder to view diagrams and hear sounds.
            </p>
          </div>
        )}

      </main>

      {/* App Footer */}
      <footer className="mt-auto border-t border-stone-900 bg-stone-950 py-6 px-6 text-center text-stone-600 font-mono text-[10px]" id="app-footer-bar">
        <p className="mb-1">
          Acoustic ChordCraft Converter & Fingering Tool • Web Audio API Synthesis
        </p>
        <p>
          Created for songwriters, guitarists, and keyboard players alike.
        </p>
      </footer>
    </div>
  );
}
