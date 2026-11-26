"""Download a run's `checks` artifact and untuck it into out/checks-latest/.

    python tools/gh_fetch_checks.py [artifact-id]

GitHub answers the artifact API with a 302 to a signed blob URL; the token
must not be sent along there, so the redirect is followed by hand.
"""
import io
import os
import subprocess
import sys
import urllib.error
import urllib.request
import zipfile

ART = sys.argv[1] if len(sys.argv) > 1 else ""
if not ART:
    sys.exit("give the artifact id: python tools/gh_fetch_checks.py 123456")

creds = subprocess.run(
    ["git", "credential", "fill"],
    input="protocol=https\nhost=github.com\n\n",
    capture_output=True, text=True,
).stdout
token = next(
    line.split("=", 1)[1]
    for line in creds.splitlines()
    if line.startswith("password=")
)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


opener = urllib.request.build_opener(NoRedirect)
req = urllib.request.Request(
    "https://api.github.com/repos/rachel1hen/the-knock/actions/artifacts/%s/zip" % ART,
    headers={"Authorization": "Bearer " + token},
)
try:
    resp = opener.open(req, timeout=120)
    raw = resp.read()
except urllib.error.HTTPError as e:
    if e.code not in (301, 302, 303, 307, 308):
        raise
    location = e.headers["Location"]
    raw = urllib.request.urlopen(location, timeout=300).read()

out_dir = os.path.join("out", "checks-latest")
os.makedirs(out_dir, exist_ok=True)
with zipfile.ZipFile(io.BytesIO(raw)) as z:
    for name in z.namelist():
        data = z.read(name)
        path = os.path.join(out_dir, os.path.basename(name))
        with open(path, "wb") as f:
            f.write(data)
        print("wrote", path, len(data), "bytes")
