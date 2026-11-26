"""Print the failing steps of a run: the annotations and the log tail."""
import io
import json
import subprocess
import sys
import urllib.error
import urllib.request
import zipfile

RUN = sys.argv[1]
REPO = "rachel1hen/the-knock"

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
H = {"Authorization": "Bearer " + token, "Accept": "application/vnd.github+json"}


def get_json(url):
    req = urllib.request.Request(url, headers=H)
    return json.load(urllib.request.urlopen(req, timeout=30))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


opener = urllib.request.build_opener(NoRedirect)


def get_bytes(url):
    req = urllib.request.Request(url, headers=H)
    try:
        return opener.open(req, timeout=60).read()
    except urllib.error.HTTPError as e:
        if e.code in (301, 302, 303, 307, 308):
            return urllib.request.urlopen(e.headers["Location"], timeout=120).read()
        raise


jobs = get_json("https://api.github.com/repos/%s/actions/runs/%s/jobs" % (REPO, RUN))["jobs"]
for job in jobs:
    print("job:", job["name"], job["status"], job["conclusion"])
    for step in job.get("steps", []):
        mark = "!" if step["conclusion"] not in ("success", "skipped", None) else " "
        print("  %s %-45s %s" % (mark, step["name"], step["conclusion"]))
    if job["status"] != "completed":
        print("  (still running: no log yet)")
        continue
    try:
        raw = get_bytes("https://api.github.com/repos/%s/actions/jobs/%s/logs" % (REPO, job["id"]))
    except Exception as e:
        print("  (no log: %s)" % e)
        continue
    try:
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            text = b"".join(z.read(n) for n in z.namelist()).decode("utf-8", "replace")
    except zipfile.BadZipFile:
        text = raw.decode("utf-8", "replace")
    lines = [ln for ln in text.splitlines() if ln.strip()]
    print("  ---- log tail ----")
    for ln in lines[-40:]:
        print("   ", ln[:300])
