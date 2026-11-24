// "The Knock" — chapter two, painted in plates.
// Every shot is a floor-planned illustration: one dark field, the figures in it,
// the light that finds them. The knife lays the paint in; the camera does the rest.
import { Ref, paintRef } from '../engine/plate.js';
import { P, E, RR, lin, rad } from './common.js';

const LADDER = [40, 20, 7, 3.5, 2];
const APP = (x, y) => x / 1920 * .75;

// a standing figure: head + shoulders down to the ground line
function person(r, x, baseY, h, col, g = 'fig', o = {}) {
  const hw = h * .13, top = baseY - h, dx = o.dx ?? 0, lean = o.lean ?? 0;
  r.fill(E(x + dx, top + hw, hw * .78, hw * .92), col, { group: g, dir: 0, maxR: hw, detail: 2 });
  r.fill(P([[x - hw + dx + lean, top + hw * 1.6], [x + hw + dx + lean, top + hw * 1.6],
    [x + hw * 1.45 + dx, baseY], [x - hw * 1.45 + dx, baseY]]), col,
    { group: g, dir: o.dir ?? 0, maxR: h * .28, detail: 1.5 });
}
// a figure flat on the floor
function fallen(r, x, y, len, col, g = 'fig') {
  r.fill(E(x - len * .42, y, len * .17, len * .15), col, { group: g, dir: 0, maxR: len * .16, detail: 2 });
  r.fill(P([[x - len * .28, y - len * .12], [x + len * .28, y - len * .17], [x + len * .33, y + len * .1], [x - len * .28, y + len * .12]]),
    col, { group: g, dir: 4, maxR: len * .2, detail: 1.5 });
}
// the pale edge light on one side of a silhouette
function rim(r, x, baseY, h, col, side = -1, g = 'rim') {
  const hw = h * .13, top = baseY - h, w = h * .035;
  r.fill(P([[x + side * hw * .82, top + h * .07], [x + side * (hw + w), top + h * .1],
    [x + side * (hw * 1.5 + w), baseY], [x + side * hw * 1.45, baseY]]), col,
    { group: g, dir: 90, maxR: h * .2, detail: 2 });
}
// a door: frame, panels, knob
function door(r, x, y, w, h, col, panel, knob) {
  r.fill(RR(x, y, w, h, 6), col, { group: 'door', dir: 90, maxR: w * .4, detail: 1.2 });
  const pw = (w - 56) / 2, ph = (h - 150) / 3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    r.fill(RR(x + 28 + j * (pw + 8), y + 40 + i * (ph + 18), pw, ph, 4), panel,
      { group: 'door', dir: 90, maxR: pw * .5, detail: 2 });
  }
  if (knob) r.fill(E(x + w - 64, y + h * .48, 22, 22), knob, { group: 'door', dir: 0, maxR: 22, detail: 2 });
}

const field = (r, stops) => r.fill(P([[0, 0], [1920, 0], [1920, 1080], [0, 1080]]),
  lin(0, 0, 0, 1080, stops), { dir: -8, fallback: -8, group: 'bg', maxR: 46, detail: 2 });

// ---- 0 · the title field -------------------------------------------------
function plateTitle() {
  const r = new Ref(1920, 1080, 1);
  field(r, [[0, '#221b15'], [.5, '#15110d'], [1, '#070605']]);
  r.fill(rad(960, 440, 30, 1100, [[0, 'rgba(226,180,110,.16)'], [1, 'rgba(0,0,0,0)']]),
    { group: 'light', dir: 0, maxR: 60, detail: 1 });
  return r;
}

// ---- 1 · the room, the question -----------------------------------------
function plateRoom() {
  const r = new Ref(1920, 1080, 1);
  field(r, [[0, '#232a33'], [.62, '#141920'], [1, '#0b0d11']]);
  r.fill(P([[0, 842], [1920, 806], [1920, 1080], [0, 1080]]), lin(0, 806, 0, 1080, [[0, '#2a1d13'], [1, '#100b07']]),
    { group: 'floor', dir: -8, fallback: -8, maxR: 44, detail: 1.4 });
  // window, right
  r.fill(RR(1298, 176, 404, 520, 4), '#0d1015', { group: 'win', dir: 90, maxR: 200, detail: 1.6 });
  r.fill(RR(1322, 200, 356, 472, 3), '#b9c8d8', { group: 'win', dir: 90, maxR: 180, detail: 1.8 });
  r.fill(RR(1492, 200, 16, 472), '#0d1015', { group: 'win', dir: 90, maxR: 12, detail: 2 });
  r.fill(RR(1322, 424, 356, 14), '#0d1015', { group: 'win', dir: 0, maxR: 10, detail: 2 });
  // its spill on the floor
  r.fill(P([[1290, 806], [1720, 806], [1850, 1080], [1090, 1080]]), 'rgba(150,175,205,.10)',
    { group: 'light', dir: -80, fallback: -80, maxR: 60, detail: 1 });
  // the door, left
  door(r, 150, 232, 306, 646, '#3b2a1d', '#2c1f16', '#c9a35e');
  // table
  r.fill(RR(700, 856, 520, 42, 4), '#2b1d13', { group: 'table', dir: 0, maxR: 40, detail: 1.6 });
  r.fill(RR(730, 898, 26, 150, 3), '#241811', { group: 'table', dir: 90, maxR: 40, detail: 1.6 });
  r.fill(RR(1164, 898, 26, 150, 3), '#241811', { group: 'table', dir: 90, maxR: 40, detail: 1.6 });
  r.fill(E(1156, 828, 24, 26), '#8d7c62', { group: 'table', dir: 0, maxR: 20, detail: 2 });
  // him, back to us
  person(r, 900, 900, 430, '#0d0f14', 'fig', { dir: 0 });
  // the lamp, low and far left
  r.fill(rad(300, 760, 20, 520, [[0, 'rgba(232,180,99,.30)'], [1, 'rgba(0,0,0,0)']]),
    { group: 'light', dir: 0, maxR: 50, detail: 1 });
  return r;
}

// ---- 2 · the door, rapped ------------------------------------------------
function plateDoor() {
  const r = new Ref(1920, 1080, 1);
  field(r, [[0, '#161a20'], [.6, '#0e1116'], [1, '#08090c']]);
  door(r, 360, 96, 1200, 860, '#4a3626', '#33241a', '#c9a35e');
  // light down the left edge of the frame
  r.fill(P([[330, 96], [368, 96], [368, 956], [330, 956]]), 'rgba(160,185,210,.22)',
    { group: 'light', dir: 90, maxR: 40, detail: 1.6 });
  r.fill(rad(960, 540, 60, 900, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.45)']]),
    { group: 'shade', dir: 0, maxR: 60, detail: 1 });
  return r;
}

// ---- 3 · they come in ----------------------------------------------------
function plateDoorway() {
  const r = new Ref(1920, 1080, 1);
  field(r, [[0, '#0d0f13'], [.6, '#14110e'], [1, '#070607']]);
  // the hallway behind them
  r.fill(RR(700, 150, 540, 810, 4), '#d8c39a', { group: 'hall', dir: 90, maxR: 60, detail: 1.4 });
  r.fill(rad(970, 520, 40, 760, [[0, 'rgba(255,232,180,.35)'], [1, 'rgba(0,0,0,0)']]),
    { group: 'light', dir: 0, maxR: 50, detail: 1 });
  // two of them, one bald
  person(r, 806, 1010, 500, '#08090b', 'fig', { dir: 0 });
  person(r, 1140, 1010, 520, '#08090b', 'fig', { dir: 0 });
  r.fill(E(972, 470, 74, 80), '#08090b', { group: 'fig', dir: 0, maxR: 70, detail: 2 });
  r.fill(E(948, 424, 40, 20), 'rgba(240,226,190,.85)', { group: 'shine', dir: 0, maxR: 26, detail: 2 });
  r.fill(P([[898, 550], [1046, 550], [1092, 1010], [852, 1010]]), '#08090b',
    { group: 'fig', dir: 90, maxR: 60, detail: 1.4 });
  return r;
}

// ---- 4 · the cloth bag ---------------------------------------------------
function plateBag() {
  const r = new Ref(1920, 1080, 1);
  r.fill(P([[0, 0], [1920, 0], [1920, 1080], [0, 1080]]), lin(0, 420, 0, 1080, [[0, '#3a2a1c'], [1, '#140e08']]),
    { dir: -8, fallback: -8, group: 'bg', maxR: 46, detail: 2 });
  r.fill(P([[0, 0], [1920, 0], [1920, 260], [0, 300]]), '#0a0806',
    { group: 'shade', dir: 0, maxR: 46, detail: 1.4 });
  r.fill(rad(900, 800, 40, 760, [[0, 'rgba(240,178,92,.34)'], [1, 'rgba(0,0,0,0)']]),
    { group: 'light', dir: 0, maxR: 50, detail: 1 });
  // the bag, mouth open
  r.fill(P([[760, 660], [900, 600], [1070, 640], [1150, 790], [1080, 900], [860, 900], [740, 800]]), '#6b5233',
    { group: 'bag', dir: -12, maxR: 70, detail: 1.6 });
  r.fill(E(910, 668, 128, 46), '#140f0a', { group: 'bag', dir: 0, maxR: 40, detail: 2 });
  // worn notes and coins spilled out
  const notes = [[700, 800, -14], [760, 852, 9], [860, 872, -5], [980, 850, 16], [1080, 838, -22], [1140, 890, 6],
    [640, 860, 20], [940, 906, -9], [1240, 862, 12], [560, 906, -17]];
  notes.forEach(([x, y, a], i) => {
    const w = 116 + (i % 3) * 12, h = 54;
    r.fill(P([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2 + 9], [x + w / 2, y + h / 2 + 9], [x - w / 2, y + h / 2]]),
      i % 3 === 0 ? '#a8a291' : i % 3 === 1 ? '#8d8877' : '#c0b9a4',
      { group: 'note' + i, dir: a, maxR: 34, detail: 2 });
  });
  const coins = [[820, 812], [880, 786], [1010, 800], [970, 884], [1120, 792], [700, 836], [1190, 866], [900, 830]];
  coins.forEach(([x, y], i) => r.fill(E(x, y, 17, 15), i % 2 ? '#d9b45a' : '#9a9a92',
    { group: 'coin' + i, dir: 0, maxR: 16, detail: 2 }));
  return r;
}

// ---- 5 · the kick --------------------------------------------------------
function plateKick() {
  const r = new Ref(1920, 1080, 1);
  field(r, [[0, '#1d222a'], [.62, '#12151a'], [1, '#08090b']]);
  r.fill(P([[0, 860], [1920, 828], [1920, 1080], [0, 1080]]), lin(0, 828, 0, 1080, [[0, '#2b1d14'], [1, '#0d0906']]),
    { group: 'floor', dir: -8, fallback: -8, maxR: 44, detail: 1.4 });
  // the mother, down
  fallen(r, 820, 838, 420, '#4d3f4c', 'fig');
  // the stool, tipped
  r.fill(P([[1230, 900], [1330, 872], [1352, 906], [1252, 934]]), '#2a1d13',
    { group: 'stool', dir: -12, maxR: 30, detail: 2 });
  r.fill(P([[1250, 924], [1272, 920], [1256, 1010], [1234, 1014]]), '#241811',
    { group: 'stool', dir: 84, maxR: 30, detail: 2 });
  r.fill(P([[1340, 912], [1362, 908], [1374, 996], [1352, 1000]]), '#241811',
    { group: 'stool', dir: 82, maxR: 30, detail: 2 });
  // him, down beside her
  person(r, 560, 940, 420, '#0c0e12', 'fig', { dx: 40, lean: 26, dir: -8 });
  // the boot, mid-arc
  r.fill(P([[1690, 560], [1790, 600], [1420, 800], [1360, 742]]), '#07080a',
    { group: 'kick', dir: 152, maxR: 60, detail: 1.6 });
  r.fill(rad(1560, 700, 30, 460, [[0, 'rgba(190,60,50,.18)'], [1, 'rgba(0,0,0,0)']]),
    { group: 'light', dir: 0, maxR: 40, detail: 1 });
  return r;
}

// ---- 6 · the cold stare --------------------------------------------------
function plateStare(dark = false) {
  const r = new Ref(1920, 1080, 1);
  const bg = dark ? ['#080a0d', '#060709', '#030304'] : ['#1b2028', '#10141a', '#07080a'];
  field(r, [[0, bg[0]], [.62, bg[1]], [1, bg[2]]]);
  // window light, left
  r.fill(P([[0, 150], [300, 190], [300, 900], [0, 940]]), dark ? 'rgba(130,155,190,.12)' : 'rgba(150,178,210,.24)',
    { group: 'light', dir: 92, maxR: 60, detail: 1.4 });
  // the two, frozen behind
  person(r, 520, 1010, 470, '#07080a', 'fig', { dir: 0 });
  person(r, 1420, 1010, 490, '#07080a', 'fig', { dir: 0 });
  // him, centre, against the light
  person(r, 960, 1040, 760, '#080a0d', 'fig', { dir: 0 });
  rim(r, 960, 1040, 760, dark ? 'rgba(140,165,200,.28)' : 'rgba(168,194,224,.55)', -1);
  rim(r, 960, 1040, 760, dark ? 'rgba(140,165,200,.18)' : 'rgba(168,194,224,.34)', 1);
  // the eyes
  const hw = 760 * .13, ey = 1040 - 760 + hw * .95;
  r.fill(E(960 - hw * .38, ey, 11, 7), '#e6eef8', { group: 'eyes', dir: 0, maxR: 10, detail: 2 });
  r.fill(E(960 + hw * .38, ey, 11, 7), '#e6eef8', { group: 'eyes', dir: 0, maxR: 10, detail: 2 });
  return r;
}

// ---- 7 · the sneer -------------------------------------------------------
function plateSneer() {
  const r = new Ref(1920, 1080, 1);
  field(r, [[0, '#100d0b'], [.55, '#1a1210'], [1, '#060505']]);
  // warm light from the left
  r.fill(rad(1080, 460, 40, 900, [[0, 'rgba(236,176,96,.24)'], [1, 'rgba(0,0,0,0)']]),
    { group: 'light', dir: 0, maxR: 50, detail: 1 });
  // his head, filling the right
  r.fill(E(1310, 470, 232, 250), '#6d5138', { group: 'head', dir: 0, maxR: 150, detail: 1.4 });
  r.fill(E(1252, 320, 96, 46), 'rgba(244,226,186,.5)', { group: 'shine', dir: 0, maxR: 40, detail: 2 });
  r.fill(P([[1230, 520], [1300, 548], [1300, 566], [1230, 542]]), '#231710',
    { group: 'head', dir: 8, maxR: 30, detail: 2 });
  r.fill(P([[1330, 540], [1400, 516], [1400, 538], [1330, 562]]), '#231710',
    { group: 'head', dir: -8, maxR: 30, detail: 2 });
  r.fill(E(1272, 470, 22, 14), '#120c08', { group: 'head', dir: 0, maxR: 18, detail: 2 });
  r.fill(E(1360, 462, 22, 14), '#120c08', { group: 'head', dir: 0, maxR: 18, detail: 2 });
  r.fill(P([[1256, 610], [1372, 596], [1360, 664], [1272, 672]]), '#170f0a',
    { group: 'head', dir: -6, maxR: 34, detail: 2 });
  r.fill(P([[1272, 616], [1352, 606], [1346, 634], [1280, 642]]), '#d8cbb0',
    { group: 'teeth', dir: -6, maxR: 22, detail: 2 });
  r.fill(P([[1090, 720], [1540, 700], [1600, 1080], [1040, 1080]]), '#0d0b0a',
    { group: 'head', dir: 90, maxR: 60, detail: 1.4 });
  // the invitation, drifting on the left
  r.fill(P([[300, 360], [560, 330], [576, 470], [316, 500]]), '#ded6c0',
    { group: 'invite', dir: -8, maxR: 60, detail: 1.6 });
  r.text('wedding', 438, 410, '500 44px "Cormorant SC"', '#8a6a44', { dir: 'edge', fallback: 8, maxR: 12, group: 'invite' });
  return r;
}

// ---- the shots ----------------------------------------------------------
export function buildShots() {
  const shots = [];
  const shot = (plate, seed) => {
    const ref = plate();
    const strokes = paintRef(ref, { R: LADDER, T: 10, seed, app: APP });
    return { bg: { strokes, ref } };
  };
  shots.push(shot(plateTitle, 5));
  shots.push(shot(plateRoom, 11));
  shots.push(shot(plateDoor, 17));
  shots.push(shot(plateDoorway, 23));
  shots.push(shot(plateBag, 29));
  shots.push(shot(plateKick, 37));
  shots.push(shot(plateStare, 43));
  shots.push(shot(plateSneer, 53));
  shots.push(shot(() => plateStare(true), 59));
  return shots;
}
