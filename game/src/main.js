// HEXFRUIT ARENA — main loop and game state.
// Eat ONE of 6 hexfruits, master its 4 powers by mastery XP, brawl Husk
// corsair waves across 7 isles, draft 1-of-3 mutations between isles, and
// fell Captain Husk on Huskhome. Modes: title → play ⇄ draft → end.

import { FRUITS, ISLES, MUTATIONS, DIFFICULTIES, SCORE } from './config.js';
import { makeRng } from './rng.js';
import { newPlayer, buildWaveQueue, updateSpawning, updatePlayer, updateEnemies, updateProjectiles, updateFx, firePower, pushBanner, unlockedPowers } from './entities.js';
import { drawPlay, drawTitle, drawDraft, drawEnd, titleRegions, draftRegions } from './render.js';
import { updateHud, setMessage } from './hud.js';
import { attachInput, keys, mouse, pressed, moveVector } from './input.js';
import { initAudio, sfx } from './audio.js';
import { setupShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const BASE_SEED = 20261117;

const S = {
  mode: 'title', shotMode: null, script: null,
  selFruit: 0, selDiff: 1, fruit: FRUITS[0], diff: DIFFICULTIES[1],
  isle: 0, isleName: ISLES[0].name, wave: 0,
  score: 0, best: 0, coins: 0, coinsCollected: 0,
  combo: 0, comboTimer: 0, comboMult: 1, bestCombo: 0,
  kills: 0, bossesKilled: 0, wavesCleared: 0, islesCleared: 0,
  shotsFired: 0, shotsHit: 0, time: 0, timePlayed: 0,
  player: newPlayer(), enemies: [], projs: [], eprojs: [], lobs: [],
  parts: [], floats: [], novas: [], beams: [], chains: [], pickups: [], banners: [],
  spawnQueue: [], spawnTimer: 0, bossActive: false, bossRef: null,
  mutations: [], draftOffer: [], waveHitTaken: false,
  shake: 0, dmgMult: 1, surgeT: 0, secondWindUsed: false, dead: false, victory: false,
  endStats: [], rng: makeRng(BASE_SEED),
};
try { S.best = parseInt(localStorage.getItem('hexfruit-best') || '0', 10) || 0; } catch { /* private mode */ }
window.__hexfruit = S;

// --- Run flow -------------------------------------------------------------------

function startRun() {
  S.fruit = FRUITS[S.selFruit]; S.diff = DIFFICULTIES[S.selDiff];
  S.score = 0; S.coins = 0; S.coinsCollected = 0; S.combo = 0; S.comboTimer = 0; S.comboMult = 1; S.bestCombo = 0;
  S.kills = 0; S.bossesKilled = 0; S.wavesCleared = 0; S.islesCleared = 0;
  S.shotsFired = 0; S.shotsHit = 0; S.timePlayed = 0;
  S.player = newPlayer(); S.enemies = []; S.projs = []; S.eprojs = []; S.lobs = [];
  S.parts = []; S.floats = []; S.novas = []; S.beams = []; S.chains = []; S.pickups = []; S.banners = [];
  S.mutations = []; S.dmgMult = 1; S.surgeT = 0; S.secondWindUsed = false; S.dead = false; S.victory = false;
  S.isle = 0; S.wave = 0; S.isleName = ISLES[0].name; S.rng = makeRng(BASE_SEED ^ (S.selFruit * 977 + S.selDiff * 131));
  buildWaveQueue(S);
  S.mode = 'play';
  pushBanner(S, `${ISLES[0].name.toUpperCase()}`, `Isle 1 of 7 — ${ISLES[0].sub}`, S.fruit.color);
  setMessage(`${S.fruit.name} eaten! Power 1 is yours — earn mastery XP to unlock the rest.`);
  sfx.wave();
}

function rollDraft() {
  const pool = MUTATIONS.filter((m) => !S.mutations.includes(m.id));
  S.draftOffer = [];
  const rng = S.rng;
  const copy = [...pool];
  while (S.draftOffer.length < 3 && copy.length) {
    S.draftOffer.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
}

function applyMutation(m) {
  S.mutations.push(m.id);
  if (m.id === 'vitalcharm') { S.player.maxHp += 40; S.player.hp = Math.min(S.player.maxHp, S.player.hp + 40); }
  if (m.id === 'emberheart') S.dmgMult = 1.25;
  sfx.draft();
}

function pickDraft(idx) {
  const m = S.draftOffer[idx];
  if (!m) return;
  applyMutation(m);
  S.isle++; S.wave = 0; S.isleName = ISLES[S.isle].name;
  S.player.x = 640; S.player.y = 400;
  S.enemies = []; S.projs = []; S.eprojs = []; S.lobs = []; S.pickups = [];
  buildWaveQueue(S);
  S.mode = 'play';
  pushBanner(S, `ISLE ${S.isle + 1} — ${ISLES[S.isle].name.toUpperCase()}`, ISLES[S.isle].sub, ISLES[S.isle].accent);
  setMessage(`${m.name} drafted. ${ISLES[S.isle].name} — wave 1 incoming.`);
  sfx.wave();
}

function endRun(victory) {
  S.victory = victory; S.mode = 'end';
  const acc = S.shotsFired ? Math.round((Math.min(S.shotsHit, S.shotsFired * 3) / (S.shotsFired * 3)) * 100) : 0;
  const mins = Math.floor(S.timePlayed / 60), secs = Math.floor(S.timePlayed % 60);
  S.endStats = [
    ['Isles cleared', `${S.islesCleared} / 7`],
    ['Waves cleared', String(S.wavesCleared)],
    ['Husks felled', String(S.kills)],
    ['Bosses felled', `${S.bossesKilled} / 7`],
    ['Best combo', `×${S.bestCombo}`],
    ['Husk coins', String(S.coinsCollected)],
    ['Mastery XP', String(Math.floor(S.player.xp))],
    ['Powers unlocked', `${unlockedPowers(S)} / 4`],
    ['Mutations drafted', String(S.mutations.length)],
    ['Crossing time', `${mins}m ${String(secs).padStart(2, '0')}s`],
  ];
  if (S.score > S.best) { S.best = S.score; try { localStorage.setItem('hexfruit-best', String(Math.floor(S.best))); } catch { /* ignore */ } }
  if (victory) sfx.win(); else sfx.lose();
  setMessage('');
}

function onWaveCleared() {
  S.wavesCleared++;
  const bonus = SCORE.waveClear * (S.wave + 1);
  S.score += Math.round(bonus * S.diff.scoreMult);
  if (!S.waveHitTaken) { S.score += SCORE.noHitWave; pushBanner(S, 'FLAWLESS WAVE!', `+${SCORE.noHitWave} no-hit bonus`, '#8be04a'); }
  if (S.wave < 3) {
    S.wave++;
    buildWaveQueue(S);
    if (S.wave >= 3) pushBanner(S, 'THE ISLE BOSS STIRS…', 'Clear the field — it is coming', '#ff8a9a');
    else pushBanner(S, `WAVE ${S.wave + 1}`, `${ISLES[S.isle].name} — hold the shore`, '#ffe9b8');
    sfx.wave();
  } else {
    // Boss wave cleared — the isle is yours.
    S.islesCleared++;
    S.score += Math.round(SCORE.isleClear * (S.isle + 1) * S.diff.scoreMult);
    S.bossActive = false;
    if (S.isle >= 6) { endRun(true); return; }
    rollDraft();
    S.mode = 'draft';
    setMessage(`Isle ${S.isle + 1} cleared! Draft a mutation to sail on.`);
  }
}

// --- Simulation -------------------------------------------------------------------

function updatePlay(dt) {
  S.time += dt; S.timePlayed += dt;
  const mv = S.script ? S.script.mv : moveVector();
  const aim = S.script ? S.script.aim : mouse;
  updatePlayer(S, dt, mv, aim);
  if (!S.script) {
    if (mouse.down) firePower(S, 0, aim);
    if (mouse.rdown) firePower(S, 1, aim);
    if (keys.has(' ')) firePower(S, 2, aim);
    if (pressed.has('e')) firePower(S, 3, aim);
    for (let i = 0; i < 4; i++) if (pressed.has(String(i + 1))) firePower(S, i, aim);
  }
  updateSpawning(S, dt);
  updateEnemies(S, dt);
  updateProjectiles(S, dt);
  updateFx(S, dt);
  if (S.dead) { endRun(false); return; }
  if (!S.spawnQueue.length && !S.enemies.length && S.mode === 'play') onWaveCleared();
}

function drawCurrent() {
  if (S.mode === 'title') drawTitle(ctx, S);
  else if (S.mode === 'play') drawPlay(ctx, S);
  else if (S.mode === 'draft') drawDraft(ctx, S);
  else if (S.mode === 'end') drawEnd(ctx, S);
  updateHud(S);
}

// --- Input routing ------------------------------------------------------------------

function inRect(x, y, r) { return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

function onClick(x, y, btn) {
  initAudio();
  if (S.mode === 'title') {
    for (const r of titleRegions.fruits) if (inRect(x, y, r)) { S.selFruit = r.idx; sfx.draft(); return; }
    for (const r of titleRegions.diffs) if (inRect(x, y, r)) { S.selDiff = r.idx; sfx.draft(); return; }
    if (inRect(x, y, titleRegions.start)) { startRun(); return; }
  } else if (S.mode === 'draft' && btn === 0) {
    draftRegions.cards.forEach((r, i) => { if (inRect(x, y, r)) pickDraft(i); });
  }
}
attachInput(canvas, onClick);

function handleKeys() {
  if (pressed.has('enter')) {
    if (S.mode === 'title') startRun();
    else if (S.mode === 'end') { S.mode = 'title'; setMessage('Pick a hexfruit and sail again.'); }
  }
  if (S.mode === 'draft') {
    for (let i = 0; i < 3; i++) if (pressed.has(String(i + 1))) pickDraft(i);
  }
  pressed.clear();
}

// --- Loop -----------------------------------------------------------------------------

let last = performance.now();
function animate(now) {
  const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
  last = now;
  if (S.mode === 'play') updatePlay(dt);
  else { S.time += dt; updateFx(S, dt); }
  handleKeys();
  drawCurrent();
  requestAnimationFrame(animate);
}

const api = {
  S,
  startRun,
  step: (dt) => { if (S.mode === 'play') updatePlay(dt); else { S.time += dt; updateFx(S, dt); } },
  fire: (i) => firePower(S, i, S.script ? S.script.aim : mouse),
  pickDraft,
  endRun,
};

if (setupShotScene(S, api)) {
  drawCurrent();
  window.__shotReady = true;
} else {
  setMessage('Click a hexfruit, pick a difficulty, then SAIL — WASD to move, mouse to aim.');
  requestAnimationFrame(animate);
}
