# "The Knock" — the score. A held string: one low voice under the room, a nylon
# figure above it, and no resolution until the last bar. Pure numpy + soundfile,
# so CI needs nothing but numpy and soundfile.
import os, json
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(HERE, '..', 'out'), exist_ok=True)
TL = json.load(open(os.path.join(HERE, '..', 'out', 'timeline.json')))
T, NA, NB, TB, BEAT, CH_B, CHORDS = TL['T'], TL['NA'], TL['NB'], TL['TB'], TL['BEAT'], TL['CH_B'], TL['CHORDS']
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


# ---- the bass: one root per bar -----------------------------------------
for bar in range(1, 17):
    chord = CH_B.get(str(bar), 'Am')
    root = NOTE[CHORDS[chord][1]]
    amp = .26 if bar <= 6 else .20
    place(bass(root, BEAT * 4.4, amp), TB[bar], 1.)

# ---- the figure ----------------------------------------------------------
for n in NA:
    place(pluck(NOTE[n['pitch']], n['d'] * 2.6, .30 if n['pitch'][0] in 'AE' else .24, seed=n['t'] * 3), n['t'], 1., -.12)
for n in NB:
    place(pluck(NOTE[n['pitch']], n['d'] * 2.6, .30 if n['pitch'][0] in 'AE' else .24, seed=n['t'] * 3), n['t'], 1., .12)

# ---- a drone under the knocks -------------------------------------------
for at, dur in ((T['room'], T['knock'] - T['room']), (T['kick'], T['sneer'] - T['kick'])):
    n = int(dur * SR)
    t = np.arange(n) / SR
    d = (np.sin(2 * np.pi * 55.0 * t) + .5 * np.sin(2 * np.pi * 55.3 * t)) * .10 * (1 - np.exp(-t * 2))
    place(d, at, 1.)

# ---- the sting: "What did you say?" --------------------------------------
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
