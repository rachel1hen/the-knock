# The Knock

*An impasto palette-knife film. One chapter of the story, one video, sixty-two seconds.*

## What this is

A single short film adapted from chapter two of the story: the wedding-day room, the knock
at the door, the debt collectors, the kick, and the cold look that stops the room.

Everything on screen is painted in code. The engine draws a flat, value-planned illustration
(Canvas2D), then lays thousands of palette-knife strokes over it — coarse first, fine only
where the paint still differs from the drawing. The strokes know the shapes: a knife never
crosses from one form into the next, so a silhouette stays a silhouette. Nothing is sampled,
nothing is traced; this is paint made of arithmetic.

## The chapter, in eight plates

| beat | plate | what the knife does |
|---|---|---|
| the question | a cold room at night, one window, him seated with his back to us | long horizontal planes of blue-grey; a thin pallid rim on the chair |
| the knock | the door, filling the frame | wood grain in vertical strokes; the frame shakes on both knocks |
| they come in | the hallway blown out behind them, three silhouettes in it | the brightest light in the film, everything else a cut-out |
| the money | a cloth bag on the floor, worn notes and coins spilled around it | amber pool of lamplight; tiny bright strokes for the coins |
| the kick | his mother on the floor, the stool tipped, a boot mid-arc | red bleeding into the grey; one violent diagonal |
| the stare | him standing against the window light, the others frozen small behind | cold rim light down one side; two bright eyes |
| the sneer | the bald man's head, filling the right of the frame | warm flesh strokes, a grin in two strokes, a wedding invitation drifting on the left |
| what did you say | the stare again, darker | everything pulled down except the eyes and the line |

Each chapter line is set in Cormorant Garamond and laid in with the knife like everything
else — solid inside the glyphs, so the letters hold their shape on the wall.

## Sound

A held chord in A minor: a low voice under the room, one figure above it that never resolves
until the sneer, where it lifts a third and comes home a bar too late. The foley is close and
dry — two knocks on old wood, a hinge, coins on a floor, the kick, and his breath just after.

## How it is built

- `engine/` — the impasto engine (reference drawing → knife strokes → WebGL paint)
- `scenes/story.js` — the eight plates, the figures, the light
- `scenes/cards.js` — the title and the chapter lines
- `timeline.js` — the music grid; every cut and every sound sits on it
- `music/score.py`, `mix.py` — the score and the foley, pure numpy
- `film.js` — the cut list, the camera, the light through each shot

Render locally with `sh build.sh` (one machine, six workers) or on GitHub Actions, where the
film is painted by twelve runners at once — twelve slices of frames, joined at the end.

## Credits

Text adapted from chapter two of the story. Everything else: written, painted and scored in
code. Type: Cormorant Garamond and Cormorant SC (SIL Open Font License).
