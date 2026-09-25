type AudioHandle = {
  stop: () => void;
};

function canUseAudio() {
  return typeof window !== "undefined" && typeof window.AudioContext !== "undefined";
}

let shared: AudioContext | null = null;

function audioContext() {
  if (!canUseAudio()) return null;
  if (!shared || shared.state === "closed") {
    shared = new AudioContext();
  }
  return shared;
}

async function resume(ctx: AudioContext) {
  if (ctx.state === "suspended") await ctx.resume();
}

function tone(
  ctx: AudioContext,
  when: number,
  freq: number,
  duration: number,
  type: OscillatorType,
  gainValue: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(gainValue, when + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + duration + 0.02);
}

export async function startSpinSound(durationMs: number): Promise<AudioHandle> {
  const ctx = audioContext();
  if (!ctx) return { stop() {} };
  await resume(ctx);

  const master = ctx.createGain();
  master.gain.value = 0.08;
  master.connect(ctx.destination);

  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 900;
  filter.Q.value = 2.4;
  noise.connect(filter);
  filter.connect(master);
  noise.start();

  const started = ctx.currentTime;
  const duration = durationMs / 1000;
  const ticks = 52;
  for (let i = 0; i < ticks; i += 1) {
    const t = i / ticks;
    const eased = 1 - (1 - t) ** 2;
    tone(ctx, started + eased * duration, 180 + t * 40, 0.035, "square", 0.045);
  }

  return {
    stop() {
      try {
        noise.stop();
      } catch {
        // already stopped
      }
      master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    },
  };
}

export async function playStopSound() {
  const ctx = audioContext();
  if (!ctx) return;
  await resume(ctx);
  const now = ctx.currentTime;
  tone(ctx, now, 880, 0.18, "sine", 0.12);
  tone(ctx, now + 0.08, 1320, 0.28, "triangle", 0.1);
}

export async function playWinSound() {
  const ctx = audioContext();
  if (!ctx) return;
  await resume(ctx);
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, index) => {
    tone(ctx, now + index * 0.11, freq, 0.32, "triangle", 0.11);
  });
}
