// Export the lines the film paints into the picture as subtitle cues, so the
// .srt carries exactly the words that are on screen, timed to the cuts.
//   node tools/dump_cues.mjs
import fs from 'fs';
const { BEATS } = await import('../timeline.js');

const cues = [];
for (const b of BEATS) {
  if (!b.spoken) continue;
  cues.push({
    t0: +(b.t0 + .9).toFixed(3),
    t1: +Math.min(b.t0 + b.dur - .2, b.t0 + .9 + Math.max(1.2, b.dw * .42)).toFixed(3),
    text: '“' + b.spoken + '”',
  });
}

fs.mkdirSync(new URL('../out/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../out/cues.json', import.meta.url), JSON.stringify(cues, null, 1));
console.log('ok', cues.length, 'cues');
