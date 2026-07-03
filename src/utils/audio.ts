let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Converts a MIDI note number to frequency
 */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Synthesizes an individual plucked/struck string or key note.
 */
function playSynthNote(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  type: 'guitar' | 'piano'
) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  // Combine oscillators for a richer acoustic-like sound
  osc.frequency.value = freq;
  
  if (type === 'guitar') {
    // Triangle wave for mellow pluck base, with slight sawtooth for string wire vibration
    osc.type = 'triangle';
    
    // Add custom filter for warm acoustic decay
    filter.type = 'lowpass';
    filter.Q.value = 1;
    filter.frequency.setValueAtTime(1000, startTime);
    filter.frequency.exponentialRampToValueAtTime(150, startTime + duration);
    
    // Pluck Envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.01); // sharp pluck attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // smooth ring out
  } else {
    // Piano style - pure sine blended with triangle for a Rhodes/Wurlitzer classic vibe
    osc.type = 'sine';
    
    filter.type = 'lowpass';
    filter.Q.value = 1;
    filter.frequency.setValueAtTime(2000, startTime);
    filter.frequency.exponentialRampToValueAtTime(300, startTime + duration);

    // Keyboard strike envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.03); // slightly softer strike attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  }

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.1);
}

/**
 * Plays a guitar chord by strumming the strings sequentially (low to high)
 * frets: Array of fret numbers or 'x' from low E (idx 0) to high e (idx 5)
 */
export function playGuitarStrum(frets: (number | 'x')[], baseMidis: number[]) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const strumSpeed = 0.06; // Delay between string plucks (seconds)
    const noteDuration = 1.8;

    // We strum from String 6 (idx 0) down to String 1 (idx 5)
    let playedAny = false;
    frets.forEach((fret, index) => {
      if (fret !== 'x') {
        const midiNote = baseMidis[index] + fret;
        const freq = midiToFreq(midiNote);
        const startTime = now + index * strumSpeed;
        playSynthNote(ctx, freq, startTime, noteDuration, 'guitar');
        playedAny = true;
      }
    });

    return playedAny;
  } catch (error) {
    console.error('Failed to play guitar chord:', error);
    return false;
  }
}

/**
 * Plays a piano chord as a gorgeous simultaneous block chord
 * midiNotes: Array of midi note values to play
 */
export function playPianoChord(midiNotes: number[]) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const noteDuration = 2.2;

    midiNotes.forEach((midi, idx) => {
      // Offset slightly to make it sound hand-played rather than computerized (strum-like but very fast)
      const humanizeOffset = idx * 0.015;
      const freq = midiToFreq(midi);
      playSynthNote(ctx, freq, now + humanizeOffset, noteDuration, 'piano');
    });

    return midiNotes.length > 0;
  } catch (error) {
    console.error('Failed to play piano chord:', error);
    return false;
  }
}
