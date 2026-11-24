# "The Knock" — foley, the scene, and the mix.
#
# The room, the knocks, the coins, the kick, the fight, the apology. Every
# sound is placed at the moment the chapter has it, so the ear is told the
# same story the eye is. The narration is laid in underneath the room tone,
# trimmed to its own line, so the voice sits inside the picture.
#
# Pure numpy + soundfile (no scipy, no sampler, no numba) so that CI needs
# only two packages.
import os, json, glob
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
TL = json.load(open(os.path.join(HERE, 'out', 'timeline.json')))
T, FX, DUR = TL['T'], TL['FX'], TL['DUR'] + .4
SR = 44100
N = int(DUR * SR)
rng = np.random.default_rng(29)

music, sr = sf.read(os.path.join(HERE, 'out', 'score.wav'))
music = music[:N] if len(music) >= N else np.pad(music, ((0, N - len(music)), (0, 0)))
if music.ndim == 1:
    music = np.stack([music, music], 1)

fx = np.zeros((N, 2))


def filt(x, lo, hi):
    """zero-phase band-pass through the fft"""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, n=len(x))


def env(n, attack=.002, decay=6.):
    t = np.arange(n) / SR
    return (1 - np.exp(-t / attack)) * np.exp(-decay * t)


def put(x, at, gain=1., pan=0.):
    i = int(at * SR)
    if i < 0 or i >= N:
        return
    m = min(len(x), N - i)
    if m <= 0:
        return
    fx[i:i + m, 0] += x[:m] * gain * np.sqrt((1 - pan) / 2)
    fx[i:i + m, 1] += x[:m] * gain * np.sqrt((1 + pan) / 2)


# ---- the room: a bed of air, with the lamp's hum in it --------------------
n = int(min(DUR, 62) * SR)
t = np.arange(n) / SR
air = filt(rng.standard_normal(n), 60, 900) * env(n, .5, .05) * .05
put(air, 0, .5)

# the drone under the knocks, and under the long fight
for a, b in ((T['room'], T['knock'] + 3), (T['kick'], T['sneer'] + 2)):
    n = max(1, int((b - a) * SR))
    t = np.arange(n) / SR
    d = (np.sin(2 * np.pi * 55.0 * t) + .5 * np.sin(2 * np.pi * 55.3 * t)) * .10 * (1 - np.exp(-t * 2))
    put(d, a, 1.)


# ---- the knocks: a fist on old wood --------------------------------------
def knock(gain=1.):
    n = int(.45 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (150 - 60 * t / .3) * t) * env(n, .001, 16)
    click = filt(rng.standard_normal(n), 700, 4200) * env(n, .0005, 42)
    knock_wood = filt(rng.standard_normal(n), 120, 900) * env(n, .002, 22)
    return (body * .9 + click * .5 + knock_wood * .8) * gain


k0, k1 = FX['knock']
for i, at in enumerate([k0, k1]):
    put(knock(1. if i == 0 else .82), at, .9, .1)

# ---- the door: a hinge, then the room tone changes ------------------------
n = int(1.6 * SR)
t = np.arange(n) / SR
creak = filt(rng.standard_normal(n), 380, 1900) * (0.35 + 0.65 * (np.sin(2 * np.pi * 7.5 * t) * .5 + .5)) * env(n, .12, 1.5)
put(creak, FX['creak'], .16, -.25)

# ---- the bag: worn notes and coins on the floor ---------------------------
n = int(.9 * SR)
t = np.arange(n) / SR
coins = np.zeros(n)
for k in range(26):
    f = 2600 + rng.random() * 3400
    at = rng.random() * .55
    i = int(at * SR)
    m = min(n - i, int(.18 * SR))
    if m <= 0:
        continue
    tt = np.arange(m) / SR
    coins[i:i + m] += .5 * np.sin(2 * np.pi * f * tt) * np.exp(-38 * tt)
coins = filt(coins, 1800, 9000) * env(n, .002, 1.2)
put(coins, FX['coins'], .22, .2)

# ---- the kick ------------------------------------------------------------
n = int(.7 * SR)
t = np.arange(n) / SR
thump = (np.sin(2 * np.pi * (78 - 34 * t / .25) * t) * env(n, .001, 9) +
         filt(rng.standard_normal(n), 60, 700) * env(n, .001, 20))
put(thump, FX['kick'], 1.05, .12)

# ---- his breath, right after ---------------------------------------------
n = int(.8 * SR)
t = np.arange(n) / SR
breath = filt(rng.standard_normal(n), 500, 2600) * (np.sin(2 * np.pi * 1.6 * t) * .5 + .5) * env(n, .08, 1.1)
put(breath, FX['gasp'], .30, -.2)

# ---- the sting: air leaving the room -------------------------------------
n = int(2.2 * SR)
t = np.arange(n) / SR
whoosh = filt(rng.standard_normal(n), 1200, 7000) * (1 - np.exp(-t * 7)) * np.exp(-t * 1.6)
put(whoosh, FX['sting'] - .15, .16, 0)

# ---- the fight: a body, a scuffle, a fall -------------------------------
def thump_at(at, f0=70, dur=.6, gain=.9, pan=0.):
    n = int(dur * SR)
    t = np.arange(n) / SR
    b = np.sin(2 * np.pi * (f0 - 30 * t / dur) * t) * env(n, .001, 11)
    g = filt(rng.standard_normal(n), 80, 900) * env(n, .001, 22)
    put((b + g) * gain, at, 1., pan)


# the punch he throws, and the boot that answers it
thump_at(FX['punch'], 96, .55, .95, .1)
thump_at(FX['boom'], 62, .8, 1.1, -.1)
thump_at(FX['gasp2'], 54, 1.0, 1.0, .05)

# the men rushing in: feet, then the light
n = int(1.4 * SR)
t = np.arange(n) / SR
steps = np.zeros(n)
for k in range(7):
    f = 90 + rng.random() * 60
    tt = np.arange(int(.12 * SR)) / SR
    s = np.sin(2 * np.pi * f * tt) * env(len(tt), .001, 26)
    at = int(.12 + k * .17 + rng.random() * .04)
    i = int(at * SR)
    m = min(len(tt), n - i)
    if m > 0:
        steps[i:i + m] += s[:m]
put(steps, FX['roar'] - .4, .5, .3)

# the white light: a breath of air and a shimmer
n = int(2.4 * SR)
t = np.arange(n) / SR
shimmer = (np.sin(2 * np.pi * 1320 * t) + .6 * np.sin(2 * np.pi * 1980 * t)) * env(n, .006, 3.4) * .07
put(shimmer, FX['flash'], .8, 0)

# the knees going down on the floor
for k, at in enumerate([FX['knees'], FX['knees'] + .34]):
    thump_at(at, 58, .5, .7, -.15)

# the limping away
n = int(1.6 * SR)
t = np.arange(n) / SR
limp = np.zeros(n)
for k in range(5):
    tt = np.arange(int(.14 * SR)) / SR
    s = np.sin(2 * np.pi * (78 + rng.random() * 26) * tt) * env(len(tt), .001, 22)
    at = int(.1 + k * .3 + rng.random() * .05)
    i = int(at * SR)
    m = min(len(tt), n - i)
    if m > 0:
        limp[i:i + m] += s[:m]
put(limp, FX['steps'], .42, .35)

# ---- the narration -------------------------------------------------------
# Each line's voice, laid under the room and cut to the line. The voice sits
# a little to one side, the way a person standing in the room would.
VOICE_DIR = os.path.join(HERE, 'out', 'voice')
narration = []
npath = os.path.join(HERE, 'out', 'narration.json')
if os.path.exists(npath):
    narration = json.load(open(npath, encoding='utf-8'))

BEATS = json.load(open(os.path.join(HERE, 'out', 'beats.json'), encoding='utf-8')) if \
    os.path.exists(os.path.join(HERE, 'out', 'beats.json')) else []
beat_of = {b['n']: b for b in BEATS}

if narration and beat_of:
    for item in narration:
        wav = os.path.join(VOICE_DIR, item['id'] + '.wav')
        if not os.path.exists(wav):
            continue
        beat = beat_of.get(item['n'])
        if not beat:
            continue
        v, vsr = sf.read(wav)
        if v.ndim > 1:
            v = v.mean(1)
        if vsr != SR:
            # resample by linear interpolation (the voices are 24 kHz)
            m = int(len(v) * SR / vsr)
            x = np.linspace(0, len(v) - 1, m)
            v = np.interp(x, np.arange(len(v)), v)
        # the voice starts just after the picture settles, and stops before the cut
        start = beat['t0'] + min(.85, max(.35, beat['dur'] * .18))
        # a small tail of room tone so the voice is not cut dead
        tail = np.zeros(int(.18 * SR))
        v = np.concatenate([v, tail])
        # the voice is heard through the room: a touch of presence, a little air
        v = filt(v, 90, 9000) * .96
        pan = .06 if item['n'] % 2 else -.06
        # Chen Ping is the protagonist: he is heard a little closer than the rest
        gain = 2.9 if item['voice'] == 'bm_george' else (2.4 if item['spoken'] else 2.1)
        put(v, start, gain, pan)

# ---- the mix -------------------------------------------------------------
# the music sits under the voice, not over it: where a line is being spoken
# the room steps back a little, so the words are always the loudest thing
music_gain = np.full((N, 1), .52)
if narration and beat_of:
    for item in narration:
        beat = beat_of.get(item['n'])
        if not beat:
            continue
        s = int(max(0, beat['t0'] - .3) * SR)
        e = int(min(DUR, beat['t0'] + beat['dur'] + .4) * SR)
        music_gain[s:e] = .38
mix = fx + music * music_gain
peak = np.max(np.abs(mix))
if peak > 0:
    mix *= .89 / peak
mix = np.clip(mix, -1, 1)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype('float32'), SR, subtype='PCM_16')
print('mix ok', round(DUR, 2), 's', len(narration), 'voices')
