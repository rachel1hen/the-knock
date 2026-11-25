// The cast.
//
// The demo's people are built out of parts — a shoulder with a slope, a jacket
// that tapers, arms that bend, a head with a jaw and hair — and lit from one
// side, so the knife has a form to follow. Ours are drawn the same way.
//
// A figure is a body, a light and a few defining dabs. Never a circle on a
// block. Every part is its own shape with its own group and its own stroke
// size, so the knife stays inside the body and the silhouette keeps its edge.

import { hex, mixc } from '../engine/impasto.js';
import { P, E, HP, HE, HL, lin, HAND } from './common.js';

const rgb = c => `rgb(${c.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255)).join(',')})`;
const mix = (a, b, t) => rgb(mixc(Array.isArray(a) ? a : hex(a), Array.isArray(b) ? b : hex(b), t));
const lerp2 = (a, b, t) => a + (b - a) * t;

// how the light falls on the plate: the key colour of the room
export const COLD = '#bfd2e8', WARM = '#eec38c', BLOOD = '#e89b84', DARK = '#d9a877', WHITE = '#eef4ff';

// the clothes the cast wears — colours, not shadows
export const CP = '#3a4a5e';     // Chen Ping: a blue-grey jacket
export const MAM = '#5d4a61';    // his mother: a mauve coat
export const BALD = '#4a3c33';   // Bald Head: a dark warm suit
export const BRO = '#2e333c';    // the brothers
export const NEI = '#262d37';    // the neighbours in the lane

// A mapper from the figure's own frame to the plate. The figure is drawn with
// its feet at 0 and the top of its head at -100, facing right; f mirrors it,
// lean shifts the upper body forward, tilt rocks the whole figure.
function mapper(x, baseY, h, o) {
  const f = o.f ?? 1, lean = o.lean ?? 0, tilt = o.tilt ?? 0, s = h / 100;
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  return (u, v) => {
    let uu = u + lean * Math.max(0, -(v + 0.48));
    let vv = v;
    if (tilt) { const nu = uu * ct - vv * st; vv = uu * st + vv * ct; uu = nu; }
    return [x + uu * s * f, baseY + vv * s];
  };
}

// A standing figure.
//
// f     faces left (-1) or right (1)
// light which side the light comes from (-1 left, 1 right)
// lc    the colour of that light
// arms  [leftHandDx, leftHandDy, rightHandDx, rightHandDy]; hand offsets are
//       in percent of the figure's height, measured down from the shoulder
export function person(r, x, baseY, h, col, o = {}) {
  const M = mapper(x, baseY, h, o);
  const lg = o.light ?? -1;
  const g = o.group ?? 'fig';
  const coat = col;
  const dark = mix(coat, '#05070b', .42);         // the side away from the light
  const litc = mix(coat, o.lc ?? COLD, .40);      // the lit plane
  const rimc = o.rim ?? (o.lc ?? COLD);
  const skin = o.skin ?? '#8f7259';
  const skinLit = mix(skin, o.lc ?? COLD, .34);
  const hair = o.hair ?? '#14100c';

  const long = o.long ?? false;
  const hemV = long ? -0.34 : -0.455;
  const hemU = long ? 0.155 : 0.105;

  // ---- legs: two tapered limbs, and a shoe at the bottom of each
  for (const sgn of [-1, 1]) {
    const hipU = sgn * 0.052, ankU = sgn * 0.062;
    const w0 = 0.052, w1 = 0.030;
    r.fill(HP([
      M(hipU - w0, -0.50), M(hipU + w0, -0.52),
      M(ankU + w1 * 1.15, -0.25), M(ankU + w1, -0.055),
      M(ankU - w1, -0.05), M(ankU - w1 * 1.15, -0.24),
      M(hipU - w0 * .95, -0.48),
    ], 3, 2), dark, { group: g, dir: 90, maxR: 26, detail: 1.5, ...HAND() });
    r.fill(HP([M(ankU - w1 * 1.1, -0.045), M(ankU + w1 * 1.5, -0.05),
      M(ankU + w1 * 1.8, 0), M(ankU - w1 * 1.2, 0)], 2, 1), '#05070a',
      { group: g, dir: 0, maxR: 16, detail: 1.6, ...HAND() });
  }

  // ---- the torso: sloped shoulders, a waist, a hem that tapers or flares
  r.fill(HP([
    M(-0.138, -0.795), M(-0.118, -0.62), M(-0.105, -0.50),
    M(-hemU, hemV), M(hemU, hemV),
    M(0.105, -0.50), M(0.118, -0.62), M(0.138, -0.795),
    M(0.042, -0.836), M(-0.042, -0.836),
  ], 4, 3), coat, { group: g, dir: 90, maxR: 34, detail: 1.3, ...HAND() });

  // the lit side of the coat: the plane the window or the lamp finds
  const litPlane = lg < 0
    ? [M(-0.142, -0.80), M(-0.088, -0.80), M(-0.074, -0.47), M(-0.112, hemV), M(-hemU, hemV)]
    : [M(0.142, -0.80), M(0.088, -0.80), M(0.074, -0.47), M(0.112, hemV), M(hemU, hemV)];
  r.fill(HP(litPlane, 3, 2), litc, { group: g + 'lit', dir: 90, maxR: 16, detail: .9, ...HAND() });

  // the collar and a placket down the front: the dabs that say "clothes"
  const cl = o.collar ?? mix(coat, '#ffffff', .18);
  r.fill(HP([M(-0.044, -0.842), M(0.044, -0.842), M(0.016, -0.79), M(-0.016, -0.79)], 3, 2),
    cl, { group: g + 'lit', dir: 0, maxR: 14, detail: 1, ...HAND() });
  r.fill(HL([M(0.012, -0.78), M(0.018, -0.56), M(0.012, hemV + 0.03)], 3),
    cl, { group: g + 'lit', dir: 90, maxR: 9, detail: 1, ...HAND({ type: 2 }) });

  // ---- arms: a shoulder, an elbow, a hand
  const arms = o.arms ?? [];
  for (const sgn of [-1, 1]) {
    const [sx, sy] = M(sgn * 0.125, -0.775);
    const a = arms[sgn > 0 ? 1 : 0] ?? [sgn * 3, 40];
    const [hx, hy] = M(sgn * 0.02 + a[0] * .01, -0.775 + a[1] * .01);
    const ex = lerp2(sx, hx, .45) + (hx - sx) * .10, ey = lerp2(sy, hy, .5);
    const w = 0.040, w2 = 0.026;
    r.fill(HP([
      [sx - w * h / 100, sy + 0.01 * h / 100], [sx + w * h / 100, sy - 0.005 * h / 100],
      [ex + w2 * h / 100, ey], [hx + w2 * .9 * h / 100, hy],
      [hx - w2 * .9 * h / 100, hy], [ex - w2 * h / 100, ey],
    ], 3, 2), lg === sgn ? litc : coat,
      { group: g, dir: 90, maxR: 18, detail: 1.2, ...HAND() });
    r.fill(HE(hx, hy, 0.026 * h / 100, 0.030 * h / 100, 0, 4), lg === sgn ? mix(skin, o.lc ?? COLD, .3) : skin,
      { group: g, dir: 0, maxR: 12, detail: .9, ...HAND() });
  }

  // ---- neck and head
  r.fill(HP([M(-0.030, -0.80), M(0.030, -0.80), M(0.026, -0.872), M(-0.026, -0.872)], 2, 1),
    skin, { group: g, dir: 90, maxR: 12, detail: 1, ...HAND() });

  const hr = 0.070;                          // head radius, in local units
  const hcy = -0.905;
  const head = [];
  for (let i = 0; i <= 22; i++) {           // an egg: a skull that narrows to a jaw
    const a = (i / 22) * Math.PI * 2;
    const k = 1 + 0.10 * Math.cos(a + 0.7);
    const jaw = a > Math.PI * 0.55 && a < Math.PI * 1.45 ? 0.86 : 1;
    head.push(M(Math.cos(a) * hr * k * jaw, hcy + Math.sin(a) * hr * (a > Math.PI * 0.5 && a < Math.PI * 1.45 ? 1.12 : 1)));
  }
  r.fill(P(head), skin, { group: g, dir: 'edge', fallback: 90, maxR: 20, detail: .8, ...HAND() });

  // the lit plane of the face
  const fz = lg < 0 ? -0.03 : 0.03;
  r.fill(HP([M(fz - hr * .55, hcy - hr * .85), M(fz + hr * .18, hcy - hr * .9),
    M(fz + hr * .22, hcy + hr * .5), M(fz - hr * .6, hcy + hr * .45)], 2, 1),
    skinLit, { group: g + 'lit', dir: 90, maxR: 11, detail: .7, ...HAND() });

  // hair: a mass over the crown and down the back of the head
  r.fill(HP([
    M(-hr * 1.06, hcy - hr * .25), M(-hr * .92, hcy - hr * .95),
    M(0, hcy - hr * 1.18), M(hr * .95, hcy - hr * .9),
    M(hr * 1.02, hcy - hr * .2), M(hr * .55, hcy - hr * .62),
    M(-hr * .3, hcy - hr * .78),
  ], 3, 2), hair, { group: g, dir: 0, maxR: 18, detail: 1, ...HAND() });
  if (o.longHair) {
    r.fill(HP([
      M(-hr * 1.02, hcy - hr * .5), M(-hr * 1.3, hcy + hr * 2.4),
      M(-hr * .5, hcy + hr * 2.8), M(-hr * .55, hcy - hr * .6),
    ], 3, 2), hair, { group: g, dir: 90, maxR: 20, detail: 1, ...HAND() });
  }

  // the rim: a thin edge of light down the contour the light wraps around
  const rimPts = lg < 0
    ? [M(-0.150, -0.80), M(-0.135, -0.60), M(-0.120, -0.46), M(-hemU - 0.012, hemV)]
    : [M(0.150, -0.80), M(0.135, -0.60), M(0.120, -0.46), M(hemU + 0.012, hemV)];
  r.fill(HL(rimPts, 2), rimc, { group: 'rim', dir: 90, maxR: 9, detail: .8, ...HAND({ type: 2 }) });

  // eyes: two small dabs, the thing that makes a shape a face
  if (o.face !== false) {
    const ey = hcy + 0.008, ex = 0.030;
    for (const sgn of [-1, 1]) {
      const [ex0, ey0] = M(sgn * ex, ey);
      r.fill(HE(ex0, ey0, 0.011 * h / 100, 0.007 * h / 100, 0, 2), '#140f0b',
        { group: g, dir: 0, maxR: 6, detail: .7, ...HAND({ type: 2 }) });
    }
    const [nx, ny] = M(fz + lg * 0.012, hcy + 0.045);
    r.fill(HE(nx, ny, 0.010 * h / 100, 0.014 * h / 100, 0, 2), mix(skin, '#000000', .35),
      { group: g, dir: 0, maxR: 7, detail: .7, ...HAND({ type: 2 }) });
  }
}

// a figure sitting or fallen: knees up, torso leaning, head down or up.
// h is the whole height of the seated body; w how far the knees reach.
export function seated(r, x, y, w, h, col, o = {}) {
  const g = o.group ?? 'fig';
  const s = h / 100;
  const X = u => x + u * s, Y = v => y + v * s;
  const wu = w / 2 / s;
  const coat = col, dark = mix(coat, '#05070b', .42);
  const litc = mix(coat, o.lc ?? COLD, .40);
  const skin = o.skin ?? '#8f7259';
  // the folded legs: thighs forward, shins down
  r.fill(HP([[X(-30), Y(-32)], [X(wu * .8), Y(-26)], [X(wu * .86), Y(-6)],
    [X(wu * .58), Y(-4)], [X(wu * .5), Y(-18)], [X(-28), Y(-22)]], 4, 3), dark,
    { group: g, dir: 0, maxR: 22, detail: 1.4, ...HAND() });
  // the torso, leaning back a little
  r.fill(HP([[X(-26), Y(-34)], [X(-24), Y(-56)], [X(2), Y(-64)], [X(26), Y(-56)],
    [X(30), Y(-30)], [X(30), Y(-6)], [X(-26), Y(-4)]], 4, 3), coat,
    { group: g, dir: 90, maxR: 26, detail: 1.3, ...HAND() });
  // the lit plane of the chest
  r.fill(HP([[X(-24), Y(-36)], [X(-18), Y(-56)], [X(-4), Y(-60)], [X(-12), Y(-34)]], 3, 2), litc,
    { group: g + 'lit', dir: 90, maxR: 13, detail: .9, ...HAND() });
  // an arm on the floor
  r.fill(HP([[X(-20), Y(-50)], [X(-2), Y(-42)], [X(30), Y(-28)], [X(26), Y(-18)], [X(-14), Y(-36)]], 3, 2), coat,
    { group: g, dir: 0, maxR: 15, detail: 1.1, ...HAND() });
  // the head, tipped
  const hr = 9.5;
  r.fill(HE(X(-12), Y(-72), hr * .92, hr, 0, 4), skin,
    { group: g, dir: 'edge', fallback: 90, maxR: 15, detail: .8, ...HAND() });
  r.fill(HP([[X(-24), Y(-78)], [X(-12), Y(-86)], [X(-2), Y(-76)], [X(-14), Y(-66)]], 3, 2),
    o.hair ?? '#14100c', { group: g, dir: 0, maxR: 13, detail: 1, ...HAND() });
}

// a neighbour seen from behind, on a landing
export function neighbour(r, x, baseY, h, col, o = {}) {
  const g = o.group ?? 'fig';
  const s = h / 100;
  const X = u => x + u * s, Y = v => baseY + v * s;
  const coat = col, litc = mix(coat, o.lc ?? COLD, .30);
  // the coat, seen from behind: broad shoulders, a hem that flares
  r.fill(HP([[X(-15), Y(-78)], [X(-13), Y(-54)], [X(-17), Y(-40)], [X(17), Y(-40)],
    [X(13), Y(-54)], [X(15), Y(-78)], [X(5), Y(-83)], [X(-5), Y(-83)]], 4, 3), coat,
    { group: g, dir: 90, maxR: 30, detail: 1.4, ...HAND() });
  // the shoulders catch the light
  r.fill(HP([[X(-15), Y(-79)], [X(-5), Y(-85)], [X(-7), Y(-74)], [X(-13), Y(-70)]], 3, 2), litc,
    { group: g + 'lit', dir: 0, maxR: 13, detail: .9, ...HAND() });
  // the head, from behind
  r.fill(HE(X(0), Y(-88), 8.4, 9.0, 0, 4), o.hair ?? '#14100c',
    { group: g, dir: 0, maxR: 15, detail: 1, ...HAND() });
  if (o.hood) {
    r.fill(HP([[X(-13), Y(-84)], [X(0), Y(-99)], [X(13), Y(-84)], [X(15), Y(-72)], [X(-15), Y(-72)]], 3, 2), o.hood,
      { group: g, dir: 90, maxR: 22, detail: 1.1, ...HAND() });
  }
}

// A woman's face, front on: the fear, then the anger, then the shock.
// The demo's girl is the model here — bangs, a jaw, a nose, real lips.
export function womanFace(r, x, y, s, col, o = {}) {
  const g = o.group ?? 'head';
  const hair = o.hair ?? '#1b1410';
  const skin = col;
  const lit = mix(skin, o.lc ?? WARM, .40);
  const lc = o.lc ?? WARM;
  // the face: an egg, narrower at the jaw
  const face = [];
  for (let i = 0; i <= 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const k = 1 + .07 * Math.cos(a + .6);
    const jaw = a > Math.PI * .5 && a < Math.PI * 1.5 ? .86 : 1;
    face.push([x + Math.cos(a) * s * .64 * k * jaw, y + Math.sin(a) * s * .84 * jaw]);
  }
  r.fill(P(face), skin, { group: g, dir: 'edge', fallback: 90, maxR: s * .3, detail: .8, ...HAND() });
  // the lit side
  r.fill(HP([[x - s * .5, y - s * .62], [x - s * .05, y - s * .72], [x - s * .02, y + s * .5], [x - s * .52, y + s * .34]], 3, 2),
    lit, { group: g + 'lit', dir: 90, maxR: s * .16, detail: .7, ...HAND() });
  // hair: a mass behind, and bangs over the brow
  r.fill(HP([[x - s * .82, y - s * .78], [x - s * .96, y + s * .5], [x - s * .5, y + s * .32],
    [x - s * .46, y - s * .9], [x + s * .46, y - s * .9], [x + s * .52, y + s * .32],
    [x + s * .96, y + s * .5], [x + s * .82, y - s * .78]], 5, 4), hair,
    { group: g, dir: 90, maxR: s * .34, detail: 1.2, ...HAND() });
  r.fill(HP([[x - s * .62, y - s * .76], [x - s * .3, y - s * .96], [x + s * .2, y - s * .92],
    [x + s * .58, y - s * .7], [x + s * .44, y - s * .78], [x + s * .05, y - s * .84],
    [x - s * .34, y - s * .82]], 4, 3), hair,
    { group: g, dir: 0, maxR: s * .22, detail: .9, ...HAND() });
  // brows and eyes
  const ey = y - s * .06;
  for (const sgn of [-1, 1]) {
    r.fill(HP([[x + sgn * s * .1, ey - s * .18], [x + sgn * s * .38, ey - s * .2]], 2, 1), hair,
      { group: g, dir: 6, maxR: s * .08, detail: .9, ...HAND({ type: 2 }) });
    r.fill(HE(x + sgn * s * .24, ey, s * .11, s * .07, 0, 2), o.eye ?? '#efe6d8',
      { group: g, dir: 0, maxR: s * .1, detail: .8, ...HAND() });
    r.fill(HE(x + sgn * s * .24, ey, s * .05, s * .055, 0, 2), '#241a14',
      { group: g, dir: 0, maxR: s * .05, detail: .8, ...HAND({ type: 2 }) });
  }
  // the nose: a shadow and a lit edge
  r.fill(HP([[x + s * .04, ey - s * .02], [x + s * .12, ey + s * .2], [x + s * .02, ey + s * .22]], 2, 1),
    mix(skin, '#000000', .38), { group: g, dir: 90, maxR: s * .08, detail: .9, ...HAND({ type: 2 }) });
  r.fill(HP([[x - s * .02, ey + s * .02], [x - s * .06, ey + s * .2]], 2, 1), mix(skin, lc, .3),
    { group: g + 'lit', dir: 90, maxR: s * .05, detail: .9, ...HAND({ type: 2 }) });
  // the mouth
  const my = y + s * (o.mouth ?? .4), open = o.open ?? 0;
  r.fill(HP([[x - s * .18, my], [x, my + s * .04], [x + s * .18, my]], 2, 1), o.mouthCol ?? '#3a1d1c',
    { group: g, dir: 0, maxR: s * .12, detail: .9, ...HAND({ type: 2 }) });
  if (open > .3) {
    r.fill(HP([[x - s * .12, my + s * .02], [x, my + s * .12 * open], [x + s * .12, my + s * .02]], 2, 1), '#1a0e0c',
      { group: g, dir: 0, maxR: s * .1, detail: .8, ...HAND({ type: 2 }) });
  }
  // the ear
  r.fill(HE(x - s * .6, ey + s * .06, s * .07, s * .1, 0, 2), mix(skin, '#000000', .18),
    { group: g, dir: 0, maxR: s * .07, detail: 1, ...HAND({ type: 2 }) });
}

// The bald man's head: a skull that catches the light, a brow, a grin.
export function baldHead(r, x, y, s, col, o = {}) {
  const g = o.group ?? 'head';
  const lc = o.lc ?? WARM;
  const lit = mix(col, lc, .46);
  const skin = col;
  // the skull: an egg, heavier at the back
  const skull = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const k = 1 + .08 * Math.cos(a + 1.1);
    skull.push([x + Math.cos(a) * s * .8 * k, y + Math.sin(a) * s * .84 * k]);
  }
  r.fill(P(skull), skin, { group: g, dir: 'edge', fallback: 90, maxR: s * .3, detail: .8, ...HAND() });
  // the lit plane of the scalp
  r.fill(HP([[x - s * .3, y - s * .72], [x + s * .18, y - s * .66], [x + s * .16, y - s * .1], [x - s * .34, y - s * .16]], 3, 2),
    lit, { group: g + 'lit', dir: 90, maxR: s * .16, detail: .7, ...HAND() });
  // the brow ridge and the eye sockets
  r.fill(HP([[x - s * .56, y - s * .3], [x - s * .12, y - s * .36]], 3, 2), mix(skin, '#000000', .45),
    { group: g, dir: 8, maxR: s * .1, detail: .9, ...HAND({ type: 2 }) });
  r.fill(HP([[x - s * .52, y - s * .1], [x - s * .26, y - s * .12]], 3, 2), mix(skin, '#000000', .45),
    { group: g, dir: -8, maxR: s * .1, detail: .9, ...HAND({ type: 2 }) });
  r.fill(HE(x - s * .38, y - s * .1, s * .09, s * .06, 0, 2), '#120c08',
    { group: g, dir: 0, maxR: s * .08, detail: .9, ...HAND({ type: 2 }) });
  // the ear
  r.fill(HE(x + s * .62, y + s * .04, s * .08, s * .13, 0, 2), mix(skin, '#000000', .22),
    { group: g, dir: 0, maxR: s * .08, detail: 1, ...HAND({ type: 2 }) });
  // the nose
  r.fill(HP([[x - s * .18, y - s * .06], [x - s * .26, y + s * .3], [x - s * .42, y + s * .26]], 2, 1),
    mix(skin, '#000000', .38), { group: g, dir: 90, maxR: s * .09, detail: .9, ...HAND({ type: 2 }) });
  // the grin
  r.fill(HP([[x - s * .54, y + s * .3], [x - s * .2, y + s * .24], [x - s * .1, y + s * .44], [x - s * .46, y + s * .48]], 3, 2),
    '#170f0a', { group: g, dir: -6, maxR: s * .12, detail: .9, ...HAND({ type: 2 }) });
  r.fill(HP([[x - s * .48, y + s * .33], [x - s * .16, y + s * .29], [x - s * .14, y + s * .38], [x - s * .44, y + s * .42]], 2, 1),
    '#d8cbb0', { group: g, dir: -6, maxR: s * .08, detail: .9, ...HAND({ type: 2 }) });
  if (o.shine) {
    r.fill(HP([[x - s * .5, y - s * .64], [x - s * .16, y - s * .74]], 4, 3), o.shine,
      { group: 'shine', dir: 0, maxR: s * .14, detail: .8, ...HAND() });
  }
}
