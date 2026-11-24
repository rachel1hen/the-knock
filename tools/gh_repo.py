# Create (or find) the GitHub repo and print its URL.
#   python tools/gh_repo.py [public|private]
import json, os, subprocess, sys, urllib.request

USER = 'rachel1hen'
NAME = 'the-knock'
DESC = ('The Knock - chapter two, painted in code. An impasto palette-knife film: '
        'every plate and stroke drawn in code, scored in numpy, rendered by 12 parallel runners.')

# the token git already has, from Git Credential Manager
out = subprocess.run(['git', 'credential', 'fill'], input='protocol=https\nhost=github.com\n\n',
                     capture_output=True, text=True).stdout
token = next(l.split('=', 1)[1] for l in out.splitlines() if l.startswith('password='))
H = {'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json',
     'User-Agent': 'the-knock'}


def call(method, url, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=H, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b'{}')


priv = (sys.argv[1] if len(sys.argv) > 1 else 'private') != 'public'

# already there?
st, d = call('GET', f'https://api.github.com/repos/{USER}/{NAME}')
if st == 200:
    print('exists:', d['html_url'], '| private:', d['private'])
    sys.exit(0)

st, d = call('POST', 'https://api.github.com/user/repos',
             {'name': NAME, 'description': DESC, 'private': priv, 'auto_init': False})
if st == 201:
    print('created:', d['full_name'], '| private:', d['private'])
    print('url:', d['html_url'])
    print('clone:', d['clone_url'])
else:
    print('FAILED', st, d.get('message'))
    sys.exit(1)
