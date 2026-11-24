// "The Knock" — chapter two of the story, one video, painted every frame.
//
// The cut list is the chapter: every line of source/chapter_2.txt is a shot,
// with the spoken words painted into the picture in the film's own type and the
// narrated lines carried by the picture. Nothing is skipped, and the film's
// length is the length of the chapter.
//
// The score is one held chord that moves with the story; the light changes with
// each of the film's four rooms (cold, warm, blood, dark).

import { Impasto } from './engine/impasto.js';
import { T, BEATS, END, DUR } from './timeline.js';
import { buildShots } from './scenes/story.js';
import { buildCard, buildLine } from './scenes/cards.js';
import { LINES } from './scenes/lines.gen.js';
import { clamp, lerp, ss, seg, eo, hash } from './scenes/common.js';

const NEVER = 1e6;
let E, P, B, credits;

export async function setup(canvas) {
  await document.fonts.load('italic 600 108px "Cormorant Garamond"');
  await document.fonts.load('500 40px "Cormorant SC"');
  await document.fonts.load('italic 600 58px "Cormorant Garamond"');
  E = new Impasto(canvas);

  // the plates, built once each
  const built = new Map(buildShots());
  const up = (b, w, h) => ({ b: E.batch(b.strokes.data()), tex: E.texture(b.ref.ctx.canvas), w, h });

  P = {};
  B = {};

  // the title and the end card
  const head = buildCard('THE KNOCK', 'chapter two of the story', { seed: 5, titleY: 520 });
  P.head = { bg: up(head.bg, 1920, 1080), type: up(head.type, 1920, 1080) };
  const tail = buildCard('THE KNOCK', 'an impasto palette-knife study', { seed: 7, titleY: 520, glow: '#2a1d12' });
  P.tail = { bg: up(tail.bg, 1920, 1080), type: up(tail.type, 1920, 1080) };

  // every line of the chapter gets its plate, and its type if it is spoken
  for (const beat of BEATS) {
    if (beat.n === 0 || beat.n === 999) continue;
    const plate = built.get(beat.plate);
    if (!plate) throw new Error('no plate: ' + beat.plate);
    if (!P[beat.n]) P[beat.n] = { bg: up(plate.bg, 1920, 1080) };
    if (beat.spoken) {
      // the type sits low, out of the way of what the picture is saying
      const line = buildLine('“' + beat.spoken + '”', { seed: 31 + beat.n, y: 880, size: beat.dw > 11 ? 50 : 58 });
      P[beat.n].line = up(line, 1920, 1080);
    }
  }

  credits = document.createElement('div');
  credits.style.cssText = 'position:fixed;left:0;right:0;top:930px;text-align:center;font-family:"Cormorant SC",serif;color:#cbbb9c;letter-spacing:.08em;opacity:0;line-height:1.5;text-shadow:0 2px 6px rgba(0,0,0,.7)';
  credits.innerHTML = '<div style="font-size:26px;font-style:italic;font-family:\'Cormorant Garamond\',serif;letter-spacing:.03em">painted and scored in code</div>' +
    '<div style="font-size:19px;margin-top:14px;color:#8d8271">type: Cormorant (OFL) · text adapted from chapter two</div>';
  document.body.appendChild(credits);

  window.DUR = END;
  return frame;
}

// a plate and its thin underpainting
function plate(pl, o) {
  const ua = o.appear === undefined ? 1 : seg(o.t, o.appear + .35, o.appear + (o.appDur ?? .8));
  if (!o.noUnder && ua > 0) E.under(pl.tex, pl.w, pl.h, { ...o, alpha: (o.alpha ?? 1) * ua, revC: o.revC });
  E.draw(pl.b, { ...o, appear: o.appear ?? -NEVER, appDur: .14 });
}

// the room the shot is in, and the light in it
const POST = {
  cold:  { ground: [.012, .014, .018], expo: 1.0,  sat: .92,  contrast: 1.06, vig: .38, spec: .30, shin: 26, lightCol: [.86, .92, 1.05] },
  warm:  { ground: [.020, .014, .008], expo: 1.02, sat: 1.06, contrast: 1.05, vig: .34, spec: .36, shin: 24, lightCol: [1, .90, .74] },
  blood: { ground: [.030, .012, .012], expo: 1.0,  sat: 1.14, contrast: 1.08, vig: .42, spec: .34, shin: 24, lightCol: [1, .82, .72] },
  dark:  { ground: [.010, .010, .012], expo: .95,  sat: 1.0,  contrast: 1.10, vig: .50, spec: .30, shin: 24, lightCol: [1, .86, .66] },
  // the white light of the moment they go down
  flash: { ground: [.10, .12, .15], expo: 1.12, sat: .68,  contrast: 1.02, vig: .34, spec: .42, shin: 30, lightCol: [.94, .97, 1.05] },
};

// the shaker: the door answers a knock
const shake = t => {
  let s = 0;
  for (const k of [T.knockHit, T.knockHit + 2.1]) { const d = t - k; if (d > 0 && d < 1.1) s += 15 * Math.exp(-d * 4.6) * Math.sin(d * 72); }
  return s;
};

function frame(t) {
  // which beat are we in?
  let i = 0;
  while (i < BEATS.length - 1 && t >= BEATS[i + 1].t0) i++;
  const beat = BEATS[i];
  const k = ss(clamp((t - beat.t0) / beat.dur));
  const zoom = lerp(beat.zoom[0], beat.zoom[1], k);

  E.begin();

  if (beat.n === 0) {
    // the title card
    plate(P.head.bg, { t, cam: { x: 960, y: 540, zoom, rot: 0 }, grey: 0, reveal: NEVER, appear: 0, appDur: .8, run: .35 });
    plate(P.head.type, { t, cam: { x: 960, y: 540, zoom, rot: 0 }, grey: 0, reveal: NEVER, appear: .35, appDur: 1.1, run: 0 });
  } else if (beat.n === 999) {
    plate(P.tail.bg, { t, cam: { x: 960, y: 540, zoom, rot: 0 }, grey: 0, reveal: NEVER, appear: beat.t0, appDur: .8, run: .35 });
    plate(P.tail.type, { t, cam: { x: 960, y: 540, zoom, rot: 0 }, grey: 0, reveal: NEVER, appear: beat.t0 + .35, appDur: 1.1, run: 0 });
  } else {
    const p = P[beat.n];
    const cam = { x: beat.cam[0] + (beat.plate === 'knockdoor' ? shake(t) : 0), y: beat.cam[1], zoom, rot: 0 };
    plate(p.bg, { t, cam, grey: 0, reveal: NEVER, appear: beat.t0, appDur: .8, run: .35 });
    if (p.line) {
      // the type is laid in a beat after the picture settles, and stays
      plate(p.line, { t, cam, grey: 0, reveal: NEVER, appear: beat.t0 + .9, appDur: 1.3, run: 0 });
    }
  }

  E.finish({ ...POST[beat.look] });
  credits.style.opacity = String(ss(seg(t, T.endcard, T.endcard + .6)) * (1 - ss(seg(t, T.end - .5, T.end - .1))));
}
