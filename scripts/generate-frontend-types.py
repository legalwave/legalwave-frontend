#!/usr/bin/env python3
"""Generate the frontend's API types from the backend's OpenAPI spec.

`src/shared/api/types.ts` used to be hand-written from the prose in
`aidlc-docs/inception/api-contract.md`. TypeScript types are erased at
runtime, so nothing checked that the hand-written types still matched what the
backend actually returns — the two could drift silently until a bug.

This script derives the types from `openapi.json` instead, which the backend
generates from its own route declarations. The chain is now:

    backend/app/routes.py  ->  openapi.json  ->  src/shared/api/types.ts

with a CI check at each link, so a change on one side cannot silently diverge
from the other.

Usage
-----
    python3 scripts/generate-frontend-types.py            # write types.ts
    python3 scripts/generate-frontend-types.py --check    # fail if it is stale

The spec is located in one of these places, in order:
  1. ../backend/openapi.json          (the monorepo layout)
  2. ../../legalwave-docs/openapi.json (the split-repo layout)

Exit code 0 = the file is current (or was written). 1 = it is stale.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

FRONTEND = Path(__file__).resolve().parent.parent
REPO = FRONTEND.parent

OUTPUT = FRONTEND / "src" / "shared" / "api" / "types.ts"

SPEC_CANDIDATES = (
    REPO / "backend" / "openapi.json",
    REPO.parent / "legalwave-docs" / "openapi.json",
)

HEADER = """\
// GENERATED FILE — DO NOT EDIT BY HAND.
//
// Derived from the backend's OpenAPI spec by `scripts/generate-frontend-types.py`.
// To change an API type, change the backend's route declaration or
// `backend/app/schemas.py`, then regenerate:
//
//     uv run python backend/scripts/export-openapi.py
//     python3 frontend/scripts/generate-frontend-types.py
//
// CI fails if this file is stale. Editing it directly will be overwritten.
//
"""

#: The backend's schema names, mapped to the names the frontend already uses.
#: Renaming here keeps every call site in the frontend unchanged.
RENAMES = {
    "UserOut": "User",
    "ApiKeyOut": "ApiKey",
    "MessageOut": "ApiMessage",
    "AttachmentOut": "Attachment",
    "LawArticle": "Article",
    "RegisterIn": "RegisterPayload",
    "LoginIn": "LoginPayload",
}

#: FastAPI's own error shapes and the multipart request body are not part of
#: the frontend's public API surface — the frontend never constructs a
#: ValidationError or reads an HTTPValidationError.
SKIP = {
    "HTTPValidationError",
    "ValidationError",
    "Body_stream_chat_api_chats_stream_post",
}


def find_spec() -> Path:
    for candidate in SPEC_CANDIDATES:
        if candidate.exists():
            return candidate
    print("FAIL  Could not find openapi.json. Looked in:")
    for candidate in SPEC_CANDIDATES:
        print(f"        {candidate}")
    print("      Run: uv run python backend/scripts/export-openapi.py")
    raise SystemExit(1)


# --------------------------------------------------------------------------
# JSON Schema -> TypeScript
# --------------------------------------------------------------------------

def ts_type(schema: dict) -> str:
    """Render one JSON Schema node as a TypeScript type."""
    if not isinstance(schema, dict):
        return "unknown"

    ref = schema.get("$ref")
    if ref:
        return RENAMES.get(ref.rsplit("/", 1)[-1], ref.rsplit("/", 1)[-1])

    for key in ("anyOf", "oneOf"):
        if key in schema:
            parts = [ts_type(s) for s in schema[key]]
            return " | ".join(dict.fromkeys(parts))

    if "allOf" in schema:
        return " & ".join(ts_type(s) for s in schema["allOf"])

    if "enum" in schema:
        return " | ".join(json.dumps(v) for v in schema["enum"])

    raw_type = schema.get("type")

    if raw_type == "array":
        return f"{ts_type(schema.get('items', {}))}[]"

    if raw_type == "object" or "properties" in schema:
        return render_object(schema)

    if raw_type in ("integer", "number"):
        return "number"

    if raw_type == "boolean":
        return "boolean"

    if raw_type == "null":
        return "null"

    if raw_type == "string":
        return "string"

    return "unknown"


def render_object(schema: dict) -> str:
    """Render an object schema as an inline object type."""
    props = schema.get("properties", {})
    required = set(schema.get("required", []))
    additional = schema.get("additionalProperties", True)

    # A free-form object (no declared properties) accepts anything.
    if not props and additional is not False:
        return "Record<string, unknown>"

    lines = []
    for name, sub in sorted(props.items()):
        rendered = ts_type(sub)
        optional = name not in required
        if optional and "null" not in rendered and "undefined" not in rendered:
            rendered = f"{rendered} | undefined"
        lines.append(f"{name}{'?' if optional else ''}: {rendered}")

    if not lines:
        return "Record<string, never>"

    return "{ " + "; ".join(lines) + " }"


def render_interface(name: str, schema: dict) -> str:
    """Render one named object schema as an exported interface."""
    props = schema.get("properties", {})
    required = set(schema.get("required", []))

    lines = []
    for prop, sub in sorted(props.items()):
        rendered = ts_type(sub)
        optional = prop not in required
        if optional and "null" not in rendered and "undefined" not in rendered:
            rendered = f"{rendered} | null"
        lines.append(f"  {prop}{'?' if optional else ''}: {rendered}")

    if not lines:
        return f"export interface {name} {{\n  [key: string]: never\n}}"

    return f"export interface {name} {{\n" + "\n".join(lines) + "\n}"


def render_named(name: str, schema: dict) -> str:
    if schema.get("type") == "object" or "properties" in schema:
        return render_interface(name, schema)
    return f"export type {name} = {ts_type(schema)}"


def build_types(spec: dict) -> str:
    schemas = spec.get("components", {}).get("schemas", {})
    stream = spec.get("x-stream-events", {})
    events = stream.get("events", [])

    lines = [HEADER]

    # --- the response models ---
    for name in sorted(schemas):
        if name in SKIP:
            continue
        lines.append(render_named(RENAMES.get(name, name), schemas[name]))
        lines.append("")

    # --- the stream's own models (StreamCitation and friends) ---
    #
    # These are referenced by the stream events but live outside
    # `components/schemas`, because FastAPI cannot describe an NDJSON stream.
    # They are declared in the backend's `app/schemas.py` and serialised into
    # the spec's `x-stream-events` extension, so they are read from there.
    for name, schema in sorted(stream.get("models", {}).items()):
        lines.append(render_named(RENAMES.get(name, name), schema))
        lines.append("")

    # --- the stream ---
    lines.extend(render_stream(events))

    return "\n".join(lines).rstrip() + "\n"


def render_stream(events: list[dict]) -> list[str]:
    """Render the NDJSON stream events as a discriminated union."""
    if not events:
        return []

    lines = [
        "// ---- streaming ----",
        "//",
        "// The NDJSON stream from POST /api/chats/stream. One JSON object per",
        "// line, discriminated by `type`. The final member is an open catch-all:",
        "// the frontend must tolerate event types it does not know, because the",
        "// backend may add one without a frontend release.",
        "",
        "export type StreamEvent =",
    ]

    members = []
    for event in events:
        props = event.get("properties", {})
        event_type = props.get("type", {}).get("const")
        if not event_type:
            continue

        fields = []
        for prop, sub in sorted(props.items()):
            if prop == "type":
                continue
            fields.append(f"{prop}: {ts_type(sub)}")

        body = "; ".join(fields)
        members.append(f"  | {{ type: '{event_type}'" + (f"; {body}" if body else "") + " }")

    lines.extend(members)
    lines.append("  | { type: string; [k: string]: unknown }")
    lines.append("")
    return lines


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="fail instead of writing when the committed types are out of date",
    )
    args = parser.parse_args()

    spec_path = find_spec()
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    text = build_types(spec)

    if not args.check:
        OUTPUT.write_text(text, encoding="utf-8")
        print(f"wrote {OUTPUT.relative_to(FRONTEND)}  (from {spec_path})")
        return 0

    if not OUTPUT.exists():
        print(f"FAIL  {OUTPUT.name} does not exist — run: python3 scripts/generate-frontend-types.py")
        return 1

    current = OUTPUT.read_text(encoding="utf-8")
    if current == text:
        print(f"OK    {OUTPUT.name} is current")
        return 0

    print(f"FAIL  {OUTPUT.name} is stale — the API changed but the types were not regenerated.")
    print("      Run: python3 scripts/generate-frontend-types.py")
    return 1


if __name__ == "__main__":
    sys.exit(main())
