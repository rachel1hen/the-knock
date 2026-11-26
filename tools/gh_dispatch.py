"""Dispatch a workflow and report the run it started."""
import json
import subprocess
import sys
import urllib.request

WORKFLOW = sys.argv[1]
REF = sys.argv[2] if len(sys.argv) > 2 else "main"
INPUTS = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}

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
H = {
    "Authorization": "Bearer " + token,
    "Accept": "application/vnd.github+json",
    "Content-Type": "application/json",
}
url = "https://api.github.com/repos/rachel1hen/the-knock/actions/workflows/%s/dispatches" % WORKFLOW
body = {"ref": REF, "inputs": INPUTS}
req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=H, method="POST")
req.add_header("X-GitHub-Api-Version", "2022-11-28")
resp = urllib.request.urlopen(req, timeout=30)
print("dispatched:", WORKFLOW, resp.status)

runs = json.load(urllib.request.urlopen(
    urllib.request.Request(
        "https://api.github.com/repos/rachel1hen/the-knock/actions/workflows/%s/runs?per_page=3" % WORKFLOW,
        headers=H,
    ),
    timeout=30,
))["workflow_runs"]
for r in runs:
    print("  run %s  %s  %s  %s" % (r["id"], r["head_sha"][:7], r["status"], r["conclusion"] or "-"))
    print("     " + r["html_url"])
