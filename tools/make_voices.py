# The chapter, spoken.
#
# Every line of the chapter is voiced with Kokoro (offline, from the library's
# own model) and laid under its own picture. Two voices carry the film:
# a man for Chen Ping, a woman for Tang Hongying; the rest are read by the
# narrator. The narration is cut to the line, so the picture and the voice
# agree: the voice starts when the line's picture has settled and stops before
# the cut.
#
#   python tools/make_voices.py            # write out/voice/*.wav + out/narration.json
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
OUT = os.path.join(ROOT, 'out', 'voice')

# who speaks each line: the chapter's own dialogue decides, and the narration
# around it is read by whoever the scene is about
NARRATOR = 'bm_george'
CHEN = 'bm_george'
TANG = 'af_heart'
BALDY = 'am_michael'
MOTHER_F = 'af_heart'

# lines spoken by these characters (1-based chapter line numbers)
CHEN_LINES = {1, 6, 7, 27, 32, 39, 40, 46, 47, 52, 64, 65, 68, 69, 70, 71}
TANG_LINES = {5, 8, 9, 13, 14, 24, 25, 31, 33, 44, 45, 55, 56, 57}
BALDY_LINES = {11, 12, 21, 22, 23, 26, 30, 34, 35, 36, 37, 38, 41, 42, 49, 50, 58, 59, 60, 62, 66, 67, 68}
NEIGHBOUR_LINES = {15, 16, 17, 18, 19}

# the narration around a line is read by that line's speaker when there is one,
# and by the narrator otherwise; an action beat (no speech) is read by the
# narrator unless another character owns the moment
ACTION_OWNER = {
    2: NARRATOR, 3: NARRATOR, 4: TANG, 10: BALDY, 20: BALDY, 28: CHEN,
    29: BALDY, 43: CHEN, 48: BALDY, 51: BALDY, 53: CHEN, 54: BALDY,
    61: CHEN, 63: NARRATOR, 70: CHEN, 71: BALDY,
}


def speaker(n):
    if n in CHEN_LINES:
        return CHEN
    if n in TANG_LINES:
        return TANG
    if n in BALDY_LINES:
        return BALDY
    if n in NEIGHBOUR_LINES:
        return NARRATOR
    return ACTION_OWNER.get(n, NARRATOR)


def main():
    lines = json.load(open(os.path.join(ROOT, 'out', 'lines.json'), encoding='utf-8'))
    os.makedirs(OUT, exist_ok=True)

    # one utterance per line: the spoken words if there are any, else the narration
    jobs = []
    for l in lines:
        text = l['spoken'] or l['narration']
        if not text:
            continue
        # the narrator does not read the quotation marks aloud
        if not l['spoken']:
            text = l['narration']
        jobs.append({'id': 'L%02d' % l['n'], 'text': text,
                     'voice': speaker(l['n']), 'speed': 0.95, 'lang': 'en-us',
                     '_n': l['n'], '_spoken': bool(l['spoken'])})

    req = os.path.join(OUT, 'lines.json')
    json.dump([{k: v for k, v in j.items() if not k.startswith('_')} for j in jobs],
              open(req, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    py = os.path.join(LIB, '.venv', 'Scripts', 'python.exe')
    if not os.path.exists(py):
        py = os.path.join(LIB, '.venv', 'bin', 'python')
    print('voicing', len(jobs), 'lines with', py)
    r = subprocess.run([py, os.path.join(LIB, 'core', 'tts', 'tts.py'), req, OUT],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode:
        print(r.stdout[-3000:])
        print(r.stderr[-3000:])
        sys.exit(1)
    print(r.stdout[-600:].encode('ascii', 'replace').decode('ascii'))

    durations = json.load(open(os.path.join(OUT, 'dur.json'), encoding='utf-8'))
    meta = []
    for j in jobs:
        d = durations.get(j['id'], 0)
        if isinstance(d, dict):
            d = d.get('dur', 0)
        meta.append({'n': j['_n'], 'id': j['id'], 'voice': j['voice'],
                     'spoken': j['_spoken'], 'dur': float(d)})
    json.dump(meta, open(os.path.join(ROOT, 'out', 'narration.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    total = sum(m['dur'] for m in meta)
    print('total speech:', round(total, 1), 's over', len(meta), 'lines')


if __name__ == '__main__':
    main()
