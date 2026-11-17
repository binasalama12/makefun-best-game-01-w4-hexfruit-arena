// HEXFRUIT ARENA — entities: the player, Husk corsairs, projectiles,
// particles, floating text, coin pickups, and every power kind from
// config.js (bolt, spread, nova, dash, beam, orbit, lob, chain, wave).
// All simulation lives here; render.js only draws what this module makes.

import { FIELD, FRUITS, CORSAIRS, BOSSES, ISLES, MASTERY_XP, COMBO_WINDOW, SCORE, waveComp } from './config.js';
import { range } from './rng.js';
import { sfx } from './audio.js';

export function hasMut(S, id) { return S.mutations.includes(id); }
export function mutMult(S, id, on, off = 1) { return hasMut(S, id) ? on : off; }

export function pushBanner(S, text, sub = '', color = '#ffe9b8') {
  S.banners.push({ text, sub, color, t: 2.4, max: 2.4 });
  if (S.banners.length > 2) S.banners.shift();
}

export function burst(S, x, y, color, n = 10, speed = 130, life = 0.55, size = 3) {
  for (let i = 0; i < n; i++) {
    const a = S.rng() * Math.PI * 2, v = speed * (0.3 + S.rng() * 0.9);
    S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: life * (0.5 + S.rng() * 0.7), max: life, color, size: size * (0.6 + S.rng() * 0.8) });
  }
}

export function floatText(S, x, y, text, color = '#ffe9b8', size = 15) {
  S.floats.push({ x: x + range(S.rng, -8, 8), y, text, color, size, t: 0.95, max: 0.95 });
  if (S.floats.length > 60) S.floats.shift();
}

export function unlockedPowers(S) {
  let n = 1;
  for (let i = 1; i < 4; i++) if (S.player.xp >= MASTERY_XP[i]) n = i + 1;
  return n;
}

// --- Spawning -----------------------------------------------------------------

const EDGES = [
  (r) => ({ x: FIELD.left + 30, y: range(r, FIELD.top + 40, FIELD.bottom - 40) }),
  (r) => ({ x: FIELD.right - 30, y: range(r, FIELD.top + 40, FIELD.bottom - 40) }),
  (r) => ({ x: range(r, FIELD.left + 60, FIELD.right - 60), y: FIELD.top + 26 }),
  (r) => ({ x: range(r, FIELD.left + 60, FIELD.right - 60), y: FIELD.bottom - 26 }),
];

export function makeEnemy(S, type, x, y, bossDef = null) {
  const c = CORSAIRS[type];
  const hpScale = (bossDef ? 1 : S.diff.hp) * (1 + S.isle * 0.16);
  const e = {
    type, name: bossDef ? bossDef.name : c.name, x, y,
    r: bossDef ? c.r + 16 : c.r,
    hp: (bossDef ? bossDef.hp : c.hp) * (bossDef ? S.diff.hp : hpScale),
    maxHp: (bossDef ? bossDef.hp : c.hp) * (bossDef ? S.diff.hp : hpScale),
    speed: c.speed * S.diff.speed * range(S.rng, 0.9, 1.1),
    dmg: c.dmg, score: bossDef ? SCORE.bossKill : c.score, coins: bossDef ? 40 : c.coins, xp: bossDef ? 120 : c.xp,
    color: c.color, boss: !!bossDef, t: range(S.rng, 0, 6), state: 'chase', stateT: 0,
    shootT: range(S.rng, 1.2, 2.6), hitT: 0, touchT: 0, snareT: 0, flash: 0, slamT: 2.2,
    aimX: 0, aimY: 0, dead: false,
  };
  return e;
}

export function buildWaveQueue(S) {
  S.spawnQueue = [];
  if (S.wave >= 3) {
    // Boss wave: the isle boss plus a trickle of escorts.
    const bossDef = BOSSES[S.isle];
    S.spawnQueue.push({ type: bossDef.type, bossDef });
    const escorts = ['cutler', 'spitter', 'dasher', 'bomber'];
    const n = 3 + S.isle;
    for (let i = 0; i < n; i++) S.spawnQueue.push({ type: escorts[i % escorts.length] });
    S.bossActive = true;
  } else {
    const comp = waveComp(S.isle, S.wave);
    for (const [type, count] of Object.entries(comp)) {
      for (let i = 0; i < count; i++) S.spawnQueue.push({ type });
    }
    // Shuffle deterministically so types interleave.
    for (let i = S.spawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(S.rng() * (i + 1));
      [S.spawnQueue[i], S.spawnQueue[j]] = [S.spawnQueue[j], S.spawnQueue[i]];
    }
    S.bossActive = false;
  }
  S.spawnTimer = 0.6;
  S.waveHitTaken = false;
}

export function updateSpawning(S, dt) {
  if (!S.spawnQueue.length) return;
  S.spawnTimer -= dt;
  if (S.spawnTimer <= 0) {
    const next = S.spawnQueue.shift();
    const pos = EDGES[Math.floor(S.rng() * EDGES.length)](S.rng);
    const e = makeEnemy(S, next.type, pos.x, pos.y, next.bossDef || null);
    S.enemies.push(e);
    if (e.boss) { S.bossRef = e; pushBanner(S, e.name.toUpperCase() + ' AWAKENS', S.isle === 6 ? 'Fell him and the crossing is yours' : 'The isle boss takes the field', '#ff8a9a'); sfx.boss(); S.shake = Math.max(S.shake, 7); }
    burst(S, e.x, e.y, e.color, 8, 90, 0.4, 3);
    S.spawnTimer = S.wave >= 3 && !next.bossDef ? 2.4 : range(S.rng, 0.55, 1.05);
  }
}

// --- Player -------------------------------------------------------------------

export function newPlayer() {
  return {
    x: 640, y: 400, r: 16, hp: 100, maxHp: 100, energy: 100, maxEnergy: 100,
    xp: 0, cds: [0, 0, 0, 0], hurtT: 0, dashT: 0, dashDx: 0, dashDy: 0,
    orbitT: 0, orbitAng: 0, faceA: -Math.PI / 2, moveA: 0, moving: false, stepT: 0,
  };
}

export function playerSpeed(S) { return 252 * mutMult(S, 'swiftwake', 1.18); }

export function updatePlayer(S, dt, mv, aim) {
  const p = S.player;
  p.hurtT = Math.max(0, p.hurtT - dt);
  p.stepT += dt;
  for (let i = 0; i < 4; i++) p.cds[i] = Math.max(0, p.cds[i] - dt);
  p.energy = Math.min(p.maxEnergy, p.energy + dt * 24 * mutMult(S, 'energybloom', 1.4));
  p.faceA = Math.atan2(aim.y - p.y, aim.x - p.x);
  p.moving = !!(mv.x || mv.y);
  if (p.dashT > 0) {
    p.dashT -= dt;
    p.x += p.dashDx * 1150 * dt; p.y += p.dashDy * 1150 * dt;
    if (S.rng() < 0.9) S.parts.push({ x: p.x, y: p.y, vx: range(S.rng, -20, 20), vy: range(S.rng, -20, 20), t: 0.3, max: 0.3, color: S.fruit.color, size: 4 });
    // Dash damages everything crossed.
    for (const e of S.enemies) {
      if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r + 4 && (e.dashHitT || 0) <= 0) {
        e.dashHitT = 0.45; damageEnemy(S, e, S._dashDmg || 30, p.x, p.y);
      }
    }
  } else if (p.moving) {
    const sp = playerSpeed(S);
    p.x += mv.x * sp * dt; p.y += mv.y * sp * dt;
    p.moveA = Math.atan2(mv.y, mv.x);
  }
  p.x = Math.max(FIELD.left + p.r, Math.min(FIELD.right - p.r, p.x));
  p.y = Math.max(FIELD.top + p.r, Math.min(FIELD.bottom - p.r, p.y));
  for (const e of S.enemies) e.dashHitT = Math.max(0, (e.dashHitT || 0) - dt);
  // Orbiting orbs burn what they touch.
  if (p.orbitT > 0) {
    p.orbitT -= dt; p.orbitAng += dt * 3.4;
    const orbDmg = S.fruit.powers[2].kind === 'orbit' ? S.fruit.powers[2].dmg : 18;
    for (let i = 0; i < 3; i++) {
      const a = p.orbitAng + (i * Math.PI * 2) / 3;
      const ox = p.x + Math.cos(a) * 46, oy = p.y + Math.sin(a) * 46;
      for (const e of S.enemies) {
        if (!e.dead && Math.hypot(e.x - ox, e.y - oy) < e.r + 13 && (e.orbHitT || 0) <= 0) {
          e.orbHitT = 0.34; damageEnemy(S, e, orbDmg * S.dmgMult, ox, oy);
        }
      }
    }
    for (const e of S.enemies) e.orbHitT = Math.max(0, (e.orbHitT || 0) - dt);
  }
}

export function hurtPlayer(S, dmg, sx, sy) {
  const p = S.player;
  if (p.hurtT > 0 || S.mode !== 'play') return;
  p.hurtT = 0.45;
  p.hp -= dmg;
  S.waveHitTaken = true;
  S.combo = 0; S.comboTimer = 0; S.comboMult = 1;
  S.shake = Math.max(S.shake, 5);
  burst(S, p.x, p.y, '#ff5a6a', 12, 150, 0.5, 3);
  floatText(S, p.x, p.y - 26, '-' + Math.round(dmg), '#ff8a9a', 16);
  sfx.hurt();
  if (sx !== undefined) { const a = Math.atan2(p.y - sy, p.x - sx); p.x += Math.cos(a) * 14; p.y += Math.sin(a) * 14; }
  if (p.hp <= 0) {
    if (hasMut(S, 'secondwind') && !S.secondWindUsed) {
      S.secondWindUsed = true; p.hp = p.maxHp * 0.5;
      pushBanner(S, 'SECOND WIND!', 'The sigil burns out — you rise at half health', '#8be04a');
      burst(S, p.x, p.y, '#8be04a', 30, 220, 0.8, 4); sfx.unlock();
    } else {
      p.hp = 0; S.dead = true;
    }
  }
}

// --- Powers -------------------------------------------------------------------

function spawnProj(S, x, y, a, speed, dmg, kind, color, opts = {}) {
  S.projs.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: opts.r || 6, dmg, kind, color, t: opts.life || 1.6, pierce: !!opts.pierce, hitSet: new Set() });
  S.shotsFired++;
}

export function firePower(S, idx, aim) {
  const p = S.player, fruit = S.fruit, pw = fruit.powers[idx];
  if (!pw || idx >= unlockedPowers(S) || p.cds[idx] > 0 || p.energy < pw.energy || S.mode !== 'play') return false;
  p.energy -= pw.energy; p.cds[idx] = pw.cd;
  const a = Math.atan2(aim.y - p.y, aim.x - p.x);
  const dmg = pw.dmg * S.dmgMult * (S.surgeT > 0 ? 1.5 : 1);
  if (idx === 0) sfx.shoot(); else sfx.power();
  switch (pw.kind) {
    case 'bolt': spawnProj(S, p.x + Math.cos(a) * 20, p.y + Math.sin(a) * 20, a, pw.speed, dmg, 'bolt', fruit.color); break;
    case 'spread': {
      const n = pw.count, arc = 0.62;
      for (let i = 0; i < n; i++) spawnProj(S, p.x, p.y, a + (i / (n - 1) - 0.5) * arc, pw.speed, dmg, 'bolt', fruit.color, { r: 5 });
      break;
    }
    case 'nova': {
      S.novas.push({ x: p.x, y: p.y, r: 10, maxR: pw.radius, color: fruit.color, t: 0.32, max: 0.32 });
      for (const e of [...S.enemies]) if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < pw.radius + e.r) damageEnemy(S, e, dmg, p.x, p.y);
      burst(S, p.x, p.y, fruit.color, 22, 240, 0.5, 4); S.shake = Math.max(S.shake, 3);
      break;
    }
    case 'dash': p.dashT = (pw.dist || 190) / 1150; p.dashDx = Math.cos(a); p.dashDy = Math.sin(a); S._dashDmg = dmg; burst(S, p.x, p.y, fruit.color, 10, 120, 0.35, 3); break;
    case 'beam': {
      S.beams.push({ x: p.x, y: p.y, a, len: 1300, w: pw.width, color: fruit.color, t: 0.18, max: 0.18 });
      for (const e of [...S.enemies]) {
        if (e.dead) continue;
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
        if (d > 1300) continue;
        const proj = dx * Math.cos(a) + dy * Math.sin(a);
        const perp = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
        if (proj > 0 && perp < pw.width / 2 + e.r) damageEnemy(S, e, dmg, p.x, p.y);
      }
      S.shake = Math.max(S.shake, 4); break;
    }
    case 'orbit': p.orbitT = pw.dur; burst(S, p.x, p.y, fruit.color, 14, 140, 0.4, 3); break;
    case 'lob': {
      const d = Math.min(430, Math.hypot(aim.x - p.x, aim.y - p.y));
      S.lobs.push({ x: p.x, y: p.y, tx: p.x + Math.cos(a) * d, ty: p.y + Math.sin(a) * d, t: 0, dur: 0.55, dmg, radius: pw.radius, color: fruit.color, snare: fruit.id === 'thorn' });
      break;
    }
    case 'chain': {
      let from = { x: p.x, y: p.y }, hit = new Set();
      for (let j = 0; j < (pw.jumps || 5); j++) {
        let bestE = null, bestD = 300;
        for (const e of S.enemies) { if (e.dead || hit.has(e)) continue; const d = Math.hypot(e.x - from.x, e.y - from.y); if (d < bestD) { bestD = d; bestE = e; } }
        if (!bestE) break;
        S.chains.push({ x1: from.x, y1: from.y, x2: bestE.x, y2: bestE.y, color: fruit.color, t: 0.22, max: 0.22 });
        hit.add(bestE); damageEnemy(S, bestE, dmg * (1 - j * 0.08), from.x, from.y);
        from = bestE;
      }
      if (!hit.size) floatText(S, p.x, p.y - 30, 'NO TARGET IN RANGE', '#ffd83d', 13);
      break;
    }
    case 'wave': S.projs.push({ x: p.x + Math.cos(a) * 24, y: p.y + Math.sin(a) * 24, vx: Math.cos(a) * pw.speed, vy: Math.sin(a) * pw.speed, r: pw.width / 2, dmg, kind: 'wave', color: fruit.color, t: 2.4, pierce: true, hitSet: new Set(), a }); S.shotsFired++; break;
  }
  return true;
}

// --- Damage & death -------------------------------------------------------------

export function damageEnemy(S, e, dmg, sx, sy) {
  if (e.dead) return;
  // Shielder: a hex-shield blocks shots arriving from its facing (toward player).
  if (e.type === 'shielder' && !e.boss && sx !== undefined) {
    const p = S.player;
    const toPlayer = Math.atan2(p.y - e.y, p.x - e.x);
    const fromSrc = Math.atan2(sy - e.y, sx - e.x);
    let diff = Math.abs(toPlayer - fromSrc); if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff < 0.7) { dmg *= 0.25; floatText(S, e.x, e.y - e.r - 8, 'BLOCKED', '#aebadd', 12); }
  }
  e.hp -= dmg; e.flash = 0.09;
  S.shotsHit++;
  floatText(S, e.x, e.y - e.r - 6, '-' + Math.round(dmg), '#ffe9b8', 14);
  burst(S, e.x, e.y, e.color, 3, 110, 0.3, 2.5);
  sfx.hit();
  if (sx !== undefined && !e.boss) { const a = Math.atan2(e.y - sy, e.x - sx); e.x += Math.cos(a) * 3; e.y += Math.sin(a) * 3; }
  if (e.hp <= 0) killEnemy(S, e);
}

function killEnemy(S, e) {
  e.dead = true;
  S.kills++;
  // Combo & score.
  S.combo++; S.comboTimer = COMBO_WINDOW * mutMult(S, 'combocharm', (COMBO_WINDOW + 1.4) / COMBO_WINDOW);
  // Hex Surge: every 25-chain, the fruit overloads — +50% damage for 6s.
  if (S.combo % 25 === 0 && !(S.surgeT > 0)) {
    S.surgeT = 6;
    pushBanner(S, 'HEX SURGE!', '+50% power damage for 6 seconds', S.fruit.color);
    burst(S, S.player.x, S.player.y, S.fruit.color, 26, 260, 0.7, 4);
    sfx.unlock();
  }
  S.bestCombo = Math.max(S.bestCombo, S.combo);
  S.comboMult = (1 + Math.min(S.combo, 60) * 0.035) * mutMult(S, 'combocharm', 1.25);
  const gained = Math.round(e.score * S.comboMult * S.diff.scoreMult);
  S.score += gained;
  floatText(S, e.x, e.y + 6, '+' + gained.toLocaleString('en-US'), '#ffd24d', 15);
  burst(S, e.x, e.y, e.color, e.boss ? 46 : 16, e.boss ? 300 : 190, 0.7, 4);
  sfx.kill();
  // Mastery XP — and the unlock moment.
  const before = unlockedPowers(S);
  S.player.xp += e.xp;
  const after = unlockedPowers(S);
  if (after > before) {
    const pw = S.fruit.powers[after - 1];
    pushBanner(S, 'POWER UNLOCKED: ' + pw.name.toUpperCase(), pw.desc, S.fruit.color);
    burst(S, S.player.x, S.player.y, S.fruit.color, 34, 240, 0.8, 4);
    sfx.unlock();
  }
  // Coin pickups.
  const coinN = Math.max(1, Math.round(e.coins * (S.rng() * 0.5 + 0.8)));
  for (let i = 0; i < coinN; i++) S.pickups.push({ x: e.x + range(S.rng, -14, 14), y: e.y + range(S.rng, -14, 14), t: 9, vx: range(S.rng, -30, 30), vy: range(S.rng, -30, 30) });
  // Splitter splits.
  if (e.type === 'splitter' && !e.boss) {
    for (let i = 0; i < 2; i++) {
      const m = makeEnemy(S, 'mite', e.x + range(S.rng, -16, 16), e.y + range(S.rng, -16, 16));
      S.enemies.push(m); burst(S, m.x, m.y, m.color, 5, 80, 0.3, 2);
    }
  }
  if (e.boss) {
    S.bossesKilled++; S.bossRef = null;
    S.score += Math.round((S.isle === 6 ? SCORE.captainKill : SCORE.bossKill) * S.diff.scoreMult);
    S.shake = 12;
    pushBanner(S, e.name.toUpperCase() + ' FELLED!', '+' + (S.isle === 6 ? SCORE.captainKill : SCORE.bossKill).toLocaleString('en-US') + ' score', '#ffd24d');
  }
}

// --- Enemy AI -------------------------------------------------------------------

export function updateEnemies(S, dt) {
  const p = S.player;
  for (const e of S.enemies) {
    if (e.dead) continue;
    e.t += dt; e.flash = Math.max(0, e.flash - dt); e.hitT = Math.max(0, e.hitT - dt);
    e.touchT = Math.max(0, e.touchT - dt); e.snareT = Math.max(0, e.snareT - dt);
    const dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist, uy = dy / dist;
    const slow = e.snareT > 0 ? 0.25 : 1;
    const move = (vx, vy) => { e.x += vx * dt * slow; e.y += vy * dt * slow; };
    switch (e.type) {
      case 'cutler': case 'mite': case 'brute': {
        move(ux * e.speed, uy * e.speed);
        if (e.type === 'brute') {
          e.slamT -= dt;
          if (e.slamT <= 0 && dist < 190) {
            e.slamT = 2.6; S.novas.push({ x: e.x, y: e.y, r: e.r, maxR: 120, color: '#ff5a6a', t: 0.3, max: 0.3, hostile: true });
            if (dist < 120 + p.r) hurtPlayer(S, e.dmg, e.x, e.y);
            S.shake = Math.max(S.shake, 6); burst(S, e.x, e.y, '#c9b18a', 16, 200, 0.5, 4);
          }
        }
        break;
      }
      case 'spitter': {
        if (dist > 300) move(ux * e.speed, uy * e.speed); else if (dist < 200) move(-ux * e.speed, -uy * e.speed);
        e.shootT -= dt;
        if (e.shootT <= 0 && dist < 460) { e.shootT = range(S.rng, 1.7, 2.5); S.eprojs.push({ x: e.x, y: e.y, vx: ux * 265, vy: uy * 265, r: 6, dmg: e.dmg, color: '#9fd06a', t: 2.6 }); }
        break;
      }
      case 'sniper': {
        if (dist > 420) move(ux * e.speed, uy * e.speed);
        e.shootT -= dt;
        if (e.shootT <= 0.5 && e.shootT > 0 && dist < 640) { e.aimX = p.x; e.aimY = p.y; e.state = 'aim'; }
        if (e.shootT <= 0 && dist < 640) {
          e.shootT = range(S.rng, 2.6, 3.4); e.state = 'chase';
          const a = Math.atan2(e.aimY - e.y, e.aimX - e.x);
          S.eprojs.push({ x: e.x, y: e.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 5, dmg: e.dmg, color: '#e07ae0', t: 2.2 });
          burst(S, e.x, e.y, '#e07ae0', 6, 120, 0.3, 3);
        }
        break;
      }
      case 'dasher': {
        e.stateT += dt;
        if (e.state === 'chase') {
          // Circle-strafe while closing.
          move(ux * e.speed - uy * e.speed * 0.6, uy * e.speed + ux * e.speed * 0.6);
          if (dist < 240 && e.stateT > 1.1) { e.state = 'windup'; e.stateT = 0; e.aimX = ux; e.aimY = uy; }
        } else if (e.state === 'windup') {
          if (e.stateT > 0.45) { e.state = 'lunge'; e.stateT = 0; }
        } else if (e.state === 'lunge') {
          move(e.aimX * 520, e.aimY * 520);
          if (e.stateT > 0.34) { e.state = 'chase'; e.stateT = 0; }
        }
        break;
      }
      case 'splitter': case 'shielder': move(ux * e.speed, uy * e.speed); break;
      case 'bomber': {
        move(ux * e.speed * 1.25, uy * e.speed * 1.25);
        if (dist < 44 && e.touchT <= 0) {
          e.touchT = 99; killEnemy(S, e);
          S.novas.push({ x: e.x, y: e.y, r: 8, maxR: 96, color: '#e04a5a', t: 0.3, max: 0.3, hostile: true });
          if (Math.hypot(p.x - e.x, p.y - e.y) < 96 + p.r) { S.player.hurtT = 0; hurtPlayer(S, e.dmg, e.x, e.y); }
          S.shake = Math.max(S.shake, 7);
        }
        break;
      }
    }
    // Separation so packs do not stack into one blob.
    for (const o of S.enemies) {
      if (o === e || o.dead) continue;
      const sx = e.x - o.x, sy = e.y - o.y, sd = Math.hypot(sx, sy);
      const min = e.r + o.r + 2;
      if (sd > 0 && sd < min) { e.x += (sx / sd) * (min - sd) * 0.4; e.y += (sy / sd) * (min - sd) * 0.4; }
    }
    e.x = Math.max(FIELD.left + e.r, Math.min(FIELD.right - e.r, e.x));
    e.y = Math.max(FIELD.top + e.r, Math.min(FIELD.bottom - e.r, e.y));
    // Contact damage (+ thornskin reflection).
    if (dist < e.r + p.r + 2 && e.touchT <= 0 && e.type !== 'bomber') {
      e.touchT = 0.8;
      hurtPlayer(S, e.dmg, e.x, e.y);
      if (hasMut(S, 'thornskin')) damageEnemy(S, e, e.dmg * 0.3 + 6, p.x, p.y);
    }
  }
  S.enemies = S.enemies.filter((e) => !e.dead);
}

// --- Projectiles, lobs, pickups, fx ----------------------------------------------

export function updateProjectiles(S, dt) {
  const p = S.player;
  for (const pr of S.projs) {
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.t -= dt;
    if (pr.kind === 'wave') burst(S, pr.x, pr.y, pr.color, 1, 30, 0.3, 5);
    for (const e of S.enemies) {
      if (e.dead || pr.hitSet.has(e)) continue;
      if (Math.hypot(e.x - pr.x, e.y - pr.y) < e.r + pr.r) {
        pr.hitSet.add(e);
        damageEnemy(S, e, pr.dmg, pr.x - pr.vx * 0.01, pr.y - pr.vy * 0.01);
        if (!pr.pierce) { pr.t = 0; break; }
      }
    }
    if (pr.x < FIELD.left - 30 || pr.x > FIELD.right + 30 || pr.y < FIELD.top - 30 || pr.y > FIELD.bottom + 30) pr.t = 0;
  }
  S.projs = S.projs.filter((pr) => pr.t > 0);
  for (const pr of S.eprojs) {
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.t -= dt;
    if (Math.hypot(pr.x - p.x, pr.y - p.y) < pr.r + p.r) { pr.t = 0; hurtPlayer(S, pr.dmg, pr.x - pr.vx * 0.01, pr.y - pr.vy * 0.01); }
    if (pr.x < FIELD.left - 20 || pr.x > FIELD.right + 20 || pr.y < FIELD.top - 20 || pr.y > FIELD.bottom + 20) pr.t = 0;
  }
  S.eprojs = S.eprojs.filter((pr) => pr.t > 0);
  // Lobbed hex-bombs.
  for (const l of S.lobs) {
    l.t += dt;
    if (l.t >= l.dur) {
      l.done = true;
      S.novas.push({ x: l.tx, y: l.ty, r: 8, maxR: l.radius, color: l.color, t: 0.34, max: 0.34 });
      for (const e of [...S.enemies]) {
        if (!e.dead && Math.hypot(e.x - l.tx, e.y - l.ty) < l.radius + e.r) {
          damageEnemy(S, e, l.dmg, l.tx, l.ty);
          if (l.snare) e.snareT = 1.6;
        }
      }
      burst(S, l.tx, l.ty, l.color, 20, 210, 0.5, 4); S.shake = Math.max(S.shake, 3);
    }
  }
  S.lobs = S.lobs.filter((l) => !l.done);
  // Coin pickups.
  for (const c of S.pickups) {
    c.t -= dt;
    const d = Math.hypot(p.x - c.x, p.y - c.y);
    if (hasMut(S, 'coinmagnet') && d < 190) { c.x += ((p.x - c.x) / (d || 1)) * 260 * dt; c.y += ((p.y - c.y) / (d || 1)) * 260 * dt; }
    else { c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= 0.92; c.vy *= 0.92; }
    if (d < p.r + 12) {
      c.t = 0; S.coins += hasMut(S, 'coinmagnet') ? 2 : 1; S.coinsCollected++;
      floatText(S, c.x, c.y - 10, '+1 coin', '#ffd24d', 11); sfx.coin();
    }
  }
  S.pickups = S.pickups.filter((c) => c.t > 0);
}

export function updateFx(S, dt) {
  for (const pt of S.parts) { pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vx *= 0.94; pt.vy *= 0.94; pt.t -= dt; }
  S.parts = S.parts.filter((pt) => pt.t > 0);
  for (const f of S.floats) { f.y -= 34 * dt; f.t -= dt; }
  S.floats = S.floats.filter((f) => f.t > 0);
  for (const n of S.novas) { n.t -= dt; n.r += (n.maxR - n.r) * Math.min(1, dt * 14); }
  S.novas = S.novas.filter((n) => n.t > 0);
  for (const b of S.beams) b.t -= dt;
  S.beams = S.beams.filter((b) => b.t > 0);
  for (const c of S.chains) c.t -= dt;
  S.chains = S.chains.filter((c) => c.t > 0);
  for (const b of S.banners) b.t -= dt;
  S.banners = S.banners.filter((b) => b.t > 0);
  if (S.comboTimer > 0) { S.comboTimer -= dt; if (S.comboTimer <= 0) { S.combo = 0; S.comboMult = 1; } }
  S.surgeT = Math.max(0, (S.surgeT || 0) - dt);
  S.shake = Math.max(0, S.shake - dt * 26);
}

export { FRUITS, ISLES };
