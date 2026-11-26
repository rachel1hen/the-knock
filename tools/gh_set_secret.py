"""Set a repository Actions secret on rachel1hen/the-knock.

    NVAPI=nvapi-... python tools/gh_set_secret.py NVIDIA_API_KEY

The value arrives in the environment and is immediately sealed with the
repository's public key; the plaintext never touches a file, a command line
argument, or the network in the clear.

Needs pynacl (pip install pynacl) and a GitHub token in the credential
manager (git credential fill).
"""
import base64
import json
import os
import subprocess
import sys
import urllib.request

REPO = "rachel1hen/the-knock"
NAME = sys.argv[1] if len(sys.argv) > 1 else "NVIDIA_API_KEY"

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

req = urllib.request.Request(
    "https://api.github.com/repos/%s/actions/secrets/public-key" % REPO, headers=H)
pk = json.load(urllib.request.urlopen(req, timeout=30))

from nacl import encoding, public

key_obj = public.PublicKey(pk["key"].encode(), encoding.Base64Encoder())
sealed = public.SealedBox(key_obj).encrypt(os.environ["NVAPI"].encode())
body = {
    "encrypted_value": base64.b64encode(sealed).decode(),
    "key_id": pk["key_id"],
}
req = urllib.request.Request(
    "https://api.github.com/repos/%s/actions/secrets/%s" % (REPO, NAME),
    data=json.dumps(body).encode(),
    headers={**H, "Content-Type": "application/json"},
    method="PUT",
)
resp = urllib.request.urlopen(req, timeout=30)
print("PUT %s -> %s" % (NAME, resp.status))

req = urllib.request.Request(
    "https://api.github.com/repos/%s/actions/secrets" % REPO, headers=H)
secrets = json.load(urllib.request.urlopen(req, timeout=30))
print("secrets now present:", [s["name"] for s in secrets.get("secrets", [])])
