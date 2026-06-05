/** 16 kHz, mono, 16-bit PCM — subscribe after sending GET:MIC (see bleProtocol.js). */
export const MIC_SAMPLE_RATE = 16000;
export { MIC_AUDIO_CHAR_UUID } from './bleProtocol';
export const MIC_DEVICE_NAME = 'nRF54L_Mic';

/** Decode little-endian PCM chunks (same layout as mic_receiver WAV frames). */
export function pcmBytesToInt16Array(data) {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const n = Math.floor(bytes.length / 2);
  const out = new Int16Array(n);
  for (let i = 0; i < n; i += 1) {
    out[i] = bytes[i * 2] | (bytes[i * 2 + 1] << 8);
    if (out[i] >= 0x8000) out[i] -= 0x10000;
  }
  return out;
}

/** Downsample int16 buffer to at most `maxPoints` for line charts. */
export function downsampleWaveform(samples, maxPoints = 512) {
  if (!samples.length) return [];
  if (samples.length <= maxPoints) {
    return samples.map((v, i) => ({
      t: (i / MIC_SAMPLE_RATE) * 1000,
      amp: v / 32768,
    }));
  }
  const block = samples.length / maxPoints;
  const rows = [];
  for (let i = 0; i < maxPoints; i += 1) {
    const start = Math.floor(i * block);
    const end = Math.min(samples.length, Math.floor((i + 1) * block));
    let peak = 0;
    for (let j = start; j < end; j += 1) {
      const a = Math.abs(samples[j]) / 32768;
      if (a > peak) peak = a;
    }
    rows.push({ t: (start / MIC_SAMPLE_RATE) * 1000, amp: peak });
  }
  return rows;
}

/** RMS per fixed-size window → envelope (time in seconds). */
export function buildRmsEnvelope(samples, windowSize = 512) {
  if (!samples.length) return [];
  const rows = [];
  for (let i = 0; i < samples.length; i += windowSize) {
    const end = Math.min(samples.length, i + windowSize);
    let sumSq = 0;
    for (let j = i; j < end; j += 1) {
      const n = samples[j] / 32768;
      sumSq += n * n;
    }
    const rms = Math.sqrt(sumSq / (end - i));
    rows.push({ t: i / MIC_SAMPLE_RATE, level: rms });
  }
  return rows;
}

function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

/** Build a WAV file blob (16-bit mono PCM), same format as mic_receiver.py output. */
export function buildWavBlob(samples, sampleRate = MIC_SAMPLE_RATE) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    view.setInt16(offset, samples[i], true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function downloadWav(samples, filename = 'mic.wav') {
  if (!samples.length) return false;
  const blob = buildWavBlob(samples);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}

/** Play int16 PCM through the browser speakers (Web Audio API). */
export async function playPcmSamples(samples, sampleRate = MIC_SAMPLE_RATE) {
  if (!samples.length) return null;

  const ctx = new AudioContext({ sampleRate });
  if (ctx.state === 'suspended') await ctx.resume();

  const audioBuffer = ctx.createBuffer(1, samples.length, sampleRate);
  const channel = audioBuffer.getChannelData(0);
  for (let i = 0; i < samples.length; i += 1) {
    channel[i] = samples[i] / 32768;
  }

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  source.start(0);

  return {
    stop: () => {
      try {
        source.stop();
      } catch (_) {
        /* already stopped */
      }
      ctx.close();
    },
    durationSec: samples.length / sampleRate,
  };
}

const VOWELS = [
  { f1: 270, f2: 2290, f3: 3010, label: 'i' },
  { f1: 530, f2: 1090, f3: 2500, label: 'a' },
  { f1: 440, f2: 750, f3: 2200, label: 'o' },
  { f1: 390, f2: 1660, f3: 2800, label: 'e' },
  { f1: 570, f2: 840, f3: 2400, label: 'u' },
];

/** Mutable state for speech-like demo audio (not a pure tone). */
export function createDummyMicState() {
  return {
    sampleIndex: 0,
    segment: 'silence',
    segmentTotal: 0,
    segmentRemaining: Math.floor(MIC_SAMPLE_RATE * 0.25),
    syllablesLeft: 0,
    f1: 500,
    f2: 1400,
    f3: 2600,
    pitchHz: 115,
    segmentGain: 0,
    noiseSeed: 0x9e3779b9,
    roomPhase: 0,
  };
}

function nextNoise(state) {
  state.noiseSeed = (state.noiseSeed * 1664525 + 1013904223) >>> 0;
  return (state.noiseSeed / 0xffffffff) * 2 - 1;
}

function smoothstep(x) {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

function startPhrase(state) {
  state.syllablesLeft = 2 + Math.floor(Math.random() * 4);
  state.segment = 'consonant';
  state.segmentTotal = Math.floor(MIC_SAMPLE_RATE * (0.025 + Math.random() * 0.035));
  state.segmentRemaining = state.segmentTotal;
  state.segmentGain = 0.55 + Math.random() * 0.2;
}

function startVowel(state) {
  const v = VOWELS[Math.floor(Math.random() * VOWELS.length)];
  state.f1 = v.f1 + (Math.random() - 0.5) * 40;
  state.f2 = v.f2 + (Math.random() - 0.5) * 80;
  state.f3 = v.f3 + (Math.random() - 0.5) * 100;
  state.pitchHz = 100 + Math.random() * 55;
  state.segment = 'vowel';
  state.segmentTotal = Math.floor(MIC_SAMPLE_RATE * (0.07 + Math.random() * 0.14));
  state.segmentRemaining = state.segmentTotal;
  state.segmentGain = 0.45 + Math.random() * 0.25;
}

function startConsonant(state) {
  state.segment = 'consonant';
  state.segmentTotal = Math.floor(MIC_SAMPLE_RATE * (0.02 + Math.random() * 0.05));
  state.segmentRemaining = state.segmentTotal;
  state.segmentGain = 0.35 + Math.random() * 0.3;
}

function startSilence(state) {
  state.segment = 'silence';
  state.segmentTotal = Math.floor(MIC_SAMPLE_RATE * (0.12 + Math.random() * 0.35));
  state.segmentRemaining = state.segmentTotal;
  state.segmentGain = 0;
  state.syllablesLeft = 0;
}

function advanceSegment(state) {
  if (state.segment === 'silence') {
    if (Math.random() < 0.65) startPhrase(state);
    else startSilence(state);
    return;
  }

  if (state.syllablesLeft <= 0) {
    startSilence(state);
    return;
  }

  if (state.segment === 'consonant') {
    startVowel(state);
    state.syllablesLeft -= 1;
    return;
  }

  if (state.segment === 'vowel') {
    if (state.syllablesLeft > 0 && Math.random() < 0.75) {
      startConsonant(state);
    } else {
      startSilence(state);
    }
  }
}

function segmentEnvelope(state) {
  if (state.segmentTotal <= 0) return 0;
  const progress = 1 - state.segmentRemaining / state.segmentTotal;
  const attack = state.segment === 'consonant' ? 0.08 : 0.12;
  const release = state.segment === 'vowel' ? 0.2 : 0.15;
  if (progress < attack) return smoothstep(progress / attack);
  if (progress > 1 - release) return smoothstep((1 - progress) / release);
  return 1;
}

function synthesizeSample(state) {
  const t = state.sampleIndex / MIC_SAMPLE_RATE;
  const env = segmentEnvelope(state) * state.segmentGain;
  const noise = nextNoise(state);

  if (state.segment === 'silence') {
    state.roomPhase += (2 * Math.PI * 60) / MIC_SAMPLE_RATE;
    return 0.015 * Math.sin(state.roomPhase) + 0.006 * noise;
  }

  if (state.segment === 'consonant') {
    const hiss = 0.55 * noise;
    const pop = 0.25 * noise * noise;
    const click = Math.abs(noise) > 0.92 ? 0.15 * Math.sign(noise) : 0;
    return env * (hiss + pop + click);
  }

  const p = state.pitchHz;
  const voice = 0.22 * Math.sin(2 * Math.PI * p * t)
    + 0.12 * Math.sin(2 * Math.PI * 2 * p * t)
    + 0.08 * Math.sin(2 * Math.PI * 3 * p * t);
  const f1 = 0.28 * Math.sin(2 * Math.PI * state.f1 * t);
  const f2 = 0.2 * Math.sin(2 * Math.PI * state.f2 * t);
  const f3 = 0.12 * Math.sin(2 * Math.PI * state.f3 * t);
  const breath = 0.04 * noise;
  const vibrato = 1 + 0.02 * Math.sin(2 * Math.PI * 4.5 * t);
  return env * vibrato * (voice + f1 + f2 + f3 + breath);
}

/**
 * Speech-like demo PCM (syllables + pauses), not a steady beep.
 * @param {number} sampleCount
 * @param {{ current: object }} stateRef — use createDummyMicState()
 */
export function generateDummyPcmChunk(sampleCount, stateRef) {
  if (!stateRef.current || typeof stateRef.current !== 'object') {
    stateRef.current = createDummyMicState();
  }
  const state = stateRef.current;
  const out = new Int16Array(sampleCount);

  for (let i = 0; i < sampleCount; i += 1) {
    if (state.segmentRemaining <= 0) advanceSegment(state);

    let sample = synthesizeSample(state);
    sample = Math.max(-0.95, Math.min(0.95, sample));
    out[i] = Math.round(sample * 32767);

    state.sampleIndex += 1;
    state.segmentRemaining -= 1;
  }

  return out;
}
