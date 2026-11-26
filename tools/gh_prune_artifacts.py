"""Delete Actions artifacts, and report how much space they took.

    python tools/gh_prune_artifacts.py --all
    python tools/gh_prune_artifacts.py --keep-run 45669901438
    python tools/gh_prune_artifacts.py --report

GitHub's free plan allows 500 MB of artifact storage; a single 20-slice render
puts ~1.4 GB there, so the old runs have to go. The film itself lives in the
release, not in an artifact, so nothing here is the last copy of anything.
"""
import json
import subprocess
import sys
import urllib.error
import urllib.request

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


def delete(artifact_id):
    """Artifacts are deleted by id, not by their download url."""
    url = "https://api.github.com/repos/%s/actions/artifacts/%s" % (REPO, artifact_id)
    req = urllib.request.Request(url, headers=H, method="DELETE")
    try:
        urllib.request.urlopen(req, timeout=30)
        return True
    except urllib.error.HTTPError as e:
        print("  could not delete:", e.code)
        return False


args = sys.argv[1:]
report_only = "--report" in args
keep_run = None
for i, a in enumerate(args):
    if a == "--keep-run":
        keep_run = args[i + 1]

runs = get_json(
    "https://api.github.com/repos/%s/actions/runs?per_page=15" % REPO
)["workflow_runs"]

total = 0
freed = 0
for run in runs:
    if run["status"] != "completed":
        continue
    arts = get_json(run["artifacts_url"])["artifacts"]
    if not arts:
        continue
    keep_this = keep_run is not None and str(run["id"]) == str(keep_run)
    for a in arts:
        mb = a["size_in_bytes"] / 1e6
        total += mb
        # the slices are the bulk and nothing else needs them; the film is in
        # the release, so even the joined artifact can go
        keep = keep_this and a["name"] not in ("checks",)
        if keep and report_only:
            print("  keep   %-12s %7.1f MB  run %s" % (a["name"], mb, run["id"]))
            continue
        if not keep and report_only:
            print("  delete %-12s %7.1f MB  run %s" % (a["name"], mb, run["id"]))
        if not report_only and delete(a["id"]):
            freed += mb

print("\n%.1f MB of artifacts, %.1f MB freed" % (total, freed))
