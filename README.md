# The Knock

*An impasto palette-knife film. One chapter of the story, one video, eight and a half minutes.*

Everything on screen is painted in code. The engine draws a flat, value-planned illustration
(Canvas2D), then lays thousands of palette-knife strokes over it — coarse first, fine only
where the paint still differs from the drawing. The strokes know the shapes: a knife never
crosses from one form into the next, so a silhouette stays a silhouette. Nothing is sampled,
nothing is traced; this is paint made of arithmetic.

The chapter's dialogue is painted into the picture too, in Cormorant Garamond, solid inside
the glyphs so the letters hold their shape on the wall. `subtitles_en.srt` carries the same
words on the same clock.

## The whole chapter

The film is the length of the chapter and covers all of it. The 71 lines of
`source/chapter_2.txt` are 71 shots: the spoken words are painted in, the narrated lines are
pictures that carry the meaning, and nothing is skipped. `tools/dump_lines.mjs` reads the
chapter into the list the film and the cue exporter both use, so the words on the wall are
the chapter's own words and cannot drift from it.

| | |
|---|---|
| the question | a cold room at night, one window, him seated with his back to us |
| the knock | the door, filling the frame, shaking on both knocks |
| they come in | the hallway blown out behind them, three silhouettes in it |
| the neighbours | out in the lane, half hidden, whispering what they dare not say |
| the money | a cloth bag on the floor, worn notes and coins spilled around it |
| the kick | his mother on the floor, the stool tipped, a boot mid-arc |
| the stare | him against the window light, the others frozen small behind |
| the sneer | the bald man's head, filling the right of the frame |
| what did you say | the stare again, darker |
| kneel down | the demand, the killing intent, the room gone cold |
| the fight | a punch thrown, a boot that answers it, the white light |
| apologise | the bald man on his knees, then limping away |

## Sound

A held chord in A minor: a low voice under the room, one figure above it that never resolves
until the sneer, where it lifts a third and comes home a bar too late. The foley is close and
dry — two knocks on old wood, a hinge, coins on a floor, the kick, the punch, the men rushing
in, the knees going down, and the limp away.

Every line is also spoken, by Kokoro, offline: the library's own model, no API and no network
at render time. Chen Ping has his own voice, a little closer to the ear than the narrator who
tells the story around him; his mother and Bald Head have theirs.

## How it is built

- `engine/` — the impasto engine (reference drawing → knife strokes → WebGL paint)
- `scenes/` — what every chapter shares: the wobbly hand (`common.js`), the cast
  (`figures.js`), the title cards (`cards.js`)
- `film.js` — the chapter's camera and the light through each shot
- `music/score.py`, `mix.py` — the score and the foley, pure numpy
- `tools/` — the timeline dump, the chapter dump, the subtitle cues, the slice renderer,
  the chapter picker and the chapter check
- `chapters/N/` — one folder per chapter, self-contained: `card.js`, `acts.js` (the beats),
  `timeline.js` (the clock), `plates.js` (the drawings), `voices.py` (who speaks),
  `lines.gen.js` (generated from `source/chapter_N.txt`, never written by hand)
- `chapters/current.js` — generated; the one pointer every film-wide tool reads

Render locally with `sh build.sh` (one machine, six workers) or on GitHub Actions, where the
film is painted by twenty runners at once — twenty slices of frames, joined at the end. The
run also checks the film there (loudness, black frames, a contact sheet) and publishes the
results, so nothing heavy has to run on your own machine.

## Making another chapter

`source/chapter_N.txt` in, `chapters/N/` out — every line of the text becomes a shot, and
`tools/check_chapter.mjs N` checks the chapter the way a render would. To author a chapter's
code without touching your machine, run the `author-chapter` workflow: it starts Claude Code
on a runner behind a translator (`tools/nim_proxy.py`) that points it at NVIDIA's free hosted
models, and the only thing it can produce is a draft pull request with the chapter's own
files — a person reads it before anything is filmed. It needs a free key from
build.nvidia.com in the `NVIDIA_API_KEY` repository secret.

## Credits

Text adapted from chapter two of the story. Everything else: written, painted and scored in
code. Type: Cormorant Garamond and Cormorant SC (SIL Open Font License). Voice: Kokoro
(Apache 2.0). See `CREDITS`.
