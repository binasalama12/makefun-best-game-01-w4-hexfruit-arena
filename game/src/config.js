// HEXFRUIT ARENA — all game content: 6 hexfruits × 4 powers, 8 Husk corsair
// types, 7 isles, 8 draftable mutations, 3 difficulties, scoring.
// Every fruit, power, isle and corsair here is invented for this game.
//
// Power kinds (executed in entities.js):
//   bolt   — one fast projectile toward the aim
//   spread — a fan of projectiles
//   nova   — radial burst centred on the player
//   dash   — a dash toward the aim that damages everything crossed
//   beam   — an instant piercing line toward the aim
//   orbit  — orbiting orbs that burn what they touch, for a few seconds
//   lob    — an arcing hex-bomb that explodes in an area (and snares, for Thorn)
//   chain  — lightning that jumps from foe to foe
//   wave   — a slow wide wave that rolls through foes

export const FIELD = { w: 1280, h: 720, top: 64, bottom: 692, left: 26, right: 1254 };

export const MASTERY_XP = [0, 50, 140, 300]; // XP at which powers 1..4 unlock
export const COMBO_WINDOW = 2.6;             // seconds to keep a combo alive

export const FRUITS = [
  {
    id: 'ember', name: 'Ember', epithet: 'the Cinder Hexfruit', color: '#ff7a2e', dark: '#8a2c08',
    desc: 'Raw fire. Burns bright, hits hard, forgives nothing.',
    powers: [
      { name: 'Ember Bolt', kind: 'bolt', dmg: 26, cd: 0.28, energy: 0, speed: 640, desc: 'A fast bolt of packed cinder.' },
      { name: 'Flame Fan', kind: 'spread', dmg: 15, cd: 0.85, energy: 18, count: 5, speed: 560, desc: 'Five flames in a burning fan.' },
      { name: 'Cinder Nova', kind: 'nova', dmg: 34, cd: 2.4, energy: 30, radius: 132, desc: 'A ring of cinder bursts outward.' },
      { name: 'Ember Lance', kind: 'beam', dmg: 78, cd: 3.4, energy: 42, width: 26, desc: 'A piercing lance of white-hot ember.' },
    ],
  },
  {
    id: 'gale', name: 'Gale', epithet: 'the Zephyr Hexfruit', color: '#62e6bd', dark: '#0d6e52',
    desc: 'Living wind. The fastest fruit — strike, slip away, strike again.',
    powers: [
      { name: 'Gale Dart', kind: 'bolt', dmg: 20, cd: 0.2, energy: 0, speed: 780, desc: 'A needle of compressed air.' },
      { name: 'Cyclone Fan', kind: 'spread', dmg: 12, cd: 0.7, energy: 16, count: 7, speed: 620, desc: 'Seven wind blades in a wide fan.' },
      { name: 'Zephyr Dash', kind: 'dash', dmg: 30, cd: 1.6, energy: 22, dist: 190, desc: 'Become the wind; foes crossed are cut.' },
      { name: 'Tempest Ring', kind: 'nova', dmg: 44, cd: 3.2, energy: 40, radius: 168, desc: 'A hurricane ring that flings husks back.' },
    ],
  },
  {
    id: 'tide', name: 'Tide', epithet: 'the Brine Hexfruit', color: '#3fa9ff', dark: '#0b3f74',
    desc: 'The patient sea. Waves that roll through whole crowds.',
    powers: [
      { name: 'Tide Spike', kind: 'bolt', dmg: 24, cd: 0.26, energy: 0, speed: 600, desc: 'A spike of pressurised brine.' },
      { name: 'Brine Fan', kind: 'spread', dmg: 14, cd: 0.8, energy: 17, count: 6, speed: 540, desc: 'Six brine shards in a fan.' },
      { name: 'Rolling Wave', kind: 'wave', dmg: 38, cd: 2.2, energy: 30, width: 120, speed: 300, desc: 'A slow wave that rolls through every foe.' },
      { name: 'Maelstrom', kind: 'nova', dmg: 52, cd: 3.6, energy: 44, radius: 150, desc: 'A whirlpool burst that drags husks inward.' },
    ],
  },
  {
    id: 'thorn', name: 'Thorn', epithet: 'the Bramble Hexfruit', color: '#8be04a', dark: '#2c6116',
    desc: 'The hungry hedge. Snares, lashes and a garden that bites back.',
    powers: [
      { name: 'Thorn Dart', kind: 'bolt', dmg: 22, cd: 0.24, energy: 0, speed: 660, desc: 'A barbed dart, dipped in sap-venom.' },
      { name: 'Bramble Fan', kind: 'spread', dmg: 13, cd: 0.78, energy: 16, count: 6, speed: 560, desc: 'A fan of splintering bramble.' },
      { name: 'Root Snare Bomb', kind: 'lob', dmg: 36, cd: 2.3, energy: 30, radius: 118, desc: 'A seed-bomb that bursts and roots foes still.' },
      { name: 'Vine Lash', kind: 'beam', dmg: 70, cd: 3.3, energy: 40, width: 22, desc: 'A whipping vine that pierces the whole line.' },
    ],
  },
  {
    id: 'volt', name: 'Volt', epithet: 'the Storm Hexfruit', color: '#ffd83d', dark: '#7a5c00',
    desc: 'Bottled lightning. Made for crowds — the more husks, the merrier.',
    powers: [
      { name: 'Volt Spark', kind: 'bolt', dmg: 21, cd: 0.21, energy: 0, speed: 760, desc: 'A crackling spark, near instant.' },
      { name: 'Arc Fan', kind: 'spread', dmg: 13, cd: 0.75, energy: 17, count: 6, speed: 640, desc: 'Six arcs leap out in a fan.' },
      { name: 'Storm Nova', kind: 'nova', dmg: 40, cd: 2.5, energy: 32, radius: 140, desc: 'A thunderclap ring of raw charge.' },
      { name: 'Lightning Chain', kind: 'chain', dmg: 46, cd: 3.4, energy: 42, jumps: 5, desc: 'Lightning that jumps foe to foe, five deep.' },
    ],
  },
  {
    id: 'umbra', name: 'Umbra', epithet: 'the Dusk Hexfruit', color: '#b06bff', dark: '#3d1470',
    desc: 'Swallowed dusk. Quiet, cold, and heavier than it looks.',
    powers: [
      { name: 'Umbra Bolt', kind: 'bolt', dmg: 28, cd: 0.3, energy: 0, speed: 620, desc: 'A bolt of solid shadow.' },
      { name: 'Shadow Fan', kind: 'spread', dmg: 16, cd: 0.88, energy: 18, count: 5, speed: 580, desc: 'Five shadow shards in a fan.' },
      { name: 'Dusk Orbit', kind: 'orbit', dmg: 18, cd: 4.2, energy: 36, orbs: 3, dur: 3.2, desc: 'Three dusk orbs circle you, burning touchers.' },
      { name: 'Umbral Beam', kind: 'beam', dmg: 84, cd: 3.6, energy: 44, width: 30, desc: 'A beam of night that erases a line.' },
    ],
  },
];

// 8 corsair types, each with a distinct behaviour (AI in entities.js).
export const CORSAIRS = {
  cutler:   { name: 'Husk Cutler',   hp: 46,  speed: 96,  r: 17, dmg: 12, score: 80, coins: 2, xp: 9,  color: '#c9b18a', desc: 'Chases you down and slashes in melee.' },
  spitter:  { name: 'Husk Spitter',  hp: 38,  speed: 62,  r: 16, dmg: 10, score: 100, coins: 3, xp: 11, color: '#9fd06a', desc: 'Keeps its distance and spits hex-globs.' },
  dasher:   { name: 'Husk Dasher',   hp: 40,  speed: 84,  r: 15, dmg: 14, score: 120, coins: 3, xp: 12, color: '#e07a4a', desc: 'Circles, winds up, then lunges in a line.' },
  splitter: { name: 'Husk Splitter', hp: 64,  speed: 58,  r: 20, dmg: 10, score: 130, coins: 3, xp: 13, color: '#7ac9c0', desc: 'Splits into two Husk Mites when it falls.' },
  mite:     { name: 'Husk Mite',     hp: 18,  speed: 128, r: 10, dmg: 7,  score: 40,  coins: 1, xp: 5,  color: '#a8e0d8', desc: 'A Splitter’s offspring — small, fast, furious.' },
  shielder: { name: 'Husk Shielder', hp: 96,  speed: 44,  r: 19, dmg: 12, score: 160, coins: 4, xp: 16, color: '#8a97b8', desc: 'A hex-shield blocks shots from the front.' },
  bomber:   { name: 'Husk Bomber',   hp: 34,  speed: 118, r: 16, dmg: 22, score: 140, coins: 3, xp: 12, color: '#e04a5a', desc: 'Rushes you and bursts in a hex explosion.' },
  sniper:   { name: 'Husk Sniper',   hp: 36,  speed: 50,  r: 15, dmg: 18, score: 180, coins: 5, xp: 17, color: '#c07ae0', desc: 'Telegraphs a long charged shot, then fires.' },
  brute:    { name: 'Husk Brute',    hp: 210, speed: 38,  r: 27, dmg: 20, score: 320, coins: 8, xp: 26, color: '#97e04a', desc: 'Slow, enormous, slams the ground in a ring.' },
};
export const BESTIARY = ['cutler', 'spitter', 'dasher', 'splitter', 'shielder', 'bomber', 'sniper', 'brute'];

// Isle bosses (waves 4 of each isle). The final isle's boss is Captain Husk.
export const BOSSES = [
  { name: 'Husk Warlord Brakk', hp: 620, type: 'brute' },
  { name: 'Husk Admiral Vex', hp: 780, type: 'shielder' },
  { name: 'Husk Tidecaller Mor', hp: 940, type: 'spitter' },
  { name: 'Husk Thornwarden Ssa', hp: 1120, type: 'splitter' },
  { name: 'Husk Stormlord Kett', hp: 1340, type: 'dasher' },
  { name: 'Husk Dreadnought Orm', hp: 1620, type: 'brute' },
  { name: 'Captain Husk', hp: 2400, type: 'brute' },
];

export const ISLES = [
  { name: 'Emberfall Shore', sub: 'where the cinder tide comes in', sand: '#4a2c1c', ground: '#5d3a22', accent: '#ff7a2e', motif: 'ember' },
  { name: 'Galewind Cliffs', sub: 'the wind never signs a truce', sand: '#274a3e', ground: '#35604e', accent: '#62e6bd', motif: 'gale' },
  { name: 'Tidepool Reach', sub: 'the brine remembers every wreck', sand: '#1d3a5c', ground: '#27507c', accent: '#3fa9ff', motif: 'tide' },
  { name: 'Thornwall Isle', sub: 'the hedge eats the unwary', sand: '#2e4a1c', ground: '#3f6326', accent: '#8be04a', motif: 'thorn' },
  { name: 'Voltspire Rock', sub: 'the storm keeps its ledger here', sand: '#4a421c', ground: '#605826', accent: '#ffd83d', motif: 'volt' },
  { name: 'Umbral Deep', sub: 'dusk, bottled and furious', sand: '#331a4d', ground: '#45246a', accent: '#b06bff', motif: 'umbra' },
  { name: 'Huskhome', sub: 'the Captain’s own shore — end it', sand: '#3d1220', ground: '#521a2c', accent: '#ff4a6a', motif: 'husk' },
];

// Wave compositions per isle: 3 waves then the boss wave. Counts scale up.
export function waveComp(isleIdx, waveIdx) {
  const i = isleIdx, w = waveIdx;
  const pool = [
    { cutler: 3 + i + w, spitter: w >= 1 ? 1 + i : 0 },
    { cutler: 2 + i, dasher: 1 + w + (i >= 1 ? 1 : 0), spitter: 1 + Math.floor(i / 2) },
    { cutler: 2 + i, splitter: i >= 1 ? 1 + w : 0, shielder: i >= 2 ? 1 + w : 0, bomber: i >= 2 ? 1 + w : 0, sniper: i >= 3 ? w : 0, brute: i >= 4 ? 1 : 0 },
  ];
  return pool[Math.min(w, 2)];
}

// 8 draftable mutations — the collectible layer, drafted 1-of-3 between isles.
export const MUTATIONS = [
  { id: 'emberheart', name: 'Emberheart Core', desc: '+25% power damage, all moves.', icon: 'DMG' },
  { id: 'swiftwake', name: 'Swiftwake Boots', desc: '+18% move speed. Run the shore.', icon: 'SPD' },
  { id: 'vitalcharm', name: 'Vital Husk Charm', desc: '+40 max HP, and heal 40 now.', icon: 'HP+' },
  { id: 'energybloom', name: 'Energy Bloom', desc: '+40% energy regeneration.', icon: 'NRG' },
  { id: 'combocharm', name: 'Combo Charm', desc: 'Combo window +1.4s, combo score +25%.', icon: 'CMB' },
  { id: 'coinmagnet', name: 'Coin Magnet Idol', desc: '+60% husk coins, coins drift to you.', icon: 'MAG' },
  { id: 'thornskin', name: 'Thornskin Mantle', desc: 'Foes that touch you take 30% back.', icon: 'THN' },
  { id: 'secondwind', name: 'Second Wind Sigil', desc: 'Fall once, rise again at 50% HP.', icon: 'WND' },
];

export const DIFFICULTIES = [
  { id: 'calm', name: 'Calm Seas', hp: 0.8, speed: 0.92, scoreMult: 1.0, desc: 'Learn the fruit. Gentler husks.' },
  { id: 'storm', name: 'Storm', hp: 1.0, speed: 1.0, scoreMult: 1.25, desc: 'The intended crossing. Score ×1.25.' },
  { id: 'tempest', name: 'Tempest', hp: 1.35, speed: 1.14, scoreMult: 1.6, desc: 'For masters. Score ×1.6, husks enraged.' },
];

export const SCORE = {
  waveClear: 200,       // × wave number
  isleClear: 400,       // × isle number
  bossKill: 2500,
  captainKill: 8000,
  noHitWave: 500,
};
