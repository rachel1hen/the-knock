#!/bin/sh
# Rebuild "The Knock" from scratch.
#   sh build.sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/c/Users/shahm/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
[ -x "$PY" ] || PY=python3
cd "$HERE"
node tools/dump_timeline.mjs                        # the grid -> out/timeline.json
"$PY" music/score.py                                # the score
"$PY" mix.py                                        # foley and the mix
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 24 --workers 6 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/the-knock.mp4" 24 0
ffmpeg -v error -y -ss 20 -i "$HERE/the-knock.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
