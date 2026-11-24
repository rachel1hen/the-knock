// Render one slice of the film, so N runners can paint it at the same time.
//   LIB=<lemo-opuscar> SLICE=0 SLICES=12 FPS=24 node tools/render_slice.mjs <project dir>
// Slice i covers frames [i*per, min(TOTAL, (i+1)*per)); the join step concatenates them.
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { pathToFileURL } from 'url';

const LIB = process.env.LIB || 'C:/Users/shahm/lemo-opuscar';
const SLICE = +(process.env.SLICE ?? 0);
const SLICES = +(process.env.SLICES ?? 12);
const FPS = +(process.env.FPS ?? 24);
const W = +(process.env.W ?? 1920), H = +(process.env.H ?? 1080);
const dir = path.resolve(process.argv[2] || '.');
const outDir = path.join(dir, 'out');
fs.mkdirSync(outDir, { recursive: true });

const { openDemo, closeServer, glLost } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);

const { browser, page } = await openDemo(dir, { w: W, h: H });
const DUR = await page.evaluate(() => window.DUR);
const TOTAL = Math.round(DUR * FPS);
const per = Math.ceil(TOTAL / SLICES);
const a = SLICE * per, b = Math.min(TOTAL, a + per);
if (a >= b) { console.error(`empty slice ${SLICE}`); await browser.close(); closeServer(); process.exit(1); }

const seg = path.join(outDir, `seg_${SLICE}.mp4`);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS),
  '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', seg],
  { stdio: ['pipe', 'inherit', 'inherit'] });
let dead = null;
ff.on('error', e => { dead = e.message; });
ff.stdin.on('error', () => {});

for (let f = a; f < b; f++) {
  await page.evaluate(t => window.render(t), f / FPS);
  if (dead) break;
  const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if ((f - a) % 60 === 0) console.log(`slice ${SLICE} ${f - a}/${b - a}`);
  if ((f - a) % 60 === 59 || f === b - 1) {
    const lost = await glLost(page);
    if (lost) { console.error(`WebGL context lost at frame ${f}: ${lost}`); dead = 'webgl lost'; break; }
  }
}
ff.stdin.end();
const code = await new Promise(r => ff.on('close', r));
await browser.close();
closeServer();
if (dead) { console.error(dead); process.exit(1); }
if (code !== 0) { console.error(`ffmpeg exited ${code}`); process.exit(1); }
console.log(`slice ${SLICE} done: frames ${a}..${b - 1} of ${TOTAL} -> ${seg}`);
