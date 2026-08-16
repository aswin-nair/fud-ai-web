/**
 * Synthesises the three sound cues from §11.2 into assets/sounds.
 *
 * They are generated rather than sourced so the repo carries no opaque binary
 * blob: the timbre is described here in code and can be re-tuned by editing the
 * note tables below and re-running `node scripts/make-sounds.mjs`.
 *
 * All three are warm sine tones with a soft attack and an exponential decay —
 * no click, no sharp transient. Nothing longer than 700ms.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 44_100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

/** Major-scale intervals, so every cue lands consonant rather than alarming. */
const NOTE = {
  E5: 659.25,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
  C6: 1046.5,
  E6: 1318.51,
};

/**
 * Each cue is a list of {freq, start, length, gain}. Overlapping notes ring
 * together, which is what keeps a two-note cue from sounding like two beeps.
 */
const CUES = {
  // Log confirm: a single warm note with a fifth above it. ~200ms per §11.1.
  'log-confirm': [
    { freq: NOTE.A5, start: 0, length: 0.2, gain: 0.5 },
    { freq: NOTE.E6, start: 0.02, length: 0.18, gain: 0.22 },
  ],

  // Quest complete: a rising three-note figure. Clearly an event, still short.
  'quest-complete': [
    { freq: NOTE.E5, start: 0, length: 0.18, gain: 0.42 },
    { freq: NOTE.G5, start: 0.09, length: 0.18, gain: 0.42 },
    { freq: NOTE.C6, start: 0.18, length: 0.34, gain: 0.46 },
  ],

  // Streak milestone: the same figure a step wider, with a held top note.
  'streak-milestone': [
    { freq: NOTE.G5, start: 0, length: 0.18, gain: 0.4 },
    { freq: NOTE.B5, start: 0.1, length: 0.2, gain: 0.4 },
    { freq: NOTE.E6, start: 0.2, length: 0.44, gain: 0.44 },
    { freq: NOTE.C6, start: 0.2, length: 0.44, gain: 0.2 },
  ],
};

/** Soft raised-cosine attack, exponential release. Avoids a click at onset. */
function envelope(t, length) {
  const attack = 0.012;

  if (t < attack) return 0.5 - 0.5 * Math.cos((Math.PI * t) / attack);
  return Math.exp((-4.5 * (t - attack)) / (length - attack));
}

function render(notes) {
  const duration = Math.max(...notes.map((n) => n.start + n.length));
  const samples = new Float32Array(Math.ceil(duration * RATE));

  for (const note of notes) {
    const from = Math.floor(note.start * RATE);
    const count = Math.floor(note.length * RATE);

    for (let i = 0; i < count; i += 1) {
      const t = i / RATE;
      const phase = 2 * Math.PI * note.freq * t;

      // A touch of second harmonic warms the sine without making it buzz.
      const tone = Math.sin(phase) + 0.14 * Math.sin(2 * phase);

      samples[from + i] += tone * note.gain * envelope(t, note.length);
    }
  }

  return samples;
}

function toWav(samples) {
  const bytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + bytes);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + bytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(RATE, 24);
  buffer.writeUInt32LE(RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(bytes, 40);

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32_767), 44 + i * 2);
  }

  return buffer;
}

mkdirSync(OUT, { recursive: true });

for (const [name, notes] of Object.entries(CUES)) {
  const wav = toWav(render(notes));
  writeFileSync(join(OUT, `${name}.wav`), wav);

  console.log(`${name}.wav  ${(wav.length / 1024).toFixed(1)} KB`);
}
