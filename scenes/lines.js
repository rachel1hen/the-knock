// The chapter's dialogue, in the order the chapter says it. The film paints
// these lines into the picture; tools/dump_cues.mjs reads the same list, so
// the burned-in type and the .srt never drift apart.
export const LINES = [
  null,
  '“So the Geng family is really like this?”',
  '“Mum, who is this?”',
  '“How’s the money ready?”',
  '“Can these rags have 10,000?”',
  '“Mum!”',
  '“Mom — since I’ve come out, let me handle this.”',
  '“Today is your wedding day … green hat turtle.”',
  '“What did you say?”',
  null,
];

// seconds after a cut before the line starts being laid in
export const LINE_IN = 1.1;
