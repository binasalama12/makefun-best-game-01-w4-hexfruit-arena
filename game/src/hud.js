// The DOM HUD strip above the canvas (isle, wave, fruit, score, coins,
// combo, best) plus the hint line under the stage. The rich panels — bars,
// incoming wave, mutations, power icons — are drawn on canvas by render.js.

const el = (id) => document.getElementById(id);

export function updateHud(state) {
  const isle = el('h-isle'), wave = el('h-wave'), fruit = el('h-fruit');
  const score = el('h-score'), coins = el('h-coins'), combo = el('h-combo'), best = el('h-best');
  if (!isle) return;
  isle.textContent = state.isle ? `${state.isle + 1}/7 ${state.isleName}` : '–';
  wave.textContent = state.mode === 'play' ? (state.bossActive ? 'BOSS' : `${Math.min(state.wave + 1, 3)}/3`) : '–';
  fruit.textContent = state.fruit ? state.fruit.name : '–';
  score.textContent = Math.floor(state.score).toLocaleString('en-US');
  coins.textContent = String(state.coins);
  combo.textContent = '×' + state.comboMult.toFixed(1);
  best.textContent = Math.floor(state.best).toLocaleString('en-US');
}

let msgTimer = null;
export function setMessage(text, sticky = false) {
  const m = el('msg');
  if (!m) return;
  m.textContent = text;
  if (msgTimer) clearTimeout(msgTimer);
  if (!sticky && text) msgTimer = setTimeout(() => { m.textContent = ''; }, 5200);
}
