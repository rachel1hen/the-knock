# Show the jobs of one Actions run and where they stand.
#   python tools/gh_jobs.py [run_id]
import json, subprocess, sys, urllib.request

USER, NAME = 'rachel1hen', 'the-knock'
out = subprocess.run(['git', 'credential', 'fill'], input='protocol=https\nhost=github.com\n\n',
                     capture_output=True, text=True).stdout
token = next(l.split('=', 1)[1] for l in out.splitlines() if l.startswith('password='))
H = {'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json',
     'User-Agent': 'the-knock'}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=H)) as r:
        return json.loads(r.read())


runs = get(f'https://api.github.com/repos/{USER}/{NAME}/actions/runs?per_page=1')['workflow_runs']
if not runs:
    print('no runs')
    sys.exit(0)
run = runs[0]
print(f"run #{run['id']} {run['status']}/{run['conclusion']} {run['html_url']}")
jobs = get(f'https://api.github.com/repos/{USER}/{NAME}/actions/runs/{run["id"]}/jobs?per_page=100')['jobs']
for j in sorted(jobs, key=lambda j: j['name']):
    print(f"  {j['name']:<24} {j['status']}/{j['conclusion']}")
    for s in j.get('steps', []):
        if s['conclusion'] not in ('success', 'skipped', None):
            print(f"      ! {s['name']}: {s['conclusion']}")
