// export the music grid, the foley times and the cut list for the Python
// score and mix
import fs from 'fs';
const m = await import('../chapters/current.js');
const out = new URL('../out/', import.meta.url);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(new URL('timeline.json', out), JSON.stringify({
  T: m.T, G: m.G, BEAT: m.BEAT, BAR: m.BAR, NA: m.NA, NB: m.NB, CH_B: m.CH_B, CH_AT: m.CH_AT, CHORDS: m.CHORDS,
  DUR: m.DUR, FX: m.FX, TB: Array.from({ length: 17 }, (_, i) => m.TB(i)),
}, null, 1));
// the cut list on its own, so the mix can lay the voice under the right beat
fs.writeFileSync(new URL('beats.json', out), JSON.stringify(m.BEATS_JSON, null, 1));
console.log('ok', m.BEATS.length, 'beats', m.DUR.toFixed(1), 's');
