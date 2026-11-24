# Show the log of one Actions job.
#   python tools/gh_log.py <job id> [grep]
import io, subprocess, sys, urllib.request, zipfile

CODE = r'''
import sys, urllib.request, zipfile, io, subprocess
def get(url, headers):
    class NoAuth(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            new = super().redirect_request(req, fp, code, msg, headers, newurl)
            if new is not None and 'Authorization' in new.headers:
                del new.headers['Authorization']
            return new
    opener = urllib.request.build_opener(NoAuth)
    with opener.open(urllib.request.Request(url, headers=headers)) as r:
        return r.read()
'''

out = subprocess.run(['git', 'credential', 'fill'], input='protocol=https\nhost=github.com\n\n',
                     capture_output=True, text=True).stdout
token = next(l.split('=', 1)[1] for l in out.splitlines() if l.startswith('password='))
H = {'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json',
     'User-Agent': 'the-knock'}

job = sys.argv[1]
grep = sys.argv[2] if len(sys.argv) > 2 else ''
exec(CODE)
data = get('https://api.github.com/repos/rachel1hen/the-knock/actions/jobs/%s/logs' % job, H)
# the endpoint answers with a zip of the log files, or with plain text
if data[:2] == b'PK':
    z = zipfile.ZipFile(io.BytesIO(data))
    text = '\n'.join(z.read(n).decode('utf-8', 'replace') for n in z.namelist() if n.endswith('.txt'))
else:
    text = data.decode('utf-8', 'replace')
for line in text.split('\n'):
    if not grep or grep.lower() in line.lower():
        print(line[:300])
