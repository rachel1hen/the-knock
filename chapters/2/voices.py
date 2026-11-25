# The chapter, spoken.
#
# Every line of the chapter is voiced with Kokoro (offline, from the library's
# own model) and laid under its own picture. Two voices carry the film:
# a man for Chen Ping, a woman for Tang Hongying; the rest are read by the
# narrator. The narration is cut to the line, so the picture and the voice
# agree: the voice starts when the line's picture has settled and stops before
# the cut.
#
#   python chapters/2/voices.py            # write out/voice/*.wav + out/narration.json
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
OUT = os.path.join(ROOT, 'out', 'voice')

# Who speaks each line. Chen Ping is the film's protagonist, so he has his own
# voice - a little lower and steadier than the narrator, who tells the story
# around him. His mother is the other voice the listener has to know.
NARRATOR = 'bm_fable'
CHEN = 'bm_george'
TANG = 'af_heart'
BALDY = 'am_michael'
MOTHER_F = 'af_heart'

# Lines spoken by these characters, from the chapter's own dialogue
# (1-based chapter line numbers).
CHEN_LINES = {1, 6, 27, 32, 39, 46, 64, 69}          # Chen Ping, the protagonist
TANG_LINES = {8, 13, 24, 30, 55}                     # his mother
BALDY_LINES = {11, 21, 22, 26, 34, 35, 36, 37, 41, 49, 58, 67}   # Bald Head
NEIGHBOUR_LINES = {16, 17, 18}                       # the neighbours

# An action beat has no speech of its own, so the narration around it is read
# by whoever owns the moment: his mother when she is afraid, Bald Head when he
# is angry, Chen Ping when the room turns on him.
ACTION_OWNER = {
    2: CHEN, 3: CHEN, 4: TANG, 5: TANG, 7: CHEN, 9: TANG, 10: BALDY,
    12: BALDY, 14: TANG, 15: NARRATOR, 19: NARRATOR, 20: BALDY, 23: BALDY,
    25: TANG, 28: CHEN, 29: BALDY, 31: TANG, 33: CHEN, 40: CHEN, 42: BALDY,
    43: CHEN, 44: TANG, 45: TANG, 47: CHEN, 48: BALDY, 50: BALDY, 51: BALDY,
    52: TANG, 53: CHEN, 54: BALDY, 56: TANG, 57: CHEN, 59: BALDY, 60: BALDY,
    61: CHEN, 62: BALDY, 63: NARRATOR, 65: CHEN, 66: BALDY, 68: NARRATOR,
    70: CHEN, 71: BALDY,
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

    # the library's own virtualenv if it has one (local renders), otherwise
    # whatever python is on the path (CI installs the runtime itself)
    py = None
    for cand in (os.path.join(LIB, '.venv', 'Scripts', 'python.exe'),
                 os.path.join(LIB, '.venv', 'bin', 'python')):
        if os.path.exists(cand):
            py = cand
            break
    if py is None:
        py = sys.executable
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
