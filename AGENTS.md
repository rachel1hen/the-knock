# The Knock — how a chapter is written

Every chapter of the story is one film: the chapter's lines are the shots, the
words are painted into the picture, and everything on screen is drawn in code.
This file is the contract for writing the code for a new chapter. Read it
before you touch anything.

## What you are writing

A chapter lives in `chapters/N/`, and it is self-contained. You write six
files and touch nothing else:

| file | what it is |
|---|---|
| `source/chapter_N.txt` | the chapter's text: one line per beat, the spoken words inside “curly quotes” |
| `chapters/N/card.js` | the words on the title card and in the credits |
| `chapters/N/acts.js` | the beats: which plate each line is shown on, and how it is framed |
| `chapters/N/timeline.js` | the clock: how long each line stays, and the moments the sound hangs on |
| `chapters/N/plates.js` | the drawings: every shot in the chapter |
| `chapters/N/voices.py` | who speaks which line |

`chapters/2/` is the reference. Read it before you write. Chapter two is the
film that exists; yours must feel like the same film.

## What you must not touch

- `engine/`, `scenes/`, `music/`, `mix.py`, `film.js`, `tools/` — these are
  shared by every chapter. If you think one of them needs to change, say so
  in your summary instead of changing it.
- `chapters/current.js` and `chapters/current.txt` — generated; they are
  switched to a chapter by `tools/select_chapter.mjs`.
- Other chapters' folders.
- `.github/workflows/` — the workflows are not yours to edit.

## The beats

`source/chapter_N.txt` has one line per beat. A line with “quoted words” is
spoken; the rest of the line is narration. `tools/dump_lines.mjs N` reads the
file and writes `chapters/N/lines.gen.js`; you never write that file by hand.

`chapters/N/acts.js` is a table. One row per line of the chapter, plus the
title card (line 0) and the end card (line 999):

```js
export const ACTS = [
  [0, 'title', 'dark', 960, 540, 1.00, 1.05],
  [1, 'room', 'cold', 980, 540, 1.00, 1.06],
  // line, plate, look, camera x, camera y, zoom in, zoom out
  [999, 'endcard', 'dark', 960, 540, 1.00, 1.04],
];
export const LOOKS = ['cold', 'warm', 'blood', 'dark', 'flash'];
```

Every line of the chapter gets exactly one row. A line with no row is a line
the film would skip.

## The clock

`chapters/N/timeline.js` copies chapter two's and changes two things: the
`T` map (when each moment happens, as a line number — the code converts it to
a time) and the `FX` map (the sounds the mix places).

`T` must have all of these names, because the score and the mix look them up
by name and a missing one stops the render an hour in:

    room  knock  knockHit  door  money  kick  sneer  what  order
    fight  kneel  leave  end  endcard

`FX` must have all of these names:

    knock  creak  coins  kick  gasp  sting  punch  boom  gasp2
    roar  flash  knees  steps

`FX.knock` is a pair of times (the knock and the answer to it).

## The drawings

`chapters/N/plates.js` is the art. Every plate named in `acts.js` must exist
here. Copy chapter two's file and write new plates with the same helpers:

- `scenes/common.js` — `P`, `E`, `RR`, `lin`, `rad`, and the wobbly ones
  `HP`, `HE`, `HR`, `HL`; `HAND()` for a stroke's drift.
- `scenes/figures.js` — `person`, `seated`, `neighbour`, `womanFace`,
  `baldHead`. People are drawn, not blocked out: a body has shoulders, arms
  that bend to a hand, a head with a jaw, a lit side. Never a silhouette in
  black, never a circle on a block.
- `engine/plate.js` — `Ref` and `paintRef`, the reference drawing and the
  knife strokes over it.

A plate is a drawing of a place, not an arrangement of primitives. Light it
from one side, keep the silhouette readable, and let a stroke carry the
material.

## The voices

`chapters/N/voices.py` says who speaks which line. Keep the narrator and the
cast; change the line numbers to your chapter's. Every line that is spoken
must belong to a character.

## The check

Run this before you finish:

```
node tools/dump_lines.mjs N
node tools/check_chapter.mjs N
```

It checks the chapter the way a render would: every line has a shot, every
shot names a plate that exists, every look is a look, every moment the sound
needs is there, no voice points past the end of the chapter, and the film is
not so long that a runner would run out of time. It must pass. If it cannot,
say why in your summary rather than leaving the chapter broken.

## What you decide, and what you do not

You decide the beats, the framing, the drawings and the voices. You do not
decide the version control, the render, or the release: you write files, and
a person reads them before anything is filmed.

## The house style

The film's own words, not a summary of them: the line on the wall is the
chapter's line, exactly. The picture carries what the line does not say. No
title cards in the middle, no voice-over that is not in the chapter, no text
the chapter does not contain.
