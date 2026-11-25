// "The Knock" — chapter two, painted in plates.
//
// Every shot is a floor-planned illustration: one dark field, the figures in
// it, the light that finds them. The knife lays the paint in; the camera does
// the rest.
//
// The geometry is drawn by a hand, not by a machine: the edges in common.js
// wander a little and the corners go off square, so a door is not quite a
// rectangle and a head is not quite an ellipse. The paint itself is given
// more room to wander too (HAND), so a stroke's colour, angle and bow all
// drift the way a loaded knife drifts across a wall.

import { Ref, paintRef } from '../../engine/plate.js';
import { P, E, RR, lin, rad, HP, HE, HR, HL, handSeed, HAND } from '../../scenes/common.js';
import { person, seated, neighbour, womanFace, baldHead, COLD, WARM, BLOOD, DARK, WHITE } from '../../scenes/figures.js';
import { CP, MAM, BALD, BRO, NEI } from '../../scenes/figures.js';

const LADDER = [40, 20, 7, 3.5, 2.2, 1.2];
const APP = (x, y) => x / 1920 * .75;

// a field: the whole frame, one value plan
function field(r, stops) {
  r.fill(P([[0, 0], [1920, 0], [1920, 1080], [0, 1080]]),
    lin(0, 0, 0, 1080, stops), { dir: -8, fallback: -8, group: 'bg', maxR: 46, detail: 2, ...HAND() });
}

// the floor: a plane below a horizon line
function floor(r, y, c1, c2) {
  r.fill(P([[0, y], [1920, y - 36], [1920, 1080], [0, 1080]]),
    lin(0, y, 0, 1080, [[0, c1], [1, c2]]), { dir: -8, fallback: -8, group: 'floor', maxR: 44, detail: 1.4, ...HAND() });
}

// a glow: light on the wall, or a lamp's spill
function glow(r, x, y, r0, r1, col, group = 'light') {
  r.fill(rad(x, y, r0, r1, [[0, col], [1, 'rgba(0,0,0,0)']]),
    { group, dir: 0, maxR: 60, detail: 1, ...HAND() });
}

// a shaft of light: a hard-edged wedge, the way a window makes one
function shaft(r, pts, col) {
  r.fill(P(pts), col, { group: 'light', dir: -80, fallback: -80, maxR: 60, detail: 1, ...HAND() });
}

// the pale edge light on one side of a silhouette
function rim(r, x, baseY, h, col, side = -1, g = 'rim') {
  const hw = h * .14, top = baseY - h, w = h * .035;
  r.fill(HP([[x + side * hw * .82, top + h * .07], [x + side * (hw + w), top + h * .1],
    [x + side * (hw * 1.5 + w), baseY], [x + side * hw * 1.45, baseY]], 3, 2), col,
    { group: g, dir: 90, maxR: h * .2, detail: 2, ...HAND() });
}

// a door: frame, panels, knob
function door(r, x, y, w, h, col, panel, knob) {
  r.fill(HR(x, y, w, h, 8, 5), col, { group: 'door', dir: 90, maxR: w * .4, detail: 1.2, ...HAND() });
  const pw = (w - 56) / 2, ph = (h - 150) / 3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    r.fill(HR(x + 28 + j * (pw + 8), y + 40 + i * (ph + 18), pw, ph, 4, 3), panel,
      { group: 'door', dir: 90, maxR: pw * .5, detail: 2, ...HAND() });
  }
  if (knob) r.fill(HE(x + w - 64, y + h * .48, 22, 22, 0, 2), knob,
    { group: 'door', dir: 0, maxR: 22, detail: 2, ...HAND() });
}

// a window: frame, glass, mullions
function window(r, x, y, w, h, glass) {
  r.fill(HR(x, y, w, h, 4, 5), '#0d1015', { group: 'win', dir: 90, maxR: 200, detail: 1.6, ...HAND() });
  r.fill(HR(x + 24, y + 24, w - 48, h - 48, 3, 4), glass, { group: 'win', dir: 90, maxR: 180, detail: 1.8, ...HAND() });
  r.fill(HR(x + w / 2 - 8, y + 24, 16, h - 48, 2, 2), '#0d1015', { group: 'win', dir: 90, maxR: 12, detail: 2, ...HAND() });
  r.fill(HR(x + 24, y + h / 2 - 7, w - 48, 14, 2, 2), '#0d1015', { group: 'win', dir: 0, maxR: 10, detail: 2, ...HAND() });
}

// a stool: four legs and a seat
function stool(r, x, y, w, h, col) {
  r.fill(HR(x, y - h, w, h * .2, 3, 3), col, { group: 'stool', dir: 0, maxR: 30, detail: 2, ...HAND() });
  for (const dx of [w * .12, w * .82]) {
    r.fill(HL([[x + dx, y - h * .8], [x + dx + 4, y]], 2), col, { group: 'stool', dir: 82, maxR: 30, detail: 2, ...HAND() });
  }
}

// a table: top and legs
function table(r, x, y, w, h, col) {
  r.fill(HR(x, y, w, h * .28, 4, 4), col, { group: 'table', dir: 0, maxR: 40, detail: 1.6, ...HAND() });
  r.fill(HR(x + w * .06, y + h * .28, w * .07, h, 2, 2), col, { group: 'table', dir: 90, maxR: 40, detail: 1.6, ...HAND() });
  r.fill(HR(x + w * .87, y + h * .28, w * .07, h, 2, 2), col, { group: 'table', dir: 90, maxR: 40, detail: 1.6, ...HAND() });
}


// a hand: a fist, or fingers gripping
function fist(r, x, y, s, col, o = {}) {
  r.fill(HE(x, y, s * .5, s * .46, 0, 3), col, { group: o.group ?? 'fig', dir: 0, maxR: s * .5, detail: 2, ...HAND() });
  for (let i = 0; i < 4; i++) {
    r.fill(HR(x - s * .42 + i * s * .22, y - s * .3, s * .17, s * .18, 2, 2), col,
      { group: o.group ?? 'fig', dir: 0, maxR: s * .18, detail: 2, ...HAND({ type: 2 }) });
  }
}

// a cloth bag, slumped
function bag(r, x, y, w, h, col, o = {}) {
  r.fill(HP([[x - w * .5, y - h * .8], [x - w * .3, y - h], [x + w * .3, y - h * .95],
    [x + w * .5, y - h * .7], [x + w * .38, y], [x - w * .42, y]], 5, 4), col,
    { group: o.group ?? 'bag', dir: -12, maxR: 70, detail: 1.6, ...HAND() });
  if (o.open) r.fill(HE(x, y - h * .78, w * .3, h * .16, 0, 3), '#140f0a',
    { group: o.group ?? 'bag', dir: 0, maxR: 40, detail: 2, ...HAND() });
}

// a banknote, flat on the floor
function note(r, x, y, w, h, col, a) {
  r.fill(HP([[x - w / 2, y - h / 2 + Math.sin(a) * 6], [x + w / 2, y - h / 2 + Math.sin(a) * 6],
    [x + w / 2, y + h / 2 + Math.sin(a) * 6], [x - w / 2, y + h / 2 + Math.sin(a) * 6]], 2, 1), col,
    { group: 'note', dir: a * 57, maxR: 34, detail: 2, ...HAND({ type: 2 }) });
}


// a tattooed shoulder, a hint of colour against black
function tattoo(r, x, y, s, col) {
  r.fill(HL([[x - s, y - s * .5], [x, y], [x + s, y - s * .4]], 2), col, { group: 'tattoo', dir: 20, maxR: s * .2, detail: 2, ...HAND({ type: 2 }) });
}

// a wedding invitation, drifting
function invitation(r, x, y, w, h, o = {}) {
  r.fill(HP([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2 - 22], [x + w / 2 + 14, y + h / 2 - 18], [x - w / 2, y + h / 2]], 4, 3), o.col ?? '#ded6c0',
    { group: 'invite', dir: -8, maxR: 60, detail: 1.6, ...HAND() });
  if (o.text) r.text(o.text, x, y + 12, '500 44px "Cormorant SC"', '#8a6a44',
    { dir: 'edge', fallback: 8, maxR: 12, group: 'invite' });
}

// ---- the plates ----------------------------------------------------------
// One function per shot family. Each is a flat reference drawing that the
// knife then paints over.

const PLATES = {

  // the question. He sits with his back to us; the window is cold; the lamp
  // is far away and low.
  room(r) {
    field(r, [[0, '#232a33'], [.62, '#141920'], [1, '#0b0d11']]);
    floor(r, 842, '#2a1d13', '#100b07');
    window(r, 1298, 176, 404, 520, '#b9c8d8');
    shaft(r, [[1290, 806], [1720, 806], [1850, 1080], [1090, 1080]], 'rgba(150,175,205,.10)');
    door(r, 150, 232, 306, 646, '#3b2a1d', '#2c1f16', '#c9a35e');
    table(r, 700, 856, 520, 150, '#2b1d13');
    r.fill(HE(1156, 828, 24, 26, 0, 2), '#8d7c62', { group: 'table', dir: 0, maxR: 20, detail: 2, ...HAND() });
    seated(r, 900, 930, 250, 300, CP, { lc: COLD, group: 'fig' });
    glow(r, 300, 760, 20, 520, 'rgba(232,180,99,.30)');
  },

  // what he remembers: her, on the other side of the bars, in the rain
  memory(r) {
    field(r, [[0, '#1d232b'], [.6, '#131820'], [1, '#080a0d']]);
    // bars, close
    for (let i = 0; i < 5; i++) {
      const x = 430 + i * 240;
      r.fill(HR(x, 120, 26, 840, 3, 3), '#0a0c10', { group: 'bar', dir: 90, maxR: 60, detail: 1.8, ...HAND() });
    }
    r.fill(HR(330, 120, 1260, 26, 3, 3), '#0a0c10', { group: 'bar', dir: 0, maxR: 60, detail: 1.8, ...HAND() });
    // her, beyond, small and blurred by the rain
    person(r, 1010, 900, 460, '#46566a', { group: 'fig', light: 1, lc: COLD });
    glow(r, 1030, 620, 30, 520, 'rgba(190,205,225,.16)');
    // the rain
    for (let i = 0; i < 46; i++) {
      const x = 60 + (i * 137) % 1820, y = 20 + (i * 211) % 1000;
      r.fill(HL([[x, y], [x - 12, y + 62]], 1), 'rgba(178,198,220,.42)', { group: 'rain', dir: 100, maxR: 40, detail: 2, ...HAND({ type: 3 }) });
    }
  },

  // the decision: he stands, the door behind him
  resolve(r) {
    field(r, [[0, '#1f242c'], [.6, '#13171d'], [1, '#090b0e']]);
    floor(r, 860, '#251a11', '#0e0a07');
    door(r, 1140, 180, 380, 680, '#33251a', '#261a12', '#b8944f');
    person(r, 760, 960, 620, CP, { light: -1, lc: WARM, arms: [-16, 34, 14, 30] });
    glow(r, 1330, 520, 20, 340, 'rgba(210,180,120,.14)');
  },

  // the knock: the door, filling the frame, shaking
  knockdoor(r) {
    field(r, [[0, '#161a20'], [.6, '#0e1116'], [1, '#08090c']]);
    door(r, 360, 96, 1200, 860, '#4a3626', '#33241a', '#c9a35e');
    r.fill(HP([[330, 96], [368, 96], [368, 956], [330, 956]], 3, 2), 'rgba(160,185,210,.22)',
      { group: 'light', dir: 90, maxR: 40, detail: 1.6, ...HAND() });
    glow(r, 960, 540, 60, 900, 'rgba(0,0,0,.45)', 'shade');
  },

  // her face: the fear
  herface(r) {
    field(r, [[0, '#242a33'], [.6, '#161a20'], [1, '#0b0d11']]);
    glow(r, 760, 460, 40, 760, 'rgba(224,196,150,.16)');
    womanFace(r, 880, 560, 250, '#8d7a68', { hair: '#181310', eye: '#efe6d8', mouth: .30, mouthCol: '#4a2320', lc: WARM });
  },

  // him at the inner door, asking
  himdoor(r) {
    field(r, [[0, '#232a33'], [.6, '#141920'], [1, '#0a0c10']]);
    floor(r, 800, '#241a11', '#0d0a07');
    door(r, 1180, 120, 420, 680, '#33251a', '#261a12', '#b8944f');
    person(r, 760, 940, 640, CP, { light: -1, lc: WARM, arms: [-12, 30, 10, 32] });
    glow(r, 1390, 480, 20, 320, 'rgba(200,180,140,.12)');
  },

  // her hands pushing him back
  herpush(r) {
    field(r, [[0, '#222833'], [.6, '#131720'], [1, '#090b0f']]);
    // two arms across his chest
    r.fill(HL([[560, 700], [800, 660], [960, 600]], 4), '#6b5849', { group: 'arm', dir: -14, maxR: 80, detail: 1.8, ...HAND() });
    r.fill(HL([[520, 780], [780, 720], [950, 640]], 4), '#61503f', { group: 'arm', dir: -16, maxR: 76, detail: 1.8, ...HAND() });
    person(r, 1150, 980, 700, CP, { light: -1, lc: COLD, f: -1 });
    glow(r, 620, 520, 40, 620, 'rgba(190,200,220,.12)');
  },

  // they come in: the hallway blown out behind them
  doorway(r) {
    field(r, [[0, '#0d0f13'], [.6, '#14110e'], [1, '#070607']]);
    r.fill(HR(700, 150, 540, 810, 4, 5), '#d8c39a', { group: 'hall', dir: 90, maxR: 60, detail: 1.4, ...HAND() });
    glow(r, 970, 520, 40, 760, 'rgba(255,232,180,.35)');
    person(r, 806, 1010, 520, BRO, { light: 1, lc: WARM, f: 1 });
    person(r, 1140, 1010, 540, BRO, { light: -1, lc: WARM, f: 1 });
    r.fill(HE(972, 470, 74, 80, 0, 5), '#08090b', { group: 'fig', dir: 0, maxR: 70, detail: 2, ...HAND() });
    r.fill(HP([[898, 550], [1046, 550], [1092, 1010], [852, 1010]], 5, 4), '#08090b',
      { group: 'fig', dir: 90, maxR: 60, detail: 1.4, ...HAND() });
    tattoo(r, 860, 700, 40, '#1c1410');
    tattoo(r, 1180, 720, 40, '#1c1410');
  },

  // the bald man's head, filling the right of the frame
  baldhead(r) {
    field(r, [[0, '#100d0b'], [.55, '#1a1210'], [1, '#060505']]);
    glow(r, 1080, 460, 40, 900, 'rgba(236,176,96,.24)');
    baldHead(r, 1310, 470, 232, '#7d5c3d', { shine: 'rgba(244,226,186,.5)', lc: DARK });
    r.fill(HP([[1090, 720], [1540, 700], [1600, 1080], [1040, 1080]], 6, 5), '#0d0b0a',
      { group: 'head', dir: 90, maxR: 60, detail: 1.4, ...HAND() });
  },

  // her, nodding, the money already promised
  hernod(r) {
    field(r, [[0, '#2a2119'], [.6, '#181410'], [1, '#0b0908']]);
    glow(r, 700, 520, 40, 700, 'rgba(232,196,140,.18)');
    womanFace(r, 880, 560, 235, '#8f7d69', { hair: '#1a1410', eye: '#efe6d8', mouth: .36, mouthCol: '#5a3a30', lc: WARM });
  },

  // the bag, coming out of the corner
  bagout(r) {
    field(r, [[0, '#3a2a1c'], [1, '#140e08']]);
    r.fill(HP([[0, 0], [1920, 0], [1920, 260], [0, 300]], 6, 5), '#0a0806',
      { group: 'shade', dir: 0, maxR: 46, detail: 1.4, ...HAND() });
    glow(r, 900, 800, 40, 760, 'rgba(240,178,92,.34)');
    bag(r, 980, 900, 420, 300, '#6b5233', { open: false });
  },

  // the neighbours, out in the lane, half hidden
  neighb(r) {
    field(r, [[0, '#1c2129'], [.6, '#12161c'], [1, '#0a0c0f']]);
    floor(r, 880, '#1d1811', '#0b0908');
    // the doorway they crowd round
    r.fill(HR(760, 180, 420, 700, 4, 5), '#0a0c0f', { group: 'door', dir: 90, maxR: 200, detail: 1.5, ...HAND() });
    glow(r, 970, 520, 30, 480, 'rgba(228,196,140,.20)');
    neighbour(r, 620, 1000, 430, NEI, { lc: COLD });
    neighbour(r, 1180, 1010, 450, NEI, { lc: COLD });
    neighbour(r, 1420, 990, 400, NEI, { lc: COLD });
  },

  // his hand takes the bag
  bagseize(r) {
    field(r, [[0, '#33261a'], [1, '#120d08']]);
    glow(r, 900, 700, 40, 700, 'rgba(235,180,96,.30)');
    bag(r, 900, 830, 380, 260, '#6b5233');
    // the fist on the strap
    fist(r, 1010, 560, 150, '#5d4530', { group: 'fig' });
    r.fill(HL([[960, 620], [900, 760]], 3), '#5d4530', { group: 'fig', dir: 100, maxR: 40, detail: 2, ...HAND() });
  },

  // the bag turned over: worn notes and coins
  bagspill(r) {
    field(r, [[0, '#3a2a1c'], [1, '#140e08']]);
    r.fill(HP([[0, 0], [1920, 0], [1920, 260], [0, 300]], 6, 5), '#0a0806',
      { group: 'shade', dir: 0, maxR: 46, detail: 1.4, ...HAND() });
    glow(r, 900, 800, 40, 760, 'rgba(240,178,92,.34)');
    bag(r, 700, 700, 300, 220, '#5c4530', { open: true });
    const notes = [[700, 800, -14], [760, 852, 9], [860, 872, -5], [980, 850, 16], [1080, 838, -22], [1140, 890, 6],
      [640, 860, 20], [940, 906, -9], [1240, 862, 12], [560, 906, -17]];
    notes.forEach(([x, y, a], i) => {
      note(r, x, y, 116 + (i % 3) * 12, 54, i % 3 === 0 ? '#a8a291' : i % 3 === 1 ? '#8d8877' : '#c0b9a4', a);
    });
    [[820, 812], [880, 786], [1010, 800], [970, 884], [1120, 792], [700, 836], [1190, 866], [900, 830]].forEach(([x, y], i) => {
      r.fill(HE(x, y, 17, 15, 0, 1), i % 2 ? '#d9b45a' : '#9a9a92',
        { group: 'coin', dir: 0, maxR: 16, detail: 2, ...HAND({ type: 2 }) });
    });
  },

  // he holds it up, the room behind him
  bagheld(r) {
    field(r, [[0, '#2a1f16'], [.6, '#191410'], [1, '#0b0908']]);
    glow(r, 960, 420, 40, 620, 'rgba(236,184,100,.22)');
    person(r, 960, 1060, 700, CP, { light: 1, lc: WARM, arms: [-13, 26, 13, 26] });
    bag(r, 960, 560, 320, 220, '#6b5233', { open: false });
    r.fill(HL([[900, 640], [960, 600], [1020, 640]], 3), '#5d4530', { group: 'fig', dir: 0, maxR: 40, detail: 2, ...HAND() });
  },

  // the kick: her on the floor, the stool tipped, a boot mid-arc
  kick(r) {
    field(r, [[0, '#1d222a'], [.62, '#12151a'], [1, '#08090b']]);
    floor(r, 860, '#2b1d14', '#0d0906');
    seated(r, 820, 900, 380, 190, MAM, { lc: WARM });
    // the stool, tipped over
    r.fill(HP([[1230, 900], [1330, 872], [1352, 906], [1252, 934]], 3, 2), '#2a1d13',
      { group: 'stool', dir: -12, maxR: 30, detail: 2, ...HAND() });
    r.fill(HL([[1250, 924], [1236, 1012]], 2), '#241811', { group: 'stool', dir: 84, maxR: 30, detail: 2, ...HAND() });
    r.fill(HL([[1340, 912], [1352, 998]], 2), '#241811', { group: 'stool', dir: 82, maxR: 30, detail: 2, ...HAND() });
    person(r, 560, 940, 640, BRO, { light: 1, lc: WARM, lean: 10, tilt: -.06 });
    // the boot, mid-arc
    r.fill(HP([[1690, 560], [1790, 600], [1420, 800], [1360, 742]], 6, 5), '#07080a',
      { group: 'kick', dir: 152, maxR: 60, detail: 1.6, ...HAND() });
    glow(r, 1560, 700, 30, 460, 'rgba(190,60,50,.18)');
  },

  // "Mum!" — he is out of the inner room
  himout(r) {
    field(r, [[0, '#1e232b'], [.6, '#12151a'], [1, '#08090b']]);
    floor(r, 860, '#281c13', '#0c0906');
    r.fill(HR(120, 140, 420, 720, 4, 5), '#0a0c10', { group: 'door', dir: 90, maxR: 200, detail: 1.5, ...HAND() });
    glow(r, 330, 500, 30, 460, 'rgba(200,190,170,.14)');
    person(r, 700, 960, 640, CP, { light: -1, lc: COLD, arms: [-20, 22, 18, 20] });
    seated(r, 1250, 940, 280, 160, MAM, { lc: COLD });
  },

  // the stare: him against the window light, the others small behind
  stare(r) {
    field(r, [[0, '#1b2028'], [.62, '#10141a'], [1, '#07080a']]);
    shaft(r, [[0, 150], [300, 190], [300, 900], [0, 940]], 'rgba(150,178,210,.24)');
    person(r, 520, 1010, 470, BRO, { light: -1, lc: COLD });
    person(r, 1420, 1010, 490, BRO, { light: -1, lc: COLD });
    person(r, 960, 1040, 760, CP, { light: -1, lc: COLD });
    rim(r, 960, 1040, 760, 'rgba(168,194,224,.55)', -1);
    rim(r, 960, 1040, 760, 'rgba(168,194,224,.34)', 1);
    r.fill(HE(960 - 22.8, 358.3, 11, 7, 0, 1), '#e6eef8', { group: 'eyes', dir: 0, maxR: 10, detail: 2, ...HAND({ type: 2 }) });
    r.fill(HE(960 + 22.8, 358.3, 11, 7, 0, 1), '#e6eef8', { group: 'eyes', dir: 0, maxR: 10, detail: 2, ...HAND({ type: 2 }) });
  },

  // she pushes him back again
  pushagain(r) {
    field(r, [[0, '#212732'], [.6, '#12161d'], [1, '#090a0e']]);
    r.fill(HP([[480, 660], [780, 620], [980, 570]], 4, 3), { group: 'arm', dir: -14, maxR: 80, detail: 1.8, ...HAND() });
    r.fill(HP([[450, 750], [760, 690], [970, 610]], 4, 3), { group: 'arm', dir: -16, maxR: 76, detail: 1.8, ...HAND() });
    person(r, 1180, 980, 700, CP, { light: -1, lc: COLD, f: -1 });
    glow(r, 560, 500, 40, 620, 'rgba(190,200,220,.12)');
  },

  // he seats her on the stool and turns
  sitdown(r) {
    field(r, [[0, '#1f242d'], [.6, '#131720'], [1, '#0a0c10']]);
    floor(r, 880, '#251a11', '#0d0a07');
    stool(r, 1180, 900, 220, 210, '#2a1d13');
    seated(r, 1180, 900, 300, 240, MAM, { lc: WARM });
    person(r, 700, 960, 660, CP, { light: 1, lc: WARM, arms: [8, 30, 16, 22] });
    glow(r, 1440, 500, 20, 380, 'rgba(200,180,140,.10)');
  },

  // the wedding invitation, drifting in
  invitation(r) {
    field(r, [[0, '#1a1410'], [.6, '#120e0b'], [1, '#080707']]);
    glow(r, 900, 480, 40, 700, 'rgba(230,180,100,.20)');
    invitation(r, 900, 500, 300, 210, { text: 'wedding' });
    // his hand, out of focus at the edge
    r.fill(HP([[1380, 620], [1560, 660], [1600, 780], [1400, 740]], 6, 4), '#0d0b0a',
      { group: 'fig', dir: -10, maxR: 90, detail: 1.6, ...HAND() });
  },

  // the brothers, laughing
  bros(r) {
    field(r, [[0, '#171310'], [.55, '#130f0d'], [1, '#070606']]);
    person(r, 620, 1040, 560, BRO, { light: -1, lc: WARM });
    person(r, 960, 1050, 600, BALD, { light: 1, lc: WARM });
    person(r, 1300, 1040, 550, BRO, { light: -1, lc: WARM });
    r.fill(HE(960, 620, 66, 72, 0, 5), '#07080a', { group: 'fig', dir: 0, maxR: 70, detail: 2, ...HAND() });
    tattoo(r, 700, 780, 46, '#201711');
    tattoo(r, 1320, 770, 46, '#201711');
    glow(r, 960, 460, 40, 700, 'rgba(230,180,100,.18)');
  },

  // "What did you say?" — darker now
  whatdid(r) {
    field(r, [[0, '#0d1014'], [.6, '#080a0d'], [1, '#040405']]);
    person(r, 960, 1080, 800, CP, { light: -1, lc: COLD });
    rim(r, 960, 1080, 800, 'rgba(140,165,200,.28)', -1);
    r.fill(HE(960 - 24, 362.4, 12, 8, 0, 1), '#e6eef8', { group: 'eyes', dir: 0, maxR: 11, detail: 2, ...HAND({ type: 2 }) });
    r.fill(HE(960 + 24, 362.4, 12, 8, 0, 1), '#e6eef8', { group: 'eyes', dir: 0, maxR: 11, detail: 2, ...HAND({ type: 2 }) });
    glow(r, 420, 560, 40, 620, 'rgba(140,165,200,.14)');
  },

  // the Regal Hotel, seen through the rain
  wedding(r) {
    field(r, [[0, '#101720'], [.6, '#0c1018'], [1, '#06080c']]);
    // the hotel front: a big lit slab
    r.fill(HR(520, 130, 900, 800, 6, 6), '#1a222c', { group: 'hotel', dir: 90, maxR: 90, detail: 1.4, ...HAND() });
    for (let f = 0; f < 6; f++) for (let g = 0; g < 9; g++) {
      if ((f * 9 + g) % 4 === 0) continue;           // some windows are dark
      r.fill(HR(566 + g * 92, 176 + f * 122, 62, 78, 3, 2), f % 2 ? '#c8a95e' : '#d9c07e',
        { group: 'win', dir: 0, maxR: 40, detail: 1.8, ...HAND() });
    }
    glow(r, 970, 500, 40, 700, 'rgba(216,178,100,.16)');
    // the rain on the glass
    for (let i = 0; i < 40; i++) {
      const x = 60 + (i * 149) % 1800, y = 20 + (i * 223) % 1000;
      r.fill(HL([[x, y], [x - 14, y + 70]], 1), 'rgba(178,198,220,.42)', { group: 'rain', dir: 100, maxR: 44, detail: 2, ...HAND({ type: 3 }) });
    }
  },

  // his fist, clenched
  fistclench(r) {
    field(r, [[0, '#0e1114'], [.6, '#080a0c'], [1, '#050607']]);
    fist(r, 960, 700, 300, '#241d18', { group: 'fist' });
    glow(r, 700, 500, 40, 620, 'rgba(150,170,200,.12)');
  },

  // "Kneel down and apologise to my mother."
  order(r) {
    field(r, [[0, '#0b0e12'], [.62, '#080a0d'], [1, '#040506']]);
    flame(r, 960, 1080, 800, '#070910');
    person(r, 960, 1080, 760, CP, { light: -1, lc: COLD });
    glow(r, 560, 560, 40, 700, 'rgba(120,150,190,.14)');
    r.fill(HE(960 - 22.8, 398.3, 13, 9, 0, 1), '#dfeaf6', { group: 'eyes', dir: 0, maxR: 12, detail: 2, ...HAND({ type: 2 }) });
    r.fill(HE(960 + 22.8, 398.3, 13, 9, 0, 1), '#dfeaf6', { group: 'eyes', dir: 0, maxR: 12, detail: 2, ...HAND({ type: 2 }) });
  },

  // the room gone cold: everyone frozen
  coldroom(r) {
    field(r, [[0, '#0a0d11'], [.62, '#070910'], [1, '#040507']]);
    floor(r, 870, '#1a1510', '#08080a');
    person(r, 700, 1000, 520, BRO, { light: -1, lc: COLD });
    person(r, 1180, 1010, 540, BRO, { light: -1, lc: COLD });
    r.fill(HE(960, 640, 60, 66, 0, 4), '#07080a', { group: 'fig', dir: 0, maxR: 66, detail: 2, ...HAND() });
    glow(r, 960, 300, 60, 700, 'rgba(90,120,160,.10)');
  },

  // the bald man's anger
  baldangry(r) {
    field(r, [[0, '#1a0e0c'], [.55, '#140b09'], [1, '#070505']]);
    glow(r, 1000, 420, 40, 760, 'rgba(226,120,70,.22)');
    baldHead(r, 1290, 460, 240, '#7a5638', { shine: 'rgba(244,220,180,.42)', lc: BLOOD });
    r.fill(HP([[1080, 730], [1540, 710], [1600, 1080], [1030, 1080]], 6, 5), '#0c0a09',
      { group: 'head', dir: 90, maxR: 60, detail: 1.4, ...HAND() });
  },

  // the fist coming at him
  fistcome(r) {
    field(r, [[0, '#181114'], [.6, '#0f0a0c'], [1, '#060506']]);
    fist(r, 1080, 560, 420, '#4a3526', { group: 'fig' });
    person(r, 480, 1000, 660, CP, { light: 1, lc: BLOOD, f: -1 });
    glow(r, 1380, 420, 40, 620, 'rgba(220,140,90,.18)');
  },

  // the blow
  impact(r) {
    field(r, [[0, '#1c1113'], [.6, '#110b0c'], [1, '#070505']]);
    glow(r, 980, 520, 30, 560, 'rgba(240,200,150,.30)');
    // the blur of the hit
    r.fill(HP([[880, 380], [1180, 440], [1240, 640], [900, 600]], 8, 6), 'rgba(226,196,150,.30)',
      { group: 'light', dir: 20, maxR: 120, detail: 1.2, ...HAND() });
    person(r, 420, 1020, 680, CP, { light: 1, lc: BLOOD, f: -1 });
    r.fill(HE(1180, 480, 88, 92, 0, 6), '#0a0b0c', { group: 'fig', dir: 0, maxR: 90, detail: 2, ...HAND() });
  },

  // his counter-kick
  counter(r) {
    field(r, [[0, '#1b1218'], [.6, '#110b10'], [1, '#070508']]);
    r.fill(HP([[1560, 520], [1660, 570], [1180, 800], [1120, 730]], 6, 5), '#06070a',
      { group: 'kick', dir: 152, maxR: 70, detail: 1.6, ...HAND() });
    person(r, 500, 1000, 700, BRO, { light: 1, lc: BLOOD, lean: 12, tilt: .05 });
    seated(r, 1420, 940, 300, 180, MAM, { lc: BLOOD });
    glow(r, 1300, 660, 30, 460, 'rgba(200,80,70,.18)');
  },

  // the bald man down, holding himself
  balddown(r) {
    field(r, [[0, '#191113'], [.6, '#0f0b0d'], [1, '#060506']]);
    floor(r, 880, '#281b16', '#0b0909');
    seated(r, 900, 940, 420, 210, BALD, { lc: WARM });
    baldHead(r, 700, 740, 120, '#6b4d33', { lc: WARM });
    glow(r, 600, 700, 30, 460, 'rgba(220,150,90,.14)');
  },

  // she is shouting at him
  heralarm(r) {
    field(r, [[0, '#232a33'], [.6, '#161a20'], [1, '#0b0d11']]);
    glow(r, 700, 480, 40, 700, 'rgba(224,190,150,.18)');
    womanFace(r, 880, 560, 245, '#907c68', { hair: '#181310', eye: '#f2eade', mouth: .5, mouthCol: '#4a1c1a', lc: BLOOD, open: .6 });
  },

  // the bald man roaring from the floor
  roar(r) {
    field(r, [[0, '#1e1010'], [.55, '#150c0c'], [1, '#070505']]);
    glow(r, 900, 560, 40, 620, 'rgba(230,130,80,.18)');
    baldHead(r, 900, 520, 190, '#6f4f33', { shine: 'rgba(240,210,170,.36)', lc: BLOOD });
    r.fill(HP([[740, 740], [1080, 720], [1140, 1080], [700, 1080]], 6, 5), '#0b0909',
      { group: 'head', dir: 90, maxR: 60, detail: 1.4, ...HAND() });
  },

  // they come at him
  rush(r) {
    field(r, [[0, '#171013'], [.6, '#0e0a0c'], [1, '#060506']]);
    person(r, 420, 1060, 620, BRO, { light: 1, lc: BLOOD, lean: -10, tilt: -.06 });
    person(r, 820, 1070, 640, BRO, { light: 1, lc: BLOOD, lean: -6, tilt: -.03 });
    person(r, 1240, 1060, 620, BRO, { light: -1, lc: BLOOD, lean: 8, tilt: .05 });
    person(r, 1560, 1040, 580, BRO, { light: -1, lc: BLOOD, lean: 11, tilt: .08 });
    glow(r, 960, 300, 40, 620, 'rgba(180,90,80,.12)');
  },

  // the white light, and them going down
  whitefl(r) {
    field(r, [[0, '#c9d4e2'], [.55, '#a8b6c8'], [1, '#6f7c90']]);
    glow(r, 960, 520, 40, 900, 'rgba(255,255,255,.55)');
    person(r, 700, 1060, 620, 'rgba(28,34,44,.55)', { light: -1, lc: WHITE });
    person(r, 1180, 1070, 640, 'rgba(28,34,44,.55)', { light: 1, lc: WHITE });
    glow(r, 300, 300, 20, 320, 'rgba(255,255,255,.35)');
    glow(r, 1640, 780, 20, 320, 'rgba(255,255,255,.30)');
  },

  // the bald man's shock
  baldshock(r) {
    field(r, [[0, '#1b1114'], [.55, '#120b0e'], [1, '#070506']]);
    glow(r, 1180, 460, 40, 780, 'rgba(200,170,190,.18)');
    baldHead(r, 1290, 480, 230, '#745334', { shine: 'rgba(238,214,180,.40)', lc: DARK });
    r.fill(HP([[1080, 740], [1540, 720], [1600, 1080], [1030, 1080]], 6, 5), '#0b090a',
      { group: 'head', dir: 90, maxR: 60, detail: 1.4, ...HAND() });
  },

  // "Apologise to my mother!"
  command(r) {
    field(r, [[0, '#0a0d10'], [.62, '#070a0c'], [1, '#040506']]);
    person(r, 960, 1080, 800, CP, { light: -1, lc: COLD });
    rim(r, 960, 1080, 800, 'rgba(150,175,210,.40)', -1);
    r.fill(HE(960 - 24, 362.4, 14, 9, 0, 1), '#e8f0fa', { group: 'eyes', dir: 0, maxR: 13, detail: 2, ...HAND({ type: 2 }) });
    r.fill(HE(960 + 24, 362.4, 14, 9, 0, 1), '#e8f0fa', { group: 'eyes', dir: 0, maxR: 13, detail: 2, ...HAND({ type: 2 }) });
    glow(r, 400, 620, 40, 640, 'rgba(120,150,190,.14)');
  },

  // they are on their knees
  kneel(r) {
    field(r, [[0, '#0c0f13'], [.62, '#080b0e'], [1, '#050607']]);
    floor(r, 880, '#1c1712', '#090809');
    person(r, 700, 1040, 700, BRO, { light: -1, lc: WARM });
    // two of them, down on their knees
    for (const [x, y] of [[1180, 900], [1480, 910]]) {
      r.fill(HP([[x - 110, y - 150], [x + 110, y - 140], [x + 130, y], [x - 130, y]], 5, 4), '#07080a',
        { group: 'fig', dir: 90, maxR: 150, detail: 1.5, ...HAND() });
      r.fill(HE(x - 70, y - 170, 46, 48, 0, 4), '#07080a', { group: 'fig', dir: 0, maxR: 48, detail: 2, ...HAND() });
    }
  },

  // "Get lost!" — the hand that waves them out
  wave(r) {
    field(r, [[0, '#0b0e11'], [.6, '#080a0c'], [1, '#040506']]);
    person(r, 700, 1060, 760, CP, { light: -1, lc: COLD, arms: [4, 34, 30, -26] });
    glow(r, 1400, 520, 30, 620, 'rgba(120,150,190,.12)');
  },

  // they go, limping
  limping(r) {
    field(r, [[0, '#1e252e'], [.6, '#141920'], [1, '#0b0d10']]);
    floor(r, 860, '#221a12', '#0b0908');
    // the lane, going down to the left
    r.fill(HP([[0, 700], [1920, 820], [1920, 1080], [0, 1080]], 7, 6), '#171310',
      { group: 'floor', dir: -8, fallback: -8, maxR: 80, detail: 1.4, ...HAND() });
    person(r, 700, 980, 470, BRO, { light: 1, lc: COLD, lean: -9, tilt: .09 });
    person(r, 1080, 950, 450, BRO, { light: 1, lc: COLD, lean: -12, tilt: .12 });
    person(r, 1440, 930, 440, BRO, { light: 1, lc: COLD, lean: -15, tilt: .15 });
    glow(r, 300, 420, 30, 520, 'rgba(190,205,225,.14)');
  },
};

// the flame-like cold that comes off him in the order shot
function flame(r, x, baseY, h, col) {
  r.fill(HP([[x - h * .3, baseY], [x - h * .18, baseY - h * .5], [x, baseY - h],
    [x + h * .18, baseY - h * .55], [x + h * .3, baseY]], 8, 6), col,
    { group: 'fig', dir: 90, maxR: h * .3, detail: 1.6, ...HAND() });
}

// ---- the shots ----------------------------------------------------------
export function buildShots() {
  const shots = [];
  const shot = (plate, seed) => {
    handSeed(seed);
    const ref = new Ref(1920, 1080, 1);
    plate(ref);
    const strokes = paintRef(ref, { R: LADDER, T: 10, seed, app: APP });
    return { bg: { strokes, ref } };
  };
  let seed = 3;
  for (const key of Object.keys(PLATES)) {
    shots.push([key, shot(PLATES[key], seed++)]);
  }
  return shots;
}

export const PLATE_KEYS = Object.keys(PLATES);
