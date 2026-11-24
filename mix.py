# "The Knock" — foley and the final mix. The room, the knocks, the coins, the kick,
# the sting. Pure numpy + soundfile (no scipy, no sampler, no numba) so that CI needs
# only two packages.
import os, json
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
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


def filt(x, lo=0, hi=SR / 2):
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
    if x.ndim == 2:
        x = x.mean(1)
    fx[i:i + m, 0] += x[:m] * gain * np.sqrt((1 - pan) / 2)
    fx[i:i + m, 1] += x[:m] * gain * np.sqrt((1 + pan) / 2)


# ---- the room: a bed of air, with the lamp's hum in it --------------------
n = N
room = filt(rng.standard_normal(n), 40, 900) * .22
room += filt(rng.standard_normal(n), 90, 240) * .05
room *= np.ones(n)
put(room, 0, .5)

# ---- the knocks: a fist on old wood --------------------------------------
def knock(gain=1.):
    n = int(.45 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (150 - 60 * t / .3) * t) * env(n, .001, 16)
    click = filt(rng.standard_normal(n), 700, 4200) * env(n, .0005, 42)
    knock_wood = filt(rng.standard_normal(n), 120, 900) * env(n, .002, 22)
    return (body * .9 + click * .5 + knock_wood * .8) * gain


for i, at in enumerate(FX['knocks']):
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

# ---- the mix -------------------------------------------------------------
mix = fx + music * .62
peak = np.max(np.abs(mix))
if peak > 0:
    mix *= .89 / peak
mix = np.clip(mix, -1, 1)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype('float32'), SR, subtype='PCM_16')
print('mix ok', round(DUR, 2), 's')
