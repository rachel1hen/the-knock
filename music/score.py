# "The Knock" — the score. A held string: one low voice under the room, a
# nylon figure above it, and no resolution until the last bar. Pure numpy +
# soundfile, so CI needs nothing but numpy and soundfile.
#
# The music is long now - the film is the length of the chapter - so the
# figure is written once and then laid over the chapter's own shape: it
# waits through the room, moves with the money, lifts a third at the sneer,
# goes to a bare fifth in the fight, and resolves at the end.
import os, json
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(HERE, '..', 'out'), exist_ok=True)
TL = json.load(open(os.path.join(HERE, '..', 'out', 'timeline.json')))
T, BEAT, BAR, CHORDS = TL['T'], TL['BEAT'], TL['BAR'], TL['CHORDS']
DUR = TL['DUR'] + 1.2
SR = 44100
N = int(DUR * SR)
NOTE = {'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.0, 'A2': 110.0, 'B2': 123.47,
        'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.0, 'A3': 220.0,
        'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.0, 'A4': 440.0}

stereo = np.zeros((N, 2))


def pluck(freq, dur, amp=.3, seed=0, decay=3.2):
    """a plucked string, additively: harmonics, each with its own decay"""
    n = max(8, int(dur * SR))
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k, h in enumerate((1, 2, 3, 4, 5, 6, 7, 8)):
        f = freq * h
        if f > 5600:
            break
        a = amp / (h ** 1.35)
        d = decay * (1 + (h - 1) * .55)
        out += a * np.sin(2 * np.pi * f * t + seed * .37 * h) * np.exp(-d * t)
    out += .012 * amp * np.sin(2 * np.pi * freq * 2.01 * t) * np.exp(-1.4 * t)   # a little beating
    out *= 1 - np.exp(-t * 300)                                                 # the finger
    out *= np.exp(-t * .45)
    return out


def bass(freq, dur, amp=.22):
    n = max(8, int(dur * SR))
    t = np.arange(n) / SR
    out = (np.sin(2 * np.pi * freq * t) + .16 * np.sin(4 * np.pi * freq * t)) * np.exp(-t * 1.5)
    out *= 1 - np.exp(-t * 90)
    return out * amp


def place(x, at, gain=1., pan=0.):
    i = int(at * SR)
    if i < 0 or i >= N:
        return
    m = min(len(x), N - i)
    if m <= 0:
        return
    stereo[i:i + m, 0] += x[:m] * gain * np.sqrt((1 - pan) / 2)
    stereo[i:i + m, 1] += x[:m] * gain * np.sqrt((1 + pan) / 2)


# ---- the shape of the chapter --------------------------------------------
# The film is a sequence of movements, and the music follows them: the room
# (held), the door (the collectors arrive), the money (a pulse), the kick
# (the floor drops out), the sneer (the figure lifts a third), the order
# (the killing intent), the fight (a bare fifth), the apology (the open
# fifth), and the end (the resolution).
#
# Each movement is a chord, and the figure is a set of notes over it.
SECTIONS = [
    # (from,      to,        chord, order,   figure,               gain)
    (0.0,        'room',    'Am', None,    None,                 .26),
    ('room',     'door',    'Am', 'AB',   'a',                  .26),
    ('door',     'money',   'F',  'AB',   'b',                  .24),
    ('money',    'kick',    'Dm', 'AB',   'b',                  .24),
    ('kick',     'sneer',   'Am', 'ABC',  'c',                  .26),
    ('sneer',    'what',    'F',  'ABC',  'd',                  .26),
    ('what',     'order',   'Dm', 'AC',   'd',                  .22),
    ('order',    'fight',   'Am', 'AB',   'e',                  .28),
    ('fight',    'kneel',   'Dm', 'AB',   'e',                  .24),
    ('kneel',    'leave',   'Am', 'ABC',  'c',                  .22),
    ('leave',    'end',     'Am', 'ABC',  'resolve',            .24),
]

# the figure, in scale degrees over the chord: (beat, duration, degree)
# degree 0 is the root, 2 the third, 4 the fifth, -1 a rest, 7 the seventh
FIGURES = {
    'a':       [(1, 2, 0), (3, 1, 4), (5, 2, 0), (7, 1, 4)],
    'b':       [(1, 2, 0), (3, 1, 2), (5, 2, 0), (7, 1, 4)],
    'c':       [(1, 2, 0), (3, 1, 4), (5, 2, 2), (7, 1, 4)],
    'd':       [(1, 2, 0), (3, 1, 4), (5, 1, 2), (6, 1, 4), (7, 2, 0)],
    'e':       [(1, 1, 0), (2, 1, 0), (3, 1, 4), (4, 1, 4), (5, 2, 0), (7, 1, 2)],
    'resolve': [(1, 2, 0), (3, 2, 2), (5, 4, 4)],
}
DEGREES = {0: 0, 2: 2, 4: 4, 7: 6}


def when(v):
    return T[v] if isinstance(v, str) else float(v)


def section_is_sneer(a, b):
    """the sneer's movement is the one where the badge lifts a third"""
    return when(a) <= T['sneer'] < when(b)


def chord_tones(chord):
    return CHORDS[chord][0]


def figure_notes(chord, figure):
    """the figure's degrees, resolved to the chord's own tones"""
    tones = chord_tones(chord)
    if figure == 'resolve':
        # the last movement is the open fifth the whole film has been asking for
        return [(1, 2, tones[0], 0), (3, 2, tones[1], 2), (5, 4, tones[2], 4)]
    out = []
    for beat, dur, deg in FIGURES[figure]:
        if deg < 0:
            continue
        # the third of the chord is the third degree; the fifth is the fifth
        idx = {0: 0, 2: 1, 4: 2}[deg]
        out.append((beat, dur, tones[idx], deg))
    return out


# ---- lay the sections on the clock ---------------------------------------
# a bar is BAR seconds; the movement changes when the picture does
cursor = 0.0
for idx, (a, b, chord, order, figure, gain) in enumerate(SECTIONS):
    t0, t1 = when(a), when(b)
    if t1 <= t0:
        continue
    last = idx == len(SECTIONS) - 1
    # the bass: one root per bar
    bar = 0
    while True:
        bt = t0 + bar * BAR
        if bt >= t1 - .01 and not last:
            break
        if bt >= DUR - .5:
            break
        place(bass(NOTE[CHORDS[chord][1]], BEAT * 4.4, gain * .82), bt, 1.)
        # the chord's third and fifth, once a bar, low and quiet
        if order and bar % 2 == 1:
            place(bass(NOTE[CHORDS[chord][0][1]], BEAT * 2.2, gain * .3), bt, .7, -.2)
        bar += 1
    # the figure over the section
    if figure:
        notes = figure_notes(chord, figure)
        bar = 0
        while True:
            bt = t0 + bar * BAR
            if bt >= t1 - .01 and not last:
                break
            if bt >= DUR - .5:
                break
            for beat, dur, pitch, deg in notes:
                # the sneer lifts a third: the figure climbs to the seventh
                p = pitch
                if chord == 'F' and deg == 4 and section_is_sneer(a, b):
                    p = 'F#4'
                freq = NOTE[p] if isinstance(p, str) else p
                amp = .30 if p[0] in 'AE' else .24
                place(pluck(freq, dur * BEAT * 2.6, amp, seed=bt * 3), bt + (beat - 1) * BEAT, 1.,
                      -.12 if bar % 2 else .12)
            bar += 1

# the two sections' orderings are read as the chapter moves
# ---- the sting: air leaving the room, at "What did you say?" --------------
st = int(1.6 * SR)
t = np.arange(st) / SR
s = sum(np.sin(2 * np.pi * f * t) * np.exp(-1.9 * t) for f in (58.27, 87.31, 116.54)) * .16
place(s, T['what'] - .1, 1.)
place(s * .5, T['what'] - .1, 1., .5)

peak = np.max(np.abs(stereo))
if peak > 0:
    stereo *= .72 / peak
sf.write(os.path.join(HERE, '..', 'out', 'score.wav'), stereo, SR, subtype='PCM_16')
print('score ok', round(DUR, 2), 's')
