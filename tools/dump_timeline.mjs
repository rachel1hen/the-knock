// export the music grid and the foley times for the Python score/mix
import fs from 'fs';
const m = await import('../timeline.js');
const out = new URL('../out/', import.meta.url);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(new URL('timeline.json', out), JSON.stringify({
  T: m.T, G: m.G, BEAT: m.BEAT, BAR: m.BAR, NA: m.NA, NB: m.NB, CH_B: m.CH_B, CH_AT: m.CH_AT, CHORDS: m.CHORDS,
  DUR: m.DUR, FX: m.FX, TB: Array.from({ length: 17 }, (_, i) => m.TB(i)),
}, null, 1));
console.log('ok');
