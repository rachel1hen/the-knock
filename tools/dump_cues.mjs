// export the lines the film paints into the picture as subtitle cues,
// so the .srt carries exactly the words that are on screen, timed to the cuts
import fs from 'fs';
const { T } = await import('../timeline.js');
const { LINES, LINE_IN } = await import('../scenes/lines.js');

// the shots that carry a line, in order: [cut in, cut out]
const CUTS = [
  [T.room, T.knock], [T.knock, T.door], [T.door, T.bag], [T.bag, T.kick],
  [T.kick, T.stare], [T.stare, T.sneer], [T.sneer, T.what], [T.what, T.endcard],
];

const cues = LINES
  .map((text, i) => (text && i >= 1 && i <= 8)
    ? { t0: +(CUTS[i - 1][0] + LINE_IN).toFixed(3), t1: +CUTS[i - 1][1].toFixed(3), text }
    : null)
  .filter(Boolean);

const out = new URL('../out/', import.meta.url);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(new URL('cues.json', out), JSON.stringify(cues, null, 1));
console.log('ok', cues.length, 'cues');
