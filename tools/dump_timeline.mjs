// export the music grid and the foley times for the Python score/mix
import fs from 'fs';
const m = await import('../timeline.js');
fs.writeFileSync(new URL('../out/timeline.json', import.meta.url), JSON.stringify({
  T: m.T, G: m.G, BEAT: m.BEAT, BAR: m.BAR, NA: m.NA, NB: m.NB, CH_B: m.CH_B, CH_AT: m.CH_AT, CHORDS: m.CHORDS,
  DUR: m.DUR, FX: m.FX, TB: Array.from({ length: 17 }, (_, i) => m.TB(i)),
}, null, 1));
console.log('ok');
