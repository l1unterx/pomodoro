// Synthesized completion tones via the Web Audio API - no audio assets or
// dependencies needed. The AudioContext must be created/resumed from a user
// gesture (the Start click) before browsers will allow it to produce sound
// later, when a timer completes without further interaction.

let audioCtx: AudioContext | null = null;

export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  audioCtx = audioCtx ?? new Ctor();
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
}

function playTone(frequencies: number[], noteDurationMs = 160): void {
  if (!audioCtx) return;
  const ctx = audioCtx;

  frequencies.forEach((freq, i) => {
    const startTime = ctx.currentTime + (i * noteDurationMs) / 1000;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDurationMs / 1000);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + noteDurationMs / 1000);
  });
}

export function playWorkCompleteSound(): void {
  playTone([880, 1108]);
}

export function playBreakCompleteSound(): void {
  playTone([660, 523, 440]);
}
