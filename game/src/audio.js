// Tiny WebAudio synth — no assets, no network. Blips for every action so
// every input has audible feedback; silently absent where audio is blocked.

let ac = null;
export function initAudio() {
  if (ac) return;
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { ac = null; }
}

function blip(freq, dur, type = 'square', vol = 0.05, slide = 0) {
  if (!ac) return;
  try {
    const t = ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + dur);
  } catch { /* ignore */ }
}

export const sfx = {
  shoot() { blip(520, 0.07, 'square', 0.03, -220); },
  power() { blip(340, 0.14, 'sawtooth', 0.045, 260); },
  hit() { blip(190, 0.05, 'square', 0.035, -60); },
  kill() { blip(140, 0.16, 'sawtooth', 0.05, -90); },
  hurt() { blip(110, 0.18, 'sawtooth', 0.06, -50); },
  coin() { blip(880, 0.08, 'sine', 0.04, 320); },
  unlock() { blip(523, 0.12, 'sine', 0.05); setTimeout(() => blip(784, 0.16, 'sine', 0.05), 90); },
  draft() { blip(660, 0.12, 'triangle', 0.05, 180); },
  wave() { blip(262, 0.2, 'triangle', 0.05, 130); },
  boss() { blip(98, 0.4, 'sawtooth', 0.07, -30); },
  win() { blip(523, 0.14, 'sine', 0.05); setTimeout(() => blip(659, 0.14, 'sine', 0.05), 120); setTimeout(() => blip(784, 0.22, 'sine', 0.05), 240); },
  lose() { blip(220, 0.5, 'sawtooth', 0.06, -140); },
};
