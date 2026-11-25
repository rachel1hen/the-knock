You are writing chapter @CHAPTER@ of The Knock: the film code for a chapter
whose text is already in the repo, at `source/chapter_@CHAPTER@.txt`. A
person will read your chapter before anything is filmed.

Read `AGENTS.md` first. It is the contract: the six files you write, what you
must not touch, the names the sound needs, and the check that must pass.
Claude Code loads it too, but read it and follow it deliberately.

Read `chapters/2/` next. Chapter two is the finished film and your reference:
`acts.js` (how a beat is framed), `timeline.js` (the clock and the sound),
`plates.js` (how a place is drawn and lit), `voices.py` (who speaks),
`card.js` (the title card). Yours must feel like the same film.

Work in this order:

1. Read `source/chapter_@CHAPTER@.txt`, `AGENTS.md`, and chapter two's files.
2. Write the six files under `chapters/@CHAPTER@/`. Never write
   `lines.gen.js` by hand - it is generated.
3. Run `node tools/dump_lines.mjs @CHAPTER@`, then
   `node tools/check_chapter.mjs @CHAPTER@`. Fix what it reports until it
   passes.

The three rules that matter most, repeated from AGENTS.md:

- People are drawn, not blocked out. Use `scenes/figures.js` - `person`,
  `seated`, `neighbour`, `womanFace`, `baldHead` - with shoulders, arms that
  bend to a hand, a head with a jaw, a lit side. Never a black silhouette,
  never a circle standing in for a human.
- Light every plate from one side and keep the silhouette readable. A plate
  is a drawing of a place, not an arrangement of primitives.
- Touch nothing outside `source/chapter_@CHAPTER@.txt` and
  `chapters/@CHAPTER@/`. If a shared file (`engine/`, `scenes/`, `tools/`,
  the workflows) seems to need a change, write the need in your summary
  instead of changing it.

Finish with a short summary: what the chapter is about in a few sentences
(its cast, its rooms, where the sound hangs), the last line of the check, and
anything you left for a person to decide.
