// Does a chapter hang together?
//
//   node tools/check_chapter.mjs [chapter]
//
// The gate in front of a render: it costs seconds and refuses a chapter that
// would waste twenty runners. It checks the things that break silently — a
// line with no shot, a shot naming a plate nobody drew, a moment the score
// looks up that is not there, a line past the end of the chapter — and prints
// what is wrong rather than letting the film fail an hour later.
//
// The chapter's own files are self-contained (chapters/N/ holds its acts, its
// clock, its plates, its voices and its lines), so checking one chapter never
// touches another.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');

const chapter = String(process.argv[2] || process.env.CHAPTER || '2');
const problems = [];
const notes = [];

const fail = m => problems.push(m);

// ---- the chapter's text ---------------------------------------------------
const srcPath = path.join(ROOT, 'source', `chapter_${chapter}.txt`);
if (!fs.existsSync(srcPath)) {
  fail(`source/chapter_${chapter}.txt is missing`);
  report();
}
const srcLines = fs.readFileSync(srcPath, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
const N = srcLines.length;
if (!N) fail('the chapter has no lines');

// ---- the files the chapter is made of --------------------------------------
const dir = path.join(ROOT, 'chapters', chapter);
const need = ['card.js', 'acts.js', 'timeline.js', 'plates.js', 'lines.gen.js', 'voices.py'];
for (const f of need) {
  if (!fs.existsSync(path.join(dir, f))) fail(`chapters/${chapter}/${f} is missing`);
}
if (problems.length) report();

// ---- the lines the chapter was parsed into ---------------------------------
const { LINES } = await import(`../chapters/${chapter}/lines.gen.js`);
if (LINES.length !== N) fail(`the chapter has ${N} lines but lines.gen.js has ${LINES.length}`);

// ---- the acts: one shot per line ------------------------------------------
const { ACTS, LOOKS } = await import(`../chapters/${chapter}/acts.js`);
const seen = new Map();
for (const row of ACTS) {
  const [n, plate, look] = row;
  if (n === 0 || n === 999) continue;
  if (n < 1 || n > N) fail(`act for line ${n} is outside the chapter (1..${N})`);
  if (seen.has(n)) fail(`line ${n} has two acts (${seen.get(n)} and ${plate})`);
  seen.set(n, plate);
  if (!LOOKS.includes(look)) fail(`act ${n} uses the look "${look}", which is not in LOOKS`);
}
for (let n = 1; n <= N; n++) if (!seen.has(n)) fail(`line ${n} has no act, so it would not be filmed`);

// ---- the plates ------------------------------------------------------------
const { PLATE_KEYS } = await import(`../chapters/${chapter}/plates.js`);
const plates = new Set(PLATE_KEYS);
for (const [n, plate] of seen) if (!plates.has(plate)) fail(`line ${n} names the plate "${plate}", which is not drawn`);

// ---- the moments the sound hangs on ---------------------------------------
// The score and the mix look these up by name; a missing one is a KeyError
// two hours into a render. The list is the contract between the JS clock and
// the Python sound, so it lives here, in one place.
const NEED_T = [
  'room', 'knock', 'knockHit', 'door', 'money', 'kick',
  'sneer', 'what', 'order', 'fight', 'kneel', 'leave', 'end', 'endcard',
];
const NEED_FX = [
  'knock', 'creak', 'coins', 'kick', 'gasp', 'sting',
  'punch', 'boom', 'gasp2', 'roar', 'flash', 'knees', 'steps',
];

const { T, FX, DUR, BEATS } = await import(`../chapters/${chapter}/timeline.js`);
for (const k of NEED_T) {
  if (!(k in T)) fail(`the clock has no moment "${k}" (the score or the mix looks it up)`);
}
for (const k of NEED_FX) {
  if (!(k in FX)) fail(`the clock has no sound "${k}" (the mix looks it up)`);
}
if (T.knockHit !== undefined && T.knock !== undefined && !(T.knockHit >= T.knock)) {
  fail('the knock lands before it is heard');
}

// ---- the clock ------------------------------------------------------------
if (!(DUR > 0)) fail('the film has no length');
const beats = BEATS.filter(b => b.n !== 0 && b.n !== 999);
if (beats.length !== N) fail(`the clock has ${beats.length} shots for ${N} lines`);

// ---- the people who speak -------------------------------------------------
// Every spoken line must belong to a character: a line of dialogue read by
// nobody is a bug in the chapter, not in the film.
const vp = path.join(dir, 'voices.py');
if (fs.existsSync(vp)) {
  const py = fs.readFileSync(vp, 'utf8');
  const sets = {};
  for (const m of py.matchAll(/^(\w+_LINES)\s*=\s*\{([^}]*)\}/gm)) {
    sets[m[1]] = [...m[2].matchAll(/\d+/g)].map(x => +x[0]);
  }
  const assigned = new Set(Object.values(sets).flat());
  for (const n of assigned) if (n < 1 || n > N) fail(`voices.py assigns a voice to line ${n}, outside the chapter`);
  for (const l of LINES) {
    if (l.spoken && !assigned.has(l.n)) fail(`line ${l.n} is spoken but no character is given it`);
  }
} else {
  fail('chapters/' + chapter + '/voices.py is missing');
}

// ---- the wall clock -------------------------------------------------------
// One minute of film took about twelve minutes on a CI runner. A chapter
// three times chapter two would push the slowest slice past GitHub's six
// hour job limit, so refuse it here rather than half way through a render.
const MINUTES_PER_FILM_MINUTE = 12;
const hours = (DUR / 60) * MINUTES_PER_FILM_MINUTE / 60;
if (hours > 5) fail(`the film would take about ${hours.toFixed(1)} h to render (the limit is 5 h); shorten the chapter or use more slices`);
notes.push(`${N} lines, ${LINES.filter(l => l.spoken).length} spoken, ${Math.round(DUR)} s, about ${hours.toFixed(1)} h to render`);

report();

function report() {
  for (const n of notes) console.log('  ' + n);
  if (problems.length) {
    console.error(`\nchapter ${chapter} is not ready:`);
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
  console.log(`chapter ${chapter} is ready`);
}
