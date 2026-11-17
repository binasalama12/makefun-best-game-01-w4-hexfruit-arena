// Deterministic screenshot scenes for HEXFRUIT ARENA, driven by the URL:
//   ?shot=boss&seed=11   Isle 7 boss climax vs Captain Husk, full HUD
//   ?shot=draft&seed=11  mutation draft between isles (the meta screen)
//   ?shot=title&seed=11  dense title: how-to + fruits + bestiary + difficulties
//   ?shot=end&seed=11    victory end screen: rank, 10 stats, mutation recap
// Each scene is built from the game's own systems with a fixed seed and a
// fixed number of simulated steps; main.js then renders one frame and
// raises window.__shotReady, so two renders of a scene are byte-identical.

import { FRUITS, DIFFICULTIES, ISLES, MUTATIONS, BOSSES } from './config.js';
import { makeRng } from './rng.js';
import { makeEnemy, pushBanner, burst } from './entities.js';

const byId = (id) => MUTATIONS.find((m) => m.id === id);

export function setupShotScene(S, api) {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) return false;
  const seed = parseInt(params.get('seed') || '11', 10) || 11;
  S.shotMode = shot;
  S.rng = makeRng(seed * 7919 + 17);

  if (shot === 'title') {
    S.mode = 'title';
    S.selFruit = 0; S.selDiff = 1;
    S.best = 64820;
    for (let i = 0; i < 30; i++) api.step(1 / 60);
    return true;
  }

  if (shot === 'boss') {
    S.selFruit = 4; S.selDiff = 1; // Volt, Storm
    api.startRun();
    // Stage the final-isle climax: all powers mastered, 5 mutations carried.
    S.isle = 6; S.isleName = ISLES[6].name; S.wave = 3;
    S.player.xp = 330; S.player.hp = 72; S.player.energy = 64;
    S.player.x = 420; S.player.y = 410;
    S.mutations = ['emberheart', 'swiftwake', 'energybloom', 'combocharm', 'coinmagnet'];
    S.dmgMult = 1.25;
    S.score = 58430; S.coins = 212; S.coinsCollected = 340; S.kills = 218; S.bossesKilled = 6;
    S.combo = 23; S.comboTimer = 2.1; S.bestCombo = 38;
    S.comboMult = (1 + 23 * 0.035) * 1.25;
    S.enemies = []; S.spawnQueue = []; S.projs = []; S.eprojs = [];
    const boss = makeEnemy(S, BOSSES[6].type, 890, 310, BOSSES[6]);
    boss.hp = boss.maxHp * 0.38; S.enemies.push(boss); S.bossRef = boss; S.bossActive = true;
    const escorts = [
      ['cutler', 1010, 470], ['dasher', 760, 180], ['spitter', 1080, 200],
      ['shielder', 700, 540], ['bomber', 980, 580], ['sniper', 1150, 380], ['brute', 1080, 520],
    ];
    for (const [t, x, y] of escorts) S.enemies.push(makeEnemy(S, t, x, y));
    S.spawnQueue = [{ type: 'cutler' }, { type: 'cutler' }, { type: 'spitter' }, { type: 'bomber' }];
    S.script = { mv: { x: 0.25, y: -0.12 }, aim: { x: 890, y: 310 } };
    S.banners.length = 0; // drop the startRun isle banner — this frame has one story
    pushBanner(S, 'CAPTAIN HUSK — FINAL BOSS', 'Fell him and the crossing is yours', '#ff8a9a');
    const msg = document.getElementById('msg'); if (msg) msg.textContent = '';
    for (let i = 0; i < 110; i++) {
      if (i % 9 === 0) api.fire(0);
      if (i === 30) api.fire(1);
      if (i === 55) api.fire(3); // Lightning Chain
      if (i === 80) api.fire(2); // Storm Nova
      if (i === 95) api.fire(0);
      api.step(1 / 60);
    }
    S.script = null;
    for (const e of S.enemies) e.flash = 0; // no frozen hit-flash whitening the boss
    burst(S, 890, 310, '#ffd83d', 10, 200, 0.6, 4);
    return true;
  }

  if (shot === 'draft') {
    S.selFruit = 0; S.selDiff = 1; // Ember, Storm
    api.startRun();
    S.isle = 2; S.isleName = ISLES[2].name;
    S.score = 18460; S.coins = 96; S.coinsCollected = 121; S.kills = 74;
    S.player.xp = 210; S.player.hp = 78;
    S.mutations = ['swiftwake', 'coinmagnet'];
    S.draftOffer = [byId('emberheart'), byId('thornskin'), byId('secondwind')];
    S.mode = 'draft';
    const msg2 = document.getElementById('msg'); if (msg2) msg2.textContent = '';
    for (let i = 0; i < 12; i++) api.step(1 / 60);
    return true;
  }

  if (shot === 'end') {
    S.selFruit = 0; S.selDiff = 1;
    api.startRun();
    S.isle = 6; S.isleName = ISLES[6].name;
    S.score = 64820; S.best = 64820;
    S.islesCleared = 7; S.wavesCleared = 28; S.kills = 246; S.bossesKilled = 7;
    S.bestCombo = 41; S.coinsCollected = 388; S.coins = 388;
    S.player.xp = 342; S.shotsFired = 412; S.shotsHit = 905; S.timePlayed = 754;
    S.mutations = ['emberheart', 'swiftwake', 'vitalcharm', 'energybloom', 'combocharm', 'coinmagnet'];
    S.dmgMult = 1.25;
    api.endRun(true);
    for (let i = 0; i < 12; i++) api.step(1 / 60);
    return true;
  }
  return false;
}
