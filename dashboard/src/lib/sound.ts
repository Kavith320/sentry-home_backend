// Modern Warm Ambient Web Audio Synthesizer for Security Alerts

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('sentry_sound_enabled');
    if (saved !== null) {
      soundEnabled = saved === 'true';
    }
  }
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('sentry_sound_enabled', String(enabled));
  }
}

/**
 * Modern, calm, glassy 3-note arpeggio chime for Security Alerts (C6 -> E6 -> G6)
 */
export function playAlarmSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [1046.5, 1318.51, 1567.98]; // C6, E6, G6 (Major Triad Chime)

    notes.forEach((freq, index) => {
      const startTime = now + index * 0.08;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine'; // Pure, calm sine wave
      osc.frequency.setValueAtTime(freq, startTime);

      // Soft envelope for a warm, glassy Ping sound
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02); // Smooth attack
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5); // Warm decay

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  } catch (err) {
    console.warn('Audio playback restricted by browser policy:', err);
  }
}

/**
 * Calm, subtle two-note glass ping for warnings / nominal notifications (A5 -> C6)
 */
export function playWarningSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [880, 1046.5]; // A5 -> C6

    notes.forEach((freq, index) => {
      const startTime = now + index * 0.09;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  } catch (err) {
    console.warn('Audio playback warning:', err);
  }
}
