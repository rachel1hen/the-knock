// "The Knock" — chapter two of the story, one video, painted every frame.
// The cut list is the chapter's beats: the question, the knock, the door, the bag,
// the kick, the stare, the sneer, and the line that stops the room.
import { Impasto } from './engine/impasto.js';
import { T } from './timeline.js';
import { buildShots } from './scenes/story.js';
import { buildCard, buildLine } from './scenes/cards.js';
import { LINES, LINE_IN } from './scenes/lines.js';
import { clamp, lerp, ss, seg, eo, hash } from './scenes/common.js';

const NEVER = 1e6;
let E, P, credits;

// shot -> camera and look
const SHOTS = [
  { t0: T.title,   dur: T.room - T.title,   cam: [960, 540], zoom: [1.00, 1.05], look: 'dark' },
  { t0: T.room,    dur: T.knock - T.room,   cam: [975, 560], zoom: [1.00, 1.05], look: 'cold' },
  { t0: T.knock,   dur: T.door - T.knock,   cam: [960, 520], zoom: [1.05, 1.11], look: 'cold' },
  { t0: T.door,    dur: T.bag - T.door,     cam: [960, 560], zoom: [1.00, 1.06], look: 'warm' },
  { t0: T.bag,     dur: T.kick - T.bag,     cam: [930, 780], zoom: [1.10, 1.16], look: 'warm' },
  { t0: T.kick,    dur: T.stare - T.kick,   cam: [840, 840], zoom: [1.00, 1.08], look: 'blood' },
  { t0: T.stare,   dur: T.sneer - T.stare,  cam: [960, 600], zoom: [1.00, 1.12], look: 'cold' },
  { t0: T.sneer,   dur: T.what - T.sneer,   cam: [1240, 480], zoom: [1.00, 1.10], look: 'warm' },
  { t0: T.what,    dur: T.endcard - T.what, cam: [960, 600], zoom: [1.12, 1.20], look: 'dark' },
  { t0: T.endcard, dur: T.end - T.endcard,   cam: [960, 540], zoom: [1.00, 1.04], look: 'dark' },
];

export async function setup(canvas) {
  await document.fonts.load('italic 600 108px "Cormorant Garamond"');
  await document.fonts.load('500 40px "Cormorant SC"');
  E = new Impasto(canvas);

  const shots = buildShots();
  const head = buildCard('THE KNOCK', 'chapter two of the story', { seed: 5, titleY: 520 });
  const tail = buildCard('THE KNOCK', 'an impasto palette-knife study', { seed: 7, titleY: 520, glow: '#2a1d12' });

  P = {};
  SHOTS.forEach((s, i) => {
    const up = (b, w, h) => ({ b: E.batch(b.strokes.data()), tex: E.texture(b.ref.ctx.canvas), w, h });
    if (i === 0) {
      P[i] = { bg: up(head.bg, 1920, 1080), type: up(head.type, 1920, 1080) };
    } else if (i === 9) {
      P[i] = { bg: up(tail.bg, 1920, 1080), type: up(tail.type, 1920, 1080) };
    } else {
      P[i] = { bg: up(shots[i].bg, 1920, 1080) };
      if (LINES[i]) {
        const line = buildLine(LINES[i], { seed: 31 + i, y: i === 4 ? 250 : 880 });
        P[i].line = up(line, 1920, 1080);
      }
    }
  });

  credits = document.createElement('div');
  credits.style.cssText = 'position:fixed;left:0;right:0;top:930px;text-align:center;font-family:"Cormorant SC",serif;color:#cbbb9c;letter-spacing:.08em;opacity:0;line-height:1.5;text-shadow:0 2px 6px rgba(0,0,0,.7)';
  credits.innerHTML = '<div style="font-size:26px;font-style:italic;font-family:\'Cormorant Garamond\',serif;letter-spacing:.03em">painted and scored in code</div>' +
    '<div style="font-size:19px;margin-top:14px;color:#8d8271">type: Cormorant (OFL) · text adapted from chapter two</div>';
  document.body.appendChild(credits);

  window.DUR = T.end;
  return frame;
}

// a plate and its thin underpainting
function plate(pl, o) {
  const ua = o.appear === undefined ? 1 : seg(o.t, o.appear + .35, o.appear + (o.appDur ?? .8));
  if (!o.noUnder && ua > 0) E.under(pl.tex, pl.w, pl.h, { ...o, alpha: (o.alpha ?? 1) * ua, revC: o.revC });
  E.draw(pl.b, { ...o, appear: o.appear ?? -NEVER, appDur: .14 });
}

// the door answers a knock
const shake = t => {
  let s = 0;
  for (const k of [T.kn1, T.kn2]) { const d = t - k; if (d > 0 && d < 1.1) s += 15 * Math.exp(-d * 4.6) * Math.sin(d * 72); }
  return s;
};

function shot(i, t) {
  const s = SHOTS[i], k = ss(clamp((t - s.t0) / s.dur));
  let cam = { x: s.cam[0], y: s.cam[1], zoom: lerp(s.zoom[0], s.zoom[1], k) };
  if (i === 2) cam.x += shake(t);
  plate(P[i].bg, { t, cam, grey: 0, reveal: NEVER, appear: s.t0, appDur: .8, run: .35 });
  if (i === 0 || i === 9) {
    plate(P[i].type, { t, cam, grey: 0, reveal: NEVER, appear: s.t0 + .35, appDur: 1.1, run: 0 });
  } else if (P[i].line) {
    plate(P[i].line, { t, cam, grey: 0, reveal: NEVER, appear: s.t0 + LINE_IN, appDur: 1.3, run: 0 });
  }
  return s.look;
}

const POST = {
  cold:  { ground: [.012, .014, .018], expo: 1.0, sat: .92, contrast: 1.06, vig: .38, spec: .22, shin: 26, lightCol: [.86, .92, 1.05] },
  warm:  { ground: [.020, .014, .008], expo: 1.02, sat: 1.06, contrast: 1.05, vig: .34, spec: .28, shin: 24, lightCol: [1, .90, .74] },
  blood: { ground: [.030, .012, .012], expo: 1.0, sat: 1.14, contrast: 1.08, vig: .42, spec: .26, shin: 24, lightCol: [1, .82, .72] },
  dark:  { ground: [.010, .010, .012], expo: .95, sat: 1.0, contrast: 1.10, vig: .50, spec: .22, shin: 24, lightCol: [1, .86, .66] },
};

function frame(t) {
  let i = 0; while (i < SHOTS.length - 1 && t >= SHOTS[i + 1].t0) i++;
  E.begin();
  const look = shot(i, t);
  E.finish({ ...POST[look] });
  credits.style.opacity = String(ss(seg(t, T.endcard, T.endcard + .6)) * (1 - ss(seg(t, T.end - .5, T.end - .1))));
}
