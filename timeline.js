// "The Knock" — one chapter of the story, one video. The music grid is the single
// source of truth for picture and sound: 4/4 at 66 BPM.
export const G = { t0: 0.5, bpm: 66, beats: 4 };
export const BEAT = 60 / G.bpm;          // 0.909091 s
export const BAR = BEAT * G.beats;       // 3.636364 s
export const at = (bar, b = 1) => G.t0 + (bar - 1) * BAR + (b - 1) * BEAT;
export const TB = at;

export const T = {
  title:   0,        // the title card
  room:    TB(2),    // 4.136   the question
  knock:   TB(4),    // 11.409  the door is rapped hard
  kn1:     TB(4, 2), // 12.318  first knock
  kn2:     TB(4, 3), // 13.227  second knock
  door:    TB(6),    // 18.682  the door opens, the collectors come in
  bag:     TB(8),    // 25.955  the cloth bag of worn notes and coins
  kick:    TB(10),   // 33.227  the kick; "Mum!"
  kickAt:  TB(10, 2),// 34.136
  stare:   TB(12),   // 40.500  he comes out; the cold stare
  sneer:   TB(14),   // 47.773  "today is the wedding day…"
  what:    TB(16),   // 54.045  "What did you say?"
  endcard: 58.2,     // the end card
  end:     62.0,
};
export const DUR = T.end;

// ---- melody: sparse, tense. Part A holds A; part B answers and climbs to the sneer.
export const MEL_A = [
  [1, 1, 2, 'A3'], [2, 3, 1, 'E4'],
  [3, 1, 2, 'A3'], [4, 3, 1, 'C4'],
  [5, 1, 3, 'E4'], [6, 3, 1, 'D4'],
];
export const MEL_B = [
  [7, 1, 2, 'A3'],  [8, 3, 1, 'F4'],
  [9, 1, 2, 'E4'],  [10, 3, 1, 'D4'],
  [11, 1, 2, 'C4'], [12, 3, 1, 'D4'],
  [13, 1, 2, 'E4'], [14, 1, 3, 'F#4'],   // the Picardy lift at the sneer
  [15, 1, 2, 'E4'], [16, 1, 2, 'A3'],    // home, cut off by "What did you say?"
];
export const CH_B = { 1: 'Am', 2: 'Am', 3: 'Am', 4: 'F', 5: 'Dm', 6: 'Am', 7: 'Am', 8: 'F', 9: 'F', 10: 'Dm', 11: 'Am', 12: 'Am', 13: 'F', 14: 'F', 15: 'Dm', 16: 'Am' };
export const CH_AT = [{ t: TB(4), c: 'F' }, { t: TB(5), c: 'Dm' }, { t: TB(8), c: 'F' }, { t: TB(10), c: 'Dm' }, { t: TB(13), c: 'F' }, { t: TB(15), c: 'Dm' }];
export const CHORDS = { Am: [['A3', 'C4', 'E4'], 'A2'], F: [['F3', 'A3', 'C4'], 'F2'], Dm: [['D3', 'F3', 'A3'], 'D2'] };

export const noteTimes = (mel) => mel.map(([b, bt, n, p]) => ({ t: at(b, bt), d: n * BEAT, pitch: p, bar: b, beat: bt }));
export const NA = noteTimes(MEL_A), NB = noteTimes(MEL_B);

// foley times for the mix
export const FX = { knocks: [T.kn1, T.kn2], creak: T.door, coins: T.bag + .8, kick: T.kickAt, gasp: T.kick + .4, sting: T.what };
