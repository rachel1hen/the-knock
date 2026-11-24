# Download the artifacts of a run into a folder, and show what is inside each.
#   python tools/gh_artifacts.py <run_id> [out folder]
import json, os, subprocess, sys, urllib.request, zipfile

USER, NAME = 'rachel1hen', 'the-knock'
out = subprocess.run(['git', 'credential', 'fill'], input='protocol=https\nhost=github.com\n\n',
                     capture_output=True, text=True).stdout
token = next(l.split('=', 1)[1] for l in out.splitlines() if l.startswith('password='))
H = {'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json',
     'User-Agent': 'the-knock'}


def get(url):
    """GET, following the redirect to the artifact CDN without the auth header.
    GitHub signs that URL itself; sending Authorization to it fails with 401."""
    class NoAuthOnRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            new = super().redirect_request(req, fp, code, msg, headers, newurl)
            if new is not None and 'Authorization' in new.headers:
                del new.headers['Authorization']
            return new

    opener = urllib.request.build_opener(NoAuthOnRedirect)
    with opener.open(urllib.request.Request(url, headers=H)) as r:
        return r.read()


run = sys.argv[1]
dest = sys.argv[2] if len(sys.argv) > 2 else 'out/artifacts'
os.makedirs(dest, exist_ok=True)
arts = json.loads(get(f'https://api.github.com/repos/{USER}/{NAME}/actions/runs/{run}/artifacts?per_page=100'))
for a in arts['artifacts']:
    name = a['name']
    d = os.path.join(dest, name)
    os.makedirs(d, exist_ok=True)
    raw = get(f'https://api.github.com/repos/{USER}/{NAME}/actions/artifacts/{a["id"]}/zip')
    with zipfile.ZipFile(__import__('io').BytesIO(raw)) as z:
        names = z.namelist()
        z.extractall(d)
    print(f"{name:<14} {a['size_in_bytes']:>10} bytes  -> {d}")
    for n in names:
        print(f"     {n}")
