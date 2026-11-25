// "The Knock" — chapter two, beat by beat.
//
// The chapter is 71 lines. Every line gets its own shot: the spoken ones are
// painted into the picture in the film's own type, the narrated ones are
// pictures that carry the meaning. Nothing in the chapter is skipped.
//
// The clock is the chapter's length, not a fixed runtime: a line is given the
// time it needs to be read and looked at, so the film ends where the chapter
// ends. Reading time is the floor; a long narration line gets more room.
//
// The music grid is 4/4 at 66 BPM, and the score's sections line up with the
// chapter's own turns (the knock, the money, the kick, the sneer, the demand,
// the fight, the apology).

import { LINES } from './lines.gen.js';
import { ACTS } from './acts.js';

export const G = { t0: 0.5, bpm: 66, beats: 4 };
export const BEAT = 60 / G.bpm;          // 0.909091 s
export const BAR = BEAT * G.beats;       // 3.636364 s
export const at = (bar, b = 1) => G.t0 + (bar - 1) * BAR + (b - 1) * BEAT;
export const TB = at;

// ---- how long a line stays on screen -------------------------------------
// A spoken line has to be read (about 2.9 words a second, the speed of a
// subtitle); a narrated line is listened to as it is shown (about 2.6 words a
// second - the voice is slower than the eye here). Either way there is a beat
// of silence around it, and a long line is never cut short: the cap is only
// there to stop one runaway line, so it sits above the longest line in the
// chapter rather than through the middle of it.
const READ = 2.9, LISTEN = 2.6, PAD = 1.3, FLOOR = 2.6, CAP = 16.0;

const hold = l => {
  if (!l) return 0;
  const need = Math.max(l.spoken ? l.dw / READ : 0, l.narration ? l.nw / LISTEN : 0);
  return Math.min(CAP, Math.max(FLOOR, need + PAD));
};

// ---- the cut list --------------------------------------------------------
// Every line of the chapter is one beat. The title card leads, the end card
// follows. A shot's length is the line's own length, so the film is as long as
// the chapter takes to say.
export const BEATS = (() => {
  const beats = [];
  let t = 0;
  beats.push({ n: 0, line: 0, t0: t, dur: 3.2, plate: 'title', look: 'dark', cam: [960, 540], zoom: [1.00, 1.05] });
  t += 3.2;

  // the acts table assigns a plate and a camera to each line
  const byLine = new Map();
  for (const [n, plate, look, cx, cy, z0, z1] of ACTS) {
    if (n === 0 || n === 999) continue;
    byLine.set(n, { plate, look, cam: [cx, cy], zoom: [z0, z1] });
  }

  for (const l of LINES) {
    const a = byLine.get(l.n);
    if (!a) throw new Error('no act for chapter line ' + l.n);
    const dur = hold(l);
    beats.push({ n: l.n, line: l.n, t0: t, dur, plate: a.plate, look: a.look, cam: a.cam, zoom: a.zoom, spoken: l.spoken, narration: l.narration, dw: l.dw, nw: l.nw });
    t += dur;
  }

  const endT = t;
  beats.push({ n: 999, line: 999, t0: t, dur: 4.0, plate: 'endcard', look: 'dark', cam: [960, 540], zoom: [1.00, 1.04] });
  return beats;
})();

export const END = BEATS[BEATS.length - 1].t0 + BEATS[BEATS.length - 1].dur;
export const DUR = END;

// ---- named moments the sound and the score hang on -----------------------
const atLine = (n, off = 0) => BEATS.find(b => b.n === n).t0 + off;

export const T = {
  title: 0,
  room: atLine(1),
  memory: atLine(2),
  knock: atLine(4),
  knockHit: atLine(4, 1.2),
  door: atLine(10),
  money: atLine(13),
  bag: atLine(20),
  kick: atLine(26),
  kickHit: atLine(26, 2.2),
  mum: atLine(27),
  stare: atLine(28),
  sneer: atLine(34),
  invitation: atLine(35),
  what: atLine(39),
  order: atLine(46),
  fight: atLine(50),
  punch: atLine(50),
  boom: atLine(52),
  counter: atLine(53),
  down: atLine(54),
  roar: atLine(58),
  rush: atLine(60),
  light: atLine(61),
  kneel: atLine(66),
  sorry: atLine(67),
  gone: atLine(69),
  leave: atLine(71),
  endcard: BEATS[BEATS.length - 1].t0,
  end: END,
};

// the bar grid the score walks on: one bar per beat, so the music changes
// exactly where the picture does
export const BARS = BEATS.length;
export const BART = BEATS.map(b => b.t0);

// the melody's two halves, stretched over the chapter's own shape
export const MEL_A = [
  [1, 1, 2, 'A3'], [2, 3, 1, 'E4'],
  [3, 1, 2, 'A3'], [4, 3, 1, 'C4'],
  [5, 1, 3, 'E4'], [6, 3, 1, 'D4'],
];
export const MEL_B = [
  [7, 1, 2, 'A3'], [8, 3, 1, 'F4'],
  [9, 1, 2, 'E4'], [10, 3, 1, 'D4'],
  [11, 1, 3, 'D4'], [12, 3, 1, 'E4'],
  [13, 1, 2, 'E4'], [14, 3, 1, 'F#4'],
  [15, 1, 3, 'E4'], [16, 3, 1, 'A3'],
];
export const CH_B = { 1: 'Am', 2: 'Am', 3: 'Am', 4: 'F', 5: 'Dm', 6: 'Am', 7: 'Am', 8: 'F', 9: 'F', 10: 'Dm', 11: 'Am', 12: 'Am', 13: 'F', 14: 'F', 15: 'Dm', 16: 'Am' };
export const CH_AT = [{ t: TB(4), c: 'F' }, { t: TB(5), c: 'Dm' }, { t: TB(8), c: 'F' }, { t: TB(10), c: 'Dm' }, { t: TB(13), c: 'F' }, { t: TB(15), c: 'Dm' }];
export const CHORDS = { Am: [['A3', 'C4', 'E4'], 'A2'], F: [['F3', 'A3', 'C4'], 'F2'], Dm: [['D3', 'F3', 'A3'], 'D2'] };

export const noteTimes = (mel) => mel.map(([b, bt, n, p]) => ({ t: at(b, bt), d: n * BEAT, pitch: p, bar: b, beat: bt }));
export const NA = noteTimes(MEL_A), NB = noteTimes(MEL_B);

// the cut list, for the Python side (the mix places sound on the same beats
// the picture does)
export const BEATS_JSON = BEATS.map(b => ({
  n: b.n, t0: +b.t0.toFixed(3), dur: +b.dur.toFixed(3), plate: b.plate, look: b.look,
  spoken: b.spoken || '', dw: b.dw || 0, nw: b.nw || 0,
}));

// the foley the mix places
export const FX = {
  knock: [T.knockHit, T.knockHit + 2.4],
  creak: T.door,
  coins: T.bag + .7,
  kick: T.kickHit,
  gasp: T.kick + .4,
  sting: T.what,
  shove: T.order,
  punch: T.punch + 1.1,
  boom: T.boom,
  gasp2: T.down,
  roar: T.roar + .8,
  flash: T.light + .9,
  knees: T.kneel + 1.6,
  steps: T.leave + .6,
};
