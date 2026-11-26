"""A fake NIM: it answers the way NVIDIA answers, so the proxy can be tested
without a key and without spending anybody's credits.

    python tools/test_nim_proxy.py            # listens on 127.0.0.1:8799
    NIM_URL=http://127.0.0.1:8799/v1/chat/completions \
        NIM_MODEL=test-model NVIDIA_API_KEY=test python tools/nim_proxy.py
"""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

SEEN = []


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *a):
        pass

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}")
        SEEN.append(body)
        if body.get("stream"):
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.end_headers()
            for part in [
                {"choices": [{"delta": {"content": "Hello "}}]},
                {"choices": [{"delta": {"content": "there"}}]},
                {"choices": [{"delta": {"tool_calls": [
                    {"index": 0, "id": "call_1", "function": {"name": "Read", "arguments": "{\"pa"}}]}}]},
                {"choices": [{"delta": {"tool_calls": [
                    {"index": 0, "function": {"arguments": "th\":\"a.txt\"}"}}]}}]},
                {"choices": [{"delta": {}, "finish_reason": "tool_calls"}]},
            ]:
                self.wfile.write(("data: %s\n\n" % json.dumps(part)).encode())
            self.wfile.write(b"data: [DONE]\n\n")
            self.wfile.flush()
            return
        payload = {
            "id": "chatcmpl-1",
            "choices": [{
                "message": {"role": "assistant", "content": "Hello there"},
                "finish_reason": "stop",
            }],
            "usage": {"prompt_tokens": 12, "completion_tokens": 3},
        }
        raw = json.dumps(payload).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 8799), Handler).serve_forever()
