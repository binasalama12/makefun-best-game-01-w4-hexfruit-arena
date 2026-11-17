// HEXFRUIT ARENA — canvas renderer: textured isle arenas, every actor,
// the full HUD (bars, mastery, powers, incoming wave, mutations, WIN/LOSE
// ribbon, combo, boss bar, banners, floating numbers) and the title,
// mutation-draft and end screens. Pure drawing: all state comes from main.

import { FIELD, FRUITS, CORSAIRS, BESTIARY, ISLES, MUTATIONS, DIFFICULTIES, MASTERY_XP } from './config.js';
import { makeRng } from './rng.js';
import { unlockedPowers } from './entities.js';

const W = 1280, H = 720;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function panel(ctx, x, y, w, h, fill = 'rgba(10,6,24,0.78)') {
  ctx.fillStyle = fill; rr(ctx, x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(185,168,232,0.35)'; ctx.lineWidth = 1; ctx.stroke();
}
function txt(ctx, s, x, y, size = 14, color = '#ffe9b8', align = 'left', bold = false) {
  ctx.fillStyle = color; ctx.font = `${bold ? 'bold ' : ''}${size}px Georgia, serif`;
  ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y);
}
function bar(ctx, x, y, w, h, frac, color, bg = 'rgba(255,255,255,0.13)') {
  ctx.fillStyle = bg; rr(ctx, x, y, w, h, h / 2); ctx.fill();
  if (frac > 0.003) { ctx.fillStyle = color; rr(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2); ctx.fill(); }
}
function hexPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i - Math.PI / 2; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.closePath();
}

// --- Arena background -----------------------------------------------------------

const bgCache = {};
export function drawBackground(ctx, isleIdx) {
  if (bgCache[isleIdx]) { ctx.drawImage(bgCache[isleIdx], 0, 0); return; }
  const isle = ISLES[isleIdx];
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const c = off.getContext('2d');
  const rng = makeRng(9000 + isleIdx * 131);
  // Sea surround + sandy rim + textured ground.
  const sea = c.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, '#0d1b33'); sea.addColorStop(1, '#081226');
  c.fillStyle = sea; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(120,180,255,0.25)';
  for (let i = 0; i < 26; i++) { // wavelets in the sea margin
    const y = rng() * H, x = rng() * W;
    if (x > FIELD.left - 14 && x < FIELD.right + 14 && y > FIELD.top - 14 && y < FIELD.bottom + 14) continue;
    c.beginPath(); c.arc(x, y, 6 + rng() * 10, 0.2, Math.PI - 0.4); c.stroke();
  }
  c.fillStyle = isle.sand; c.fillRect(FIELD.left - 16, FIELD.top - 16, (FIELD.right - FIELD.left) + 32, (FIELD.bottom - FIELD.top) + 32);
  c.fillStyle = isle.ground; c.fillRect(FIELD.left, FIELD.top, FIELD.right - FIELD.left, FIELD.bottom - FIELD.top);
  for (let i = 0; i < 900; i++) { // ground grain
    c.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.10)';
    c.fillRect(FIELD.left + rng() * (FIELD.right - FIELD.left), FIELD.top + rng() * (FIELD.bottom - FIELD.top), 2.4, 2.4);
  }
  for (let i = 0; i < 22; i++) { // rocks, tufts, motif marks
    const x = FIELD.left + 30 + rng() * (FIELD.right - FIELD.left - 60);
    const y = FIELD.top + 30 + rng() * (FIELD.bottom - FIELD.top - 60);
    c.strokeStyle = isle.accent + '55'; c.fillStyle = isle.accent + '2e'; c.lineWidth = 2;
    if (isle.motif === 'ember') { c.beginPath(); c.moveTo(x - 12, y); c.lineTo(x - 3, y - 7); c.lineTo(x + 5, y + 2); c.lineTo(x + 13, y - 5); c.stroke(); }
    else if (isle.motif === 'gale') { c.beginPath(); c.arc(x, y, 9, 0.4, 4.6); c.stroke(); }
    else if (isle.motif === 'tide') { c.beginPath(); c.arc(x - 8, y, 8, Math.PI, 0); c.arc(x + 8, y, 8, Math.PI, 0); c.stroke(); }
    else if (isle.motif === 'thorn') { c.beginPath(); c.moveTo(x - 10, y + 8); c.quadraticCurveTo(x, y - 12, x + 10, y + 6); c.stroke(); c.beginPath(); c.moveTo(x, y - 2); c.lineTo(x + 4, y - 9); c.stroke(); }
    else if (isle.motif === 'volt') { c.beginPath(); c.moveTo(x + 3, y - 11); c.lineTo(x - 4, y + 1); c.lineTo(x + 1, y + 1); c.lineTo(x - 3, y + 11); c.stroke(); }
    else if (isle.motif === 'umbra') { c.beginPath(); c.arc(x, y, 7, 0.6, 5.2); c.arc(x + 4, y - 2, 5.5, 0.6, 5.2); c.stroke(); }
    else { c.beginPath(); c.arc(x, y, 8, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(x - 8, y + 12); c.lineTo(x + 8, y + 12); c.stroke(); }
  }
  c.strokeStyle = isle.accent; c.lineWidth = 3; c.globalAlpha = 0.65;
  c.strokeRect(FIELD.left, FIELD.top, FIELD.right - FIELD.left, FIELD.bottom - FIELD.top);
  c.globalAlpha = 1;
  const vg = c.createRadialGradient(640, 380, 320, 640, 380, 760);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.42)');
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
  bgCache[isleIdx] = off;
  ctx.drawImage(off, 0, 0);
}

// --- Actors -----------------------------------------------------------------------

function drawEnemy(ctx, S, e) {
  const p = S.player;
  const face = Math.atan2(p.y - e.y, p.x - e.x);
  ctx.save(); ctx.translate(e.x, e.y);
  if (e.flash > 0) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 16; }
  // Sniper telegraph.
  if (e.type === 'sniper' && e.state === 'aim') {
    ctx.save(); ctx.rotate(face); ctx.strokeStyle = 'rgba(224,122,224,0.55)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(620, 0); ctx.stroke(); ctx.restore();
  }
  ctx.fillStyle = e.flash > 0 ? '#ffffff' : e.color;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 2;
  if (e.type === 'dasher') {
    ctx.rotate(face + Math.PI / 4); ctx.fillRect(-e.r * 0.8, -e.r * 0.8, e.r * 1.6, e.r * 1.6); ctx.strokeRect(-e.r * 0.8, -e.r * 0.8, e.r * 1.6, e.r * 1.6); ctx.rotate(-(face + Math.PI / 4));
  } else if (e.type === 'splitter') {
    ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-6, 2, e.r * 0.45, 0, Math.PI * 2); ctx.arc(7, -3, e.r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  // Type furniture.
  ctx.rotate(face);
  if (e.type === 'cutler' || e.type === 'mite') { // blade
    ctx.fillStyle = '#e8e4da'; ctx.beginPath(); ctx.moveTo(e.r - 2, 0); ctx.lineTo(e.r + 13, -4); ctx.lineTo(e.r + 13, 4); ctx.closePath(); ctx.fill();
  } else if (e.type === 'spitter') {
    ctx.fillStyle = '#2c4a16'; ctx.beginPath(); ctx.arc(e.r - 3, 0, 6, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'shielder') { // hex-shield arc toward the player
    ctx.strokeStyle = '#cfe0ff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, e.r + 6, -0.95, 0.95); ctx.stroke();
  } else if (e.type === 'bomber') {
    ctx.strokeStyle = '#ffd24d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -e.r); ctx.quadraticCurveTo(5, -e.r - 8, 9, -e.r - 6); ctx.stroke();
    ctx.fillStyle = (Math.sin(S.time * 14) > 0) ? '#fff2a8' : '#ff9a3d'; ctx.beginPath(); ctx.arc(9, -e.r - 6, 3, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'sniper') {
    ctx.fillStyle = '#3a2440'; ctx.fillRect(e.r - 4, -3, 22, 6);
  } else if (e.type === 'brute' || e.boss) {
    ctx.fillStyle = '#efe6cc'; ctx.beginPath(); ctx.moveTo(-e.r * 0.6, -e.r * 0.7); ctx.lineTo(-e.r * 0.95, -e.r * 1.15); ctx.lineTo(-e.r * 0.25, -e.r * 0.9); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(e.r * 0.6, -e.r * 0.7); ctx.lineTo(e.r * 0.95, -e.r * 1.15); ctx.lineTo(e.r * 0.25, -e.r * 0.9); ctx.closePath(); ctx.fill();
  }
  ctx.rotate(-face);
  // Eyes.
  const ex = Math.cos(face), ey = Math.sin(face);
  ctx.fillStyle = '#14100a';
  ctx.beginPath(); ctx.arc(ex * 5 - ey * 6, ey * 5 + ex * 6, 2.6, 0, Math.PI * 2); ctx.arc(ex * 5 + ey * 6, ey * 5 - ex * 6, 2.6, 0, Math.PI * 2); ctx.fill();
  if (e.boss) { // crown
    ctx.fillStyle = '#ffd24d'; ctx.beginPath();
    ctx.moveTo(-13, -e.r - 2); ctx.lineTo(-13, -e.r - 13); ctx.lineTo(-6, -e.r - 6); ctx.lineTo(0, -e.r - 14); ctx.lineTo(6, -e.r - 6); ctx.lineTo(13, -e.r - 13); ctx.lineTo(13, -e.r - 2); ctx.closePath(); ctx.fill();
    txt(ctx, e.name, 0, -e.r - 20, 13, '#ffd24d', 'center', true);
  }
  if (e.snareT > 0) { ctx.strokeStyle = '#8be04a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, e.r + 4, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
  if (e.hp < e.maxHp && !e.boss) bar(ctx, e.x - 20, e.y - e.r - 12, 40, 5, e.hp / e.maxHp, '#e04a5a');
}

function drawPlayer(ctx, S) {
  const p = S.player, f = S.fruit;
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.shadowColor = f.color; ctx.shadowBlur = 18;
  ctx.fillStyle = f.dark; ctx.beginPath(); ctx.arc(0, 0, p.r + 3, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(0, 0, p.r - 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  // Face toward aim.
  const fx = Math.cos(p.faceA), fy = Math.sin(p.faceA);
  ctx.fillStyle = '#ffe9c9'; ctx.beginPath(); ctx.arc(fx * 5, fy * 5, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#14100a'; ctx.beginPath(); ctx.arc(fx * 8 - fy * 3, fy * 8 + fx * 3, 1.8, 0, Math.PI * 2); ctx.arc(fx * 8 + fy * 3, fy * 8 - fx * 3, 1.8, 0, Math.PI * 2); ctx.fill();
  // Hexfruit badge overhead.
  hexPath(ctx, fx * 2, -p.r - 12 + Math.sin(S.time * 3) * 2, 8);
  ctx.fillStyle = f.color; ctx.fill(); ctx.strokeStyle = '#ffe9b8'; ctx.lineWidth = 1.2; ctx.stroke();
  if (p.hurtT > 0.2) { ctx.fillStyle = 'rgba(255,60,80,0.35)'; ctx.beginPath(); ctx.arc(0, 0, p.r + 5, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  if (p.orbitT > 0) {
    for (let i = 0; i < 3; i++) {
      const a = p.orbitAng + (i * Math.PI * 2) / 3;
      const ox = p.x + Math.cos(a) * 46, oy = p.y + Math.sin(a) * 46;
      ctx.save(); ctx.shadowColor = f.color; ctx.shadowBlur = 14; ctx.fillStyle = f.color;
      ctx.beginPath(); ctx.arc(ox, oy, 9, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
}

// --- Play frame ---------------------------------------------------------------------

const KEY_LABELS = ['LMB', 'RMB', 'SPC', 'E'];
export function drawPlay(ctx, S) {
  const shakeX = S.shake ? (S.rng() - 0.5) * S.shake : 0;
  const shakeY = S.shake ? (S.rng() - 0.5) * S.shake : 0;
  ctx.save(); ctx.translate(shakeX, shakeY);
  drawBackground(ctx, S.isle);
  // Pickups.
  for (const c of S.pickups) {
    const bob = Math.sin(S.time * 5 + c.x) * 2;
    ctx.fillStyle = '#ffd24d'; ctx.beginPath(); ctx.arc(c.x, c.y + bob, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a87b00'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#a87b00'; ctx.font = 'bold 9px Georgia'; ctx.textAlign = 'center'; ctx.fillText('H', c.x, c.y + bob + 3);
  }
  // Lob arcs + target reticles.
  for (const l of S.lobs) {
    const k = l.t / l.dur, x = l.x + (l.tx - l.x) * k, y = l.y + (l.ty - l.y) * k - Math.sin(k * Math.PI) * 90;
    ctx.strokeStyle = l.color; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(l.tx, l.ty, l.radius * 0.5, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = l.color; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
  }
  for (const e of S.enemies) drawEnemy(ctx, S, e);
  drawPlayer(ctx, S);
  // Projectiles.
  for (const pr of S.projs) {
    ctx.save(); ctx.shadowColor = pr.color; ctx.shadowBlur = 12; ctx.fillStyle = pr.color;
    if (pr.kind === 'wave') { ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = pr.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r * 0.8, 0, Math.PI * 2); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  for (const pr of S.eprojs) {
    ctx.save(); ctx.shadowColor = pr.color; ctx.shadowBlur = 8; ctx.fillStyle = pr.color;
    ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  // Beams, chains, novas.
  for (const b of S.beams) {
    ctx.save(); ctx.globalAlpha = (b.t / b.max) * 0.9; ctx.strokeStyle = b.color; ctx.lineWidth = b.w; ctx.lineCap = 'round';
    ctx.shadowColor = b.color; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(b.a) * b.len, b.y + Math.sin(b.a) * b.len); ctx.stroke(); ctx.restore();
  }
  for (const ch of S.chains) {
    ctx.save(); ctx.globalAlpha = ch.t / ch.max; ctx.strokeStyle = ch.color; ctx.lineWidth = 3; ctx.shadowColor = ch.color; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(ch.x1, ch.y1);
    const mx = (ch.x1 + ch.x2) / 2 + (S.rng() - 0.5) * 26, my = (ch.y1 + ch.y2) / 2 + (S.rng() - 0.5) * 26;
    ctx.lineTo(mx, my); ctx.lineTo(ch.x2, ch.y2); ctx.stroke(); ctx.restore();
  }
  for (const n of S.novas) {
    ctx.save(); ctx.globalAlpha = (n.t / n.max) * 0.75; ctx.strokeStyle = n.color; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  // Particles + floating text.
  for (const pt of S.parts) { ctx.globalAlpha = Math.max(0, pt.t / pt.max); ctx.fillStyle = pt.color; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
  for (const f of S.floats) { ctx.globalAlpha = Math.max(0, f.t / f.max); txt(ctx, f.text, f.x, f.y, f.size, f.color, 'center', true); }
  ctx.globalAlpha = 1;
  ctx.restore();
  drawHudPanels(ctx, S);
  drawBanners(ctx, S);
}

function drawHudPanels(ctx, S) {
  const p = S.player, f = S.fruit;
  // Objective ribbon — WIN / LOSE explicit, top centre.
  panel(ctx, 330, 50, 620, 30);
  const now = S.bossActive ? `FELL ${BOSSES_NAME(S)}` : `clear wave ${Math.min(S.wave + 1, 3)}/3 — ${S.enemies.length + S.spawnQueue.length} husks left`;
  txt(ctx, `WIN: fell Captain Husk on Isle 7/7   ·   LOSE: your HP reaches 0   ·   NOW: Isle ${S.isle + 1} — ${now}`, 640, 70, 13.5, '#ffe9b8', 'center', true);
  // Resource bars, top-left.
  panel(ctx, 14, 50, 300, 96);
  txt(ctx, 'HP', 26, 72, 12, '#ff9aa5', 'left', true); bar(ctx, 62, 62, 190, 11, p.hp / p.maxHp, p.hp > 30 ? '#5ad06a' : '#e04a5a');
  txt(ctx, `${Math.ceil(p.hp)}/${p.maxHp}`, 258, 72, 11, '#ffe9b8');
  txt(ctx, 'NRG', 26, 94, 12, '#8ad0ff', 'left', true); bar(ctx, 62, 84, 190, 11, p.energy / p.maxEnergy, '#3fa9ff');
  txt(ctx, `${Math.floor(p.energy)}`, 258, 94, 11, '#ffe9b8');
  const unl = unlockedPowers(S);
  txt(ctx, 'MASTERY', 26, 116, 11, '#cfa9ff', 'left', true);
  bar(ctx, 92, 106, 160, 10, Math.min(1, p.xp / MASTERY_XP[3]), '#b06bff');
  for (let i = 1; i < 4; i++) { const x = 92 + 160 * (MASTERY_XP[i] / MASTERY_XP[3]); ctx.fillStyle = p.xp >= MASTERY_XP[i] ? '#ffd24d' : '#5a4a86'; ctx.fillRect(x - 1, 104, 2, 14); }
  txt(ctx, unl >= 4 ? 'MASTERED' : `Lv${unl} · next: ${f.powers[unl].name}`, 26, 138, 11, '#cfa9ff');
  // Powers, bottom-left.
  panel(ctx, 14, H - 96, 316, 84);
  for (let i = 0; i < 4; i++) {
    const pw = f.powers[i], x = 24 + i * 76, y = H - 86, locked = i >= unl;
    ctx.fillStyle = locked ? 'rgba(30,24,54,0.9)' : 'rgba(24,16,48,0.9)'; rr(ctx, x, y, 66, 56, 8); ctx.fill();
    ctx.strokeStyle = locked ? '#4a3f74' : f.color; ctx.lineWidth = 2; ctx.stroke();
    txt(ctx, KEY_LABELS[i], x + 33, y + 15, 10, '#b9a8e8', 'center', true);
    if (locked) {
      txt(ctx, 'LOCKED', x + 33, y + 34, 10, '#8a7ab8', 'center', true);
      txt(ctx, `${MASTERY_XP[i]} XP`, x + 33, y + 48, 9, '#8a7ab8', 'center');
    } else {
      txt(ctx, pw.name.split(' ')[1] || pw.name, x + 33, y + 32, 11, '#ffe9b8', 'center', true);
      txt(ctx, pw.energy ? `${pw.energy} NRG` : 'FREE', x + 33, y + 47, 9, '#8ad0ff', 'center');
      if (p.cds[i] > 0) { const hfrac = Math.min(1, p.cds[i] / pw.cd); ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(x, y + 56 * (1 - hfrac) - 0, 66, 56 * hfrac); }
    }
  }
  txt(ctx, `${f.name} powers — mastery XP ${Math.floor(p.xp)}`, 24, H - 4, 11, f.color);
  // Incoming wave panel, top-right.
  const comp = {};
  for (const q of S.spawnQueue) comp[q.type] = (comp[q.type] || 0) + 1;
  const rows = Object.entries(comp).slice(0, 5);
  panel(ctx, W - 274, 50, 260, 34 + Math.max(1, rows.length) * 17 + 8);
  txt(ctx, S.bossActive ? 'INCOMING — BOSS WAVE' : `INCOMING — WAVE ${Math.min(S.wave + 1, 3)}/3`, W - 262, 70, 12, '#ff9aa5', 'left', true);
  if (!rows.length) txt(ctx, `on field: ${S.enemies.length} husks`, W - 262, 90, 12, '#ffe9b8');
  rows.forEach(([t, n], i) => txt(ctx, `${CORSAIRS[t].name} ×${n}`, W - 262, 90 + i * 17, 12, CORSAIRS[t].color));
  // Active mutations panel, under incoming.
  const my = 50 + 34 + Math.max(1, rows.length) * 17 + 16;
  panel(ctx, W - 274, my, 260, 30 + Math.max(1, S.mutations.length) * 17);
  txt(ctx, `MUTATIONS (${S.mutations.length}/8)`, W - 262, my + 20, 12, '#8be04a', 'left', true);
  if (!S.mutations.length) txt(ctx, 'none yet — draft between isles', W - 262, my + 40, 11, '#b9a8e8');
  S.mutations.forEach((id, i) => { const m = MUTATIONS.find((mm) => mm.id === id); if (m) txt(ctx, `[${m.icon}] ${m.name}`, W - 262, my + 40 + i * 17, 12, '#d8f5c0'); });
  // Combo, right-centre.
  if (S.combo >= 3) {
    txt(ctx, `COMBO ×${S.comboMult.toFixed(1)}`, W - 30, 400, 26, '#ffd24d', 'right', true);
    txt(ctx, `${S.combo} chain`, W - 30, 424, 14, '#ffe9b8', 'right');
    bar(ctx, W - 190, 432, 160, 6, S.comboTimer / (COMBO_LEN(S)), '#ffd24d');
  }
  // Boss HP, bottom-centre.
  if (S.bossRef && !S.bossRef.dead) {
    panel(ctx, 390, H - 52, 500, 40);
    txt(ctx, S.bossRef.name, 640, H - 34, 13, '#ff8a9a', 'center', true);
    bar(ctx, 410, H - 28, 460, 10, S.bossRef.hp / S.bossRef.maxHp, '#e04a5a');
  }
}
function BOSSES_NAME(S) { return S.bossRef ? S.bossRef.name : 'THE ISLE BOSS'; }
function COMBO_LEN(S) { return 2.6 * (S.mutations.includes('combocharm') ? (2.6 + 1.4) / 2.6 : 1); }

function drawBanners(ctx, S) {
  S.banners.forEach((b, i) => {
    const a = Math.min(1, b.t / 0.5, (b.max - b.t) / 0.3 + 0.2);
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, a));
    const y = 190 + i * 62;
    ctx.fillStyle = 'rgba(8,4,20,0.72)'; const w = Math.max(360, b.text.length * 15 + 60);
    rr(ctx, 640 - w / 2, y - 34, w, 52, 10); ctx.fill();
    ctx.strokeStyle = b.color; ctx.lineWidth = 1.5; ctx.stroke();
    txt(ctx, b.text, 640, y, 21, b.color, 'center', true);
    if (b.sub) txt(ctx, b.sub, 640, y + 14 + 22, 12.5, '#ffe9b8', 'center');
    ctx.restore();
  });
}

// --- Title screen (dense: how-to + fruits + bestiary + difficulties) ---------------

export const titleRegions = { fruits: [], diffs: [], start: null };
export function drawTitle(ctx, S) {
  // Backdrop: Huskhome arena at dusk with drifting particles from the scene.
  drawBackground(ctx, 6);
  ctx.fillStyle = 'rgba(5,3,14,0.55)'; ctx.fillRect(0, 0, W, H);
  txt(ctx, 'HEXFRUIT ARENA', 640, 66, 44, '#ffd24d', 'center', true);
  txt(ctx, 'Eat a hexfruit, master its 4 powers — brawl the Husk corsairs across 7 isles and fell Captain Husk.', 640, 92, 15, '#ffe9b8', 'center');
  titleRegions.fruits = []; titleRegions.diffs = [];
  // Fruit cards: 6 across two rows of three, left+centre.
  FRUITS.forEach((f, i) => {
    const col = i % 3, rowI = Math.floor(i / 3);
    const x = 28 + col * 218, y = 108 + rowI * 148, w = 206, h = 136;
    titleRegions.fruits.push({ x, y, w, h, idx: i });
    panel(ctx, x, y, w, h, S.selFruit === i ? 'rgba(30,20,60,0.95)' : 'rgba(12,8,28,0.88)');
    ctx.strokeStyle = S.selFruit === i ? f.color : 'rgba(185,168,232,0.3)'; ctx.lineWidth = S.selFruit === i ? 3 : 1; rr(ctx, x, y, w, h, 10); ctx.stroke();
    hexPath(ctx, x + 22, y + 24, 12); ctx.fillStyle = f.color; ctx.fill();
    txt(ctx, f.name.toUpperCase(), x + 42, y + 30, 17, f.color, 'left', true);
    txt(ctx, f.epithet, x + 12, y + 50, 10.5, '#b9a8e8');
    txt(ctx, f.desc.slice(0, 38) + '…', x + 12, y + 66, 10, '#9a8ac8');
    f.powers.forEach((pw, j) => txt(ctx, `${j + 1}. ${pw.name} · ${pw.dmg} dmg${pw.energy ? ' · ' + pw.energy + ' NRG' : ''}`, x + 12, y + 86 + j * 13, 10.5, '#ffe9b8'));
    if (S.selFruit === i) txt(ctx, '▶ SELECTED', x + w - 12, y + 24, 11, f.color, 'right', true);
  });
  // Bestiary, right column.
  const bx = 692, bw = 560;
  panel(ctx, bx, 108, bw, 296);
  txt(ctx, 'HUSK CORSAIR BESTIARY', bx + 16, 132, 15, '#ff9aa5', 'left', true);
  BESTIARY.forEach((id, i) => {
    const c = CORSAIRS[id], y = 156 + i * 27;
    ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(bx + 26, y - 4, 8, 0, Math.PI * 2); ctx.fill();
    txt(ctx, c.name, bx + 44, y, 13, '#ffe9b8', 'left', true);
    txt(ctx, c.desc, bx + 190, y, 12, '#b9a8e8');
  });
  const by = 156 + 8 * 27;
  ctx.fillStyle = '#e04a5a'; ctx.beginPath(); ctx.arc(bx + 26, by - 4, 10, 0, Math.PI * 2); ctx.fill();
  txt(ctx, 'Captain Husk', bx + 44, by, 13, '#ffd24d', 'left', true);
  txt(ctx, 'Final boss of Huskhome — slams, summons escorts, 2,400 HP.', bx + 190, by, 12, '#b9a8e8');
  txt(ctx, 'Isle bosses: Brakk · Vex · Mor · Ssa · Kett · Orm guard Isles 1–6.', bx + 16, by + 24, 12, '#b9a8e8');
  // How-to, bottom-left.
  panel(ctx, 28, 420, 640, 196);
  txt(ctx, 'HOW TO PLAY', 44, 446, 15, '#8ad0ff', 'left', true);
  const how = [
    'MOVE with WASD / arrows · AIM with the mouse.',
    'FIRE powers: LMB = power 1 · RMB = power 2 · SPACE = power 3 · E = power 4 (or keys 1–4).',
    'Kills earn MASTERY XP — powers 2, 3 and 4 unlock at 50 / 140 / 300 XP, mid-run.',
    'Clear 3 waves + the isle boss, then DRAFT 1 of 3 mutations before sailing on.',
    'Chain kills to grow the COMBO multiplier; grab husk coins from the fallen.',
    'WIN: fell Captain Husk on Isle 7.   LOSE: your HP reaches 0.',
  ];
  how.forEach((s, i) => txt(ctx, s, 44, 472 + i * 22, 13, '#ffe9b8'));
  txt(ctx, 'A full Storm run scores in the tens of thousands.', 44, 472 + 6 * 22, 12.5, '#ffd24d', 'left', true);
  // Difficulties, bottom-right.
  DIFFICULTIES.forEach((d, i) => {
    const x = bx + i * 188, y = 420, w = 176, h = 92;
    titleRegions.diffs.push({ x, y, w, h, idx: i });
    panel(ctx, x, y, w, h, S.selDiff === i ? 'rgba(30,20,60,0.95)' : 'rgba(12,8,28,0.88)');
    ctx.strokeStyle = S.selDiff === i ? '#ffd24d' : 'rgba(185,168,232,0.3)'; ctx.lineWidth = S.selDiff === i ? 3 : 1; rr(ctx, x, y, w, h, 10); ctx.stroke();
    txt(ctx, d.name, x + w / 2, y + 28, 15, '#ffe9b8', 'center', true);
    txt(ctx, `score ×${d.scoreMult}`, x + w / 2, y + 50, 12, '#ffd24d', 'center');
    txt(ctx, d.desc.split('.')[0] + '.', x + w / 2, y + 70, 10.5, '#b9a8e8', 'center');
  });
  // Start strip.
  titleRegions.start = { x: 692, y: 528, w: 560, h: 88 };
  panel(ctx, 692, 528, 560, 88, 'rgba(46,32,8,0.92)');
  txt(ctx, `CLICK TO SAIL — ${FRUITS[S.selFruit].name} on ${DIFFICULTIES[S.selDiff].name}`, 972, 566, 17, '#ffd24d', 'center', true);
  txt(ctx, 'or press ENTER · click a fruit / difficulty to change your pick', 972, 592, 12.5, '#ffe9b8', 'center');
  txt(ctx, '6 hexfruits × 4 powers · 7 isles · 8 corsair types · 8 mutations · 3 difficulties', 640, 656, 14, '#b9a8e8', 'center', true);
  txt(ctx, 'Best score: ' + Math.floor(S.best).toLocaleString('en-US'), 640, 682, 13, '#ffd24d', 'center');
}

// --- Mutation draft (meta screen) ------------------------------------------------------

export const draftRegions = { cards: [] };
export function drawDraft(ctx, S) {
  drawBackground(ctx, Math.min(6, S.isle + 1));
  ctx.fillStyle = 'rgba(5,3,14,0.68)'; ctx.fillRect(0, 0, W, H);
  txt(ctx, `ISLE ${S.isle + 1} CLEARED — THE SEA CARRIES YOU ON`, 640, 84, 26, '#ffd24d', 'center', true);
  txt(ctx, `Draft 1 of 3 mutations before Isle ${S.isle + 2}: ${ISLES[Math.min(6, S.isle + 1)].name}. Mutations stack for the whole run.`, 640, 114, 15, '#ffe9b8', 'center');
  draftRegions.cards = [];
  S.draftOffer.forEach((m, i) => {
    const x = 150 + i * 340, y = 150, w = 300, h = 300;
    draftRegions.cards.push({ x, y, w, h, idx: i });
    panel(ctx, x, y, w, h, 'rgba(14,10,32,0.95)');
    ctx.strokeStyle = '#8be04a'; ctx.lineWidth = 2; rr(ctx, x, y, w, h, 12); ctx.stroke();
    hexPath(ctx, x + w / 2, y + 62, 34); ctx.fillStyle = '#2c6116'; ctx.fill(); ctx.strokeStyle = '#8be04a'; ctx.stroke();
    txt(ctx, m.icon, x + w / 2, y + 70, 17, '#d8f5c0', 'center', true);
    txt(ctx, m.name, x + w / 2, y + 140, 19, '#ffe9b8', 'center', true);
    // Word-wrap the description.
    const words = m.desc.split(' '); let line = '', ly = y + 172;
    for (const wd of words) { if ((line + ' ' + wd).length > 30) { txt(ctx, line, x + w / 2, ly, 14, '#b9a8e8', 'center'); ly += 20; line = wd; } else line = line ? line + ' ' + wd : wd; }
    if (line) txt(ctx, line, x + w / 2, ly, 14, '#b9a8e8', 'center');
    txt(ctx, `PRESS ${i + 1} OR CLICK`, x + w / 2, y + h - 26, 13, '#8be04a', 'center', true);
  });
  // Run strip: what you already carry + where you stand.
  panel(ctx, 150, 486, 980, 130);
  txt(ctx, `CARRIED MUTATIONS (${S.mutations.length})`, 170, 516, 13, '#8be04a', 'left', true);
  if (!S.mutations.length) txt(ctx, 'none yet — this is your first draft', 170, 540, 13, '#b9a8e8');
  S.mutations.forEach((id, i) => { const m = MUTATIONS.find((mm) => mm.id === id); if (m) txt(ctx, `[${m.icon}] ${m.name} — ${m.desc}`, 170, 540 + i * 18, 12.5, '#d8f5c0'); });
  txt(ctx, `Score ${Math.floor(S.score).toLocaleString('en-US')} · Coins ${S.coins} · Fruit: ${S.fruit.name} · Mastery XP ${Math.floor(S.player.xp)} · HP ${Math.ceil(S.player.hp)}/${S.player.maxHp}`, 170, 486 + 130 - 14, 13.5, '#ffd24d');
}

// --- End screen ---------------------------------------------------------------------------

export function rankFor(score, victory) {
  if (!victory) return score > 30000 ? 'B' : score > 15000 ? 'C' : 'D';
  return score >= 60000 ? 'S' : score >= 45000 ? 'A' : score >= 30000 ? 'B' : 'C';
}

export function drawEnd(ctx, S) {
  drawBackground(ctx, S.victory ? 6 : S.isle);
  ctx.fillStyle = 'rgba(5,3,14,0.72)'; ctx.fillRect(0, 0, W, H);
  const rank = rankFor(S.score, S.victory);
  txt(ctx, S.victory ? 'VICTORY — CAPTAIN HUSK FELLED!' : 'THE CROSSING ENDS', 640, 78, 34, S.victory ? '#ffd24d' : '#ff8a9a', 'center', true);
  txt(ctx, S.victory ? 'All 7 isles cleared. The Husk fleet scatters; the hexfruit groves are free.' : `Your husk joins the fleet on Isle ${S.isle + 1}. The sea keeps what it takes.`, 640, 108, 15, '#ffe9b8', 'center');
  // Rank medallion.
  hexPath(ctx, 190, 300, 105); ctx.fillStyle = 'rgba(20,14,44,0.95)'; ctx.fill();
  ctx.strokeStyle = rank === 'S' ? '#ffd24d' : '#b9a8e8'; ctx.lineWidth = 4; ctx.stroke();
  txt(ctx, rank, 190, 338, 96, rank === 'S' ? '#ffd24d' : '#ffe9b8', 'center', true);
  txt(ctx, 'RANK', 190, 448, 14, '#b9a8e8', 'center', true);
  txt(ctx, 'FINAL SCORE', 190, 500, 13, '#b9a8e8', 'center', true);
  txt(ctx, Math.floor(S.score).toLocaleString('en-US'), 190, 540, 30, '#ffd24d', 'center', true);
  txt(ctx, `Best: ${Math.floor(S.best).toLocaleString('en-US')}`, 190, 570, 13, '#ffe9b8', 'center');
  // Stats grid — 10 stats.
  const stats = S.endStats || [];
  panel(ctx, 350, 150, 560, 380);
  txt(ctx, 'RUN LEDGER', 374, 182, 15, '#8ad0ff', 'left', true);
  stats.forEach(([k, v], i) => {
    const col = i % 2, rowI = Math.floor(i / 2);
    const x = 374 + col * 272, y = 222 + rowI * 58;
    txt(ctx, k, x, y, 12, '#b9a8e8');
    txt(ctx, String(v), x, y + 24, 19, '#ffe9b8', 'left', true);
  });
  // Mutation recap.
  panel(ctx, 934, 150, 318, 380);
  txt(ctx, `MUTATIONS CARRIED (${S.mutations.length})`, 954, 182, 14, '#8be04a', 'left', true);
  if (!S.mutations.length) txt(ctx, 'none drafted', 954, 210, 13, '#b9a8e8');
  S.mutations.forEach((id, i) => { const m = MUTATIONS.find((mm) => mm.id === id); if (m) { txt(ctx, `[${m.icon}] ${m.name}`, 954, 212 + i * 30, 13.5, '#d8f5c0'); txt(ctx, m.desc, 954, 212 + i * 30 + 15, 10.5, '#9a8ac8'); } });
  txt(ctx, `Fruit: ${S.fruit ? S.fruit.name : '—'} · Difficulty: ${S.diff ? S.diff.name : '—'}`, 954, 500, 12.5, '#ffe9b8');
  txt(ctx, 'Press ENTER to sail again', 640, 600, 17, '#ffd24d', 'center', true);
  txt(ctx, 'HEXFRUIT ARENA — 6 fruits × 4 powers · 7 isles · 8 corsairs · Captain Husk', 640, 640, 13, '#b9a8e8', 'center');
}
