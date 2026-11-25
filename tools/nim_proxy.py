#!/usr/bin/env python3
"""Let Claude Code talk to NVIDIA's free models.

NVIDIA's hosted catalogue has no Claude models: `integrate.api.nvidia.com`
serves thirty open models and nothing from Anthropic. So Claude Code cannot
point at it directly - Claude Code speaks the Anthropic Messages API and NIM
speaks the OpenAI chat API. This is the small translator between them, and it
is what "the free Claude Code repo that redirects everything to the NVIDIA
server" actually is.

    python tools/nim_proxy.py            # listens on 127.0.0.1:8765
    ANTHROPIC_BASE_URL=http://127.0.0.1:8765 claude -p "..."

Anthropic requests in, OpenAI requests out, Anthropic responses back in. The
system prompt, the conversation, the tools and the tool calls all survive the
trip. Only the standard library, so a CI runner needs no pip install.

NVIDIA_API_KEY  the key from build.nvidia.com
NIM_MODEL       the model to serve (default: mistralai/mistral-large-4-1t-a52b)
NIM_HOST        the NIM host (default: integrate.api.nvidia.com)
PORT            the port to listen on (default: 8765)
"""
import json
import os
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = os.environ.get("NIM_HOST", "integrate.api.nvidia.com")
MODEL = os.environ.get("NIM_MODEL", "mistralai/mistral-large-4-1t-a52b")
PORT = int(os.environ.get("PORT", "8765"))
KEY = os.environ.get("NVIDIA_API_KEY", "")

# NIM_URL points the proxy at a different chat endpoint (a mock, for tests)
UPSTREAM = os.environ.get("NIM_URL", "https://%s/v1/chat/completions" % HOST)


def log(msg):
    print("[nim] " + msg, flush=True)


# --------------------------------------------------------------------------
# Anthropic request -> OpenAI request
# --------------------------------------------------------------------------
def split_system(req):
    """Anthropic keeps the system prompt outside the messages; OpenAI does not."""
    system = req.get("system")
    if isinstance(system, list):
        system = "\n\n".join(
            b.get("text", "") for b in system if isinstance(b, dict) and b.get("type") == "text"
        )
    return system or None


def to_openai_messages(req):
    """Anthropic messages -> OpenAI messages, carrying the tools across."""
    out = []
    system = split_system(req)
    if system:
        out.append({"role": "system", "content": system})

    for msg in req.get("messages", []):
        role = msg.get("role")
        content = msg.get("content")
        if isinstance(content, str):
            out.append({"role": role, "content": content})
            continue
        if not isinstance(content, list):
            out.append({"role": role, "content": ""})
            continue

        texts = []
        tool_calls = []
        for block in content:
            if not isinstance(block, dict):
                continue
            kind = block.get("type")
            if kind == "text":
                texts.append(block.get("text", ""))
            elif kind == "tool_use":
                tool_calls.append({
                    "id": block.get("id", ""),
                    "type": "function",
                    "function": {
                        "name": block.get("name", ""),
                        "arguments": json.dumps(block.get("input", {})),
                    },
                })
            elif kind == "tool_result":
                # a tool's answer is its own OpenAI message
                body = block.get("content")
                if isinstance(body, list):
                    body = "\n".join(
                        b.get("text", "") for b in body if isinstance(b, dict) and b.get("type") == "text"
                    )
                out.append({
                    "role": "tool",
                    "tool_call_id": block.get("tool_use_id", ""),
                    "content": body if isinstance(body, str) else json.dumps(body or ""),
                })

        if texts or tool_calls:
            # an empty string, not null: some servers reject a null content
            assistant = {"role": role, "content": "\n".join(texts) if texts else ""}
            if tool_calls:
                assistant["tool_calls"] = tool_calls
            out.append(assistant)
    return out


def to_openai_tools(req):
    tools = req.get("tools") or []
    out = []
    for t in tools:
        if not isinstance(t, dict) or "name" not in t:
            continue
        out.append({
            "type": "function",
            "function": {
                "name": t.get("name", ""),
                "description": t.get("description", "") or "",
                # some servers refuse a schema with no properties
                "parameters": t.get("input_schema") or {"type": "object", "properties": {}},
            },
        })
    return out


def build_openai_request(req):
    body = {
        "model": MODEL,
        "messages": to_openai_messages(req),
        "max_tokens": req.get("max_tokens", 4096),
        "stream": bool(req.get("stream")),
    }
    tools = to_openai_tools(req)
    if tools:
        body["tools"] = tools
    temp = req.get("temperature")
    if isinstance(temp, (int, float)):
        body["temperature"] = temp
    top_p = req.get("top_p")
    if isinstance(top_p, (int, float)):
        body["top_p"] = top_p
    stop = req.get("stop_sequences")
    if isinstance(stop, list) and stop:
        body["stop"] = stop[:4]
    return body


# --------------------------------------------------------------------------
# OpenAI response -> Anthropic response
# --------------------------------------------------------------------------
STOP_REASON = {
    "stop": "end_turn",
    "length": "max_tokens",
    "tool_calls": "tool_use",
    "function_call": "tool_use",
    "content_filter": "end_turn",
}


def to_anthropic_message(resp, model):
    choice = (resp.get("choices") or [{}])[0]
    msg = choice.get("message") or {}
    content = []

    text = msg.get("content")
    if isinstance(text, list):  # some servers send content as parts
        text = "".join(p.get("text", "") for p in text if isinstance(p, dict))
    if text:
        content.append({"type": "text", "text": text})

    for call in msg.get("tool_calls") or []:
        fn = call.get("function") or {}
        raw = fn.get("arguments") or "{}"
        try:
            args = json.loads(raw) if isinstance(raw, str) else raw
        except ValueError:
            args = {"_raw": raw}
        content.append({
            "type": "tool_use",
            "id": call.get("id", ""),
            "name": fn.get("name", ""),
            "input": args if isinstance(args, dict) else {"_raw": args},
        })

    usage = resp.get("usage") or {}
    return {
        "id": "msg_" + os.urandom(8).hex(),
        "type": "message",
        "role": "assistant",
        "model": model,
        "content": content,
        "stop_reason": STOP_REASON.get(choice.get("finish_reason"), "end_turn"),
        "stop_sequence": None,
        "usage": {
            "input_tokens": usage.get("prompt_tokens", 0),
            "output_tokens": usage.get("completion_tokens", 0),
        },
    }


# --------------------------------------------------------------------------
# the server
# --------------------------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        pass

    def _send_json(self, code, obj):
        raw = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _error(self, code, message):
        self._send_json(code, {"error": {"message": message, "type": "api_error"}})

    def do_GET(self):
        if self.path.rstrip("/") == "/v1/models":
            self._send_json(200, {"data": [{"id": MODEL, "type": "model"}], "has_more": False})
            return
        self._error(404, "not found")

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            req = json.loads(raw or b"{}")
        except ValueError:
            self._error(400, "the request was not JSON")
            return

        path = self.path.split("?")[0].rstrip("/")

        if path == "/v1/messages/count_tokens":
            # Claude Code asks for the size of a prompt; an estimate is enough
            text = json.dumps(req.get("messages", []))
            self._send_json(200, {"input_tokens": max(1, len(text) // 4)})
            return

        if path != "/v1/messages":
            self._error(404, "not found")
            return

        if not KEY:
            self._error(500, "NVIDIA_API_KEY is not set")
            return

        body = build_openai_request(req)
        data = json.dumps(body).encode("utf-8")
        up = urllib.request.Request(
            UPSTREAM,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + KEY,
                "Accept": "text/event-stream" if body["stream"] else "application/json",
            },
        )

        try:
            resp = urllib.request.urlopen(up, timeout=300)
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")[:800]
            log("upstream said %s: %s" % (e.code, detail))
            self._error(e.code, "the model said no: " + detail)
            return
        except Exception as e:  # noqa: BLE001 - the CLI needs the reason
            log("upstream is unreachable: %s" % e)
            self._error(502, "the model is unreachable: %s" % e)
            return

        if body["stream"]:
            self._stream(resp)
        else:
            raw_out = resp.read()
            try:
                parsed = json.loads(raw_out)
            except ValueError:
                self._error(502, "the model answered with something that is not JSON")
                return
            self._send_json(200, to_anthropic_message(parsed, MODEL))

    # ---- streaming ------------------------------------------------------
    def _stream(self, resp):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "close")
        self.end_headers()

        blocks = []       # open content blocks, in order
        index_of = {}     # tool call id -> content block index
        pending = {}      # openai tool call index -> {"id","name","args"}
        out_tokens = 0

        def event(name, data):
            self.wfile.write(("event: %s\ndata: %s\n\n" % (name, json.dumps(data))).encode("utf-8"))
            self.wfile.flush()

        event("message_start", {
            "type": "message_start",
            "message": {
                "id": "msg_" + os.urandom(8).hex(),
                "type": "message",
                "role": "assistant",
                "model": MODEL,
                "content": [],
                "stop_reason": None,
                "stop_sequence": None,
                "usage": {"input_tokens": 0, "output_tokens": 0},
            },
        })

        for raw in resp:
            line = raw.decode("utf-8", "replace").strip()
            if not line.startswith("data:"):
                continue
            chunk = line[5:].strip()
            if chunk == "[DONE]":
                break
            try:
                parsed = json.loads(chunk)
            except ValueError:
                continue

            usage = parsed.get("usage") or {}
            out_tokens = usage.get("completion_tokens", out_tokens)
            choices = parsed.get("choices") or []
            if not choices:
                continue
            delta = choices[0].get("delta") or {}

            text = delta.get("content")
            if text:
                if not blocks:
                    index = 0
                    blocks.append("text")
                    event("content_block_start", {
                        "type": "content_block_start",
                        "index": index,
                        "content_block": {"type": "text", "text": ""},
                    })
                event("content_block_delta", {
                    "type": "content_block_delta",
                    "index": 0,
                    "delta": {"type": "text_delta", "text": text},
                })

            for call in delta.get("tool_calls") or []:
                slot = call.get("index", 0)
                info = pending.setdefault(slot, {"id": "", "name": "", "args": ""})
                fn = call.get("function") or {}
                if call.get("id"):
                    info["id"] = call["id"]
                if fn.get("name"):
                    info["name"] = fn["name"]
                if fn.get("arguments"):
                    info["args"] += fn["arguments"]
                if info["id"] not in index_of:
                    # open the tool block the first time we see its id
                    index = len(blocks)
                    blocks.append("tool")
                    index_of[info["id"]] = index
                    event("content_block_start", {
                        "type": "content_block_start",
                        "index": index,
                        "content_block": {
                            "type": "tool_use",
                            "id": info["id"],
                            "name": info["name"],
                            "input": {},
                        },
                    })
                if fn.get("arguments"):
                    event("content_block_delta", {
                        "type": "content_block_delta",
                        "index": index_of[info["id"]],
                        "delta": {"type": "input_json_delta", "partial_json": fn["arguments"]},
                    })

        stop = "end_turn"
        if pending:
            stop = "tool_use"
        for index in range(len(blocks)):
            event("content_block_stop", {"type": "content_block_stop", "index": index})
        event("message_delta", {
            "type": "message_delta",
            "delta": {"stop_reason": stop, "stop_sequence": None},
            "usage": {"output_tokens": out_tokens},
        })
        event("message_stop", {"type": "message_stop"})


def main():
    if not KEY:
        print("NVIDIA_API_KEY is not set: nothing to talk to", file=sys.stderr)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    log("serving %s at http://127.0.0.1:%d" % (MODEL, PORT))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
