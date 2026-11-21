// The Quiet Stacks — sound, synthesised live with WebAudio: soft
// footsteps, a hush of night ambience, a chime for each manuscript,
// a rising sting when a guard spots the thief. No audio files, no
// network — every sound is built from oscillators at run time.
export function buildAudio() {
  return { ctx: null, master: null, ambience: null, enabled: true };
}

function ensureContext(audio) {
  if (audio.ctx) return audio.ctx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  audio.ctx = new Ctor();
  audio.master = audio.ctx.createGain();
  audio.master.gain.value = 0.5;
  audio.master.connect(audio.ctx.destination);
  return audio.ctx;
}

export function unlockAudio(audio) {
  const ctx = ensureContext(audio);
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  startAmbience(audio);
}

function startAmbience(audio) {
  if (!audio.ctx || audio.ambience) return;
  const ctx = audio.ctx;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.04;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 320;
  const gain = ctx.createGain();
  gain.gain.value = 0.5;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audio.master);
  source.start();
  audio.ambience = source;
  // A slow, low library hum underneath the hush.
  const hum = ctx.createOscillator();
  hum.type = 'sine';
  hum.frequency.value = 55;
  const humGain = ctx.createGain();
  humGain.gain.value = 0.03;
  hum.connect(humGain);
  humGain.connect(audio.master);
  hum.start();
}

function blip(audio, freq, dur, type, vol, when = 0) {
  if (!audio.ctx || !audio.enabled) return;
  const ctx = audio.ctx;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const gain = ctx.createGain();
  const t0 = ctx.currentTime + when;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playStep(audio, running) {
  if (!audio.ctx) return;
  blip(audio, running ? 150 : 110, 0.09, 'triangle', running ? 0.16 : 0.09);
}

export function playPickup(audio) {
  blip(audio, 660, 0.18, 'sine', 0.22);
  blip(audio, 990, 0.28, 'sine', 0.2, 0.09);
  blip(audio, 1320, 0.32, 'sine', 0.14, 0.18);
}

export function playSpotted(audio) {
  blip(audio, 220, 0.16, 'square', 0.12);
  blip(audio, 330, 0.22, 'square', 0.12, 0.12);
}

export function playAlarm(audio) {
  blip(audio, 440, 0.2, 'sawtooth', 0.16);
  blip(audio, 587, 0.2, 'sawtooth', 0.16, 0.16);
  blip(audio, 880, 0.4, 'sawtooth', 0.14, 0.32);
}

export function playCaught(audio) {
  blip(audio, 196, 0.5, 'sawtooth', 0.2);
  blip(audio, 147, 0.7, 'sawtooth', 0.2, 0.3);
}

export function playWin(audio) {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => blip(audio, n, 0.35, 'sine', 0.2, i * 0.13));
}

export function playHeard(audio) {
  blip(audio, 180, 0.14, 'triangle', 0.12);
}

export function setAudioEnabled(audio, enabled) {
  audio.enabled = enabled;
  if (audio.master) audio.master.gain.value = enabled ? 0.5 : 0;
}
