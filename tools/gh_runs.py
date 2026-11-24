# Show the latest Actions runs for the repo.
#   python tools/gh_runs.py [limit]
import json, subprocess, sys, urllib.request

USER, NAME = 'rachel1hen', 'the-knock'
out = subprocess.run(['git', 'credential', 'fill'], input='protocol=https\nhost=github.com\n\n',
                     capture_output=True, text=True).stdout
token = next(l.split('=', 1)[1] for l in out.splitlines() if l.startswith('password='))
H = {'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json',
     'User-Agent': 'the-knock'}
limit = int(sys.argv[1]) if len(sys.argv) > 1 else 5

url = f'https://api.github.com/repos/{USER}/{NAME}/actions/runs?per_page={limit}'
with urllib.request.urlopen(urllib.request.Request(url, headers=H)) as r:
    d = json.loads(r.read())
runs = d.get('workflow_runs', [])
if not runs:
    print('no runs yet')
for run in runs:
    print(f"#{run['id']} {run['name']} {run['status']}/{run['conclusion']} "
          f"branch={run['head_branch']} {run['created_at']} {run['html_url']}")
