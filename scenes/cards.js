// Title / line cards: a dark plate plus a type plate laid in with the knife.
// The type sits on its own transparent plate with solid:true, so the knife only
// marks inside the opaque glyphs and never smears the scene behind the letters.
import { Ref, paintRef } from '../engine/plate.js';
import { P, E, lin, rad } from './common.js';

const LADDER = [40, 20, 7, 3.5, 2];
const APP = (x, y) => x / 1920 * .75;

export function buildCard(title, sub, o = {}) {
  const bg = new Ref(1920, 1080, 1);
  bg.fill(P([[0, 0], [1920, 0], [1920, 1080], [0, 1080]]),
    rad(960, o.glowY ?? 460, 40, 1250, [[0, o.glow ?? '#241d16'], [.55, '#15110d'], [1, '#070605']]),
    { dir: -8, fallback: -8, group: 'bg', maxR: 44, detail: 2.0 });
  const bgStrokes = paintRef(bg, { R: LADDER, T: 10, seed: o.seed ?? 23, app: APP });

  const ty = new Ref(1920, 1080, 1);
  const yT = o.titleY ?? 500;
  ty.text(title, 960, yT, `italic 600 ${o.size ?? 108}px "Cormorant Garamond"`,
    lin(0, yT - 130, 0, yT + 30, [[0, '#f8ecd0'], [1, '#d9b877']]),
    { dir: 'edge', fallback: 14, maxR: 8, group: 't' });
  if (sub) ty.text(sub, 960, yT + 84, `500 ${o.subSize ?? 40}px "Cormorant SC"`,
    lin(0, yT + 50, 0, yT + 95, [[0, '#e2d6bd'], [1, '#a8905e']]),
    { dir: 'edge', fallback: 14, maxR: 6, group: 't' });
  const typeStrokes = paintRef(ty, { R: LADDER, T: 8, seed: o.seed ?? 23, app: APP, solid: true });

  return { bg: { strokes: bgStrokes, ref: bg }, type: { strokes: typeStrokes, ref: ty } };
}

// A line from the chapter, laid over a scene plate (transparent bg, just the type).
// A long line is broken into two lines of type, the way a subtitle is, and the
// size comes down a step so it still fits the frame.
export function buildLine(text, o = {}) {
  const ty = new Ref(1920, 1080, 1);
  const size = o.size ?? 58;
  const lines = wrap(text, size, o.maxW ?? 1560);
  const lh = size * 1.34;
  const y0 = o.y ?? 880;
  // the block is centred on y0
  const first = y0 - (lines.length - 1) * lh * .5;
  for (let i = 0; i < lines.length; i++) {
    const y = first + i * lh;
    ty.text(lines[i], 960, y, `italic 600 ${size}px "Cormorant Garamond"`,
      lin(0, y - size, 0, y + size * .3, [[0, '#f8ecd0'], [1, '#d9b877']]),
      { dir: 'edge', fallback: 14, maxR: 6, group: 't', alpha: .96 });
  }
  const typeStrokes = paintRef(ty, { R: LADDER, T: 8, seed: o.seed ?? 31, app: APP, solid: true });
  return { strokes: typeStrokes, ref: ty };
}

// break a line of type into lines that fit, without ever splitting a word
function wrap(text, size, maxW) {
  const words = text.split(/\s+/).filter(Boolean);
  const approx = w => w.length * size * .46;      // Cormorant italic runs narrow
  if (!words.length) return [''];
  let lines = [], cur = words[0];
  for (let i = 1; i < words.length; i++) {
    if (approx(cur + ' ' + words[i]) <= maxW) cur += ' ' + words[i];
    else { lines.push(cur); cur = words[i]; }
  }
  lines.push(cur);
  // more than two lines of type is too much to read on a wall: shrink instead
  if (lines.length > 2) {
    const s = Math.floor(size * Math.sqrt(2 / lines.length));
    return wrap(text, s, maxW * Math.sqrt(2 / lines.length));
  }
  return lines;
}
