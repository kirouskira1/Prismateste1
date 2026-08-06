#!/bin/bash
# pre-tool-use.sh — Deterministic guard (zero LLM tokens spent)
# Part of Prisma V5.0 Dual-Layer Hooks Architecture
#
# Claude Code hooks receive tool input as JSON on stdin. This file only ever runs
# inside Claude Code (Antigravity does not read .claude/settings.json), so the
# REAL Claude Code tool names (Write, Edit, Bash) are the primary check. The old
# Antigravity names are kept as a secondary fallback only, per
# docs/27_Tool_Compatibility_Matrix.md §6.

set -uo pipefail

# Read the full JSON input from stdin
INPUT=$(cat)

# Tolerant extractor: matches `"key":"value"` or `"key": "value"`.
# Always succeeds (empty string on no match) so a missing/optional field never
# aborts this script — a plain `grep -o | cut` pipeline under `pipefail` would.
extract_field() {
  echo "$2" | grep -oE "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 \
    | sed -E 's/^"[^"]*"[[:space:]]*:[[:space:]]*"//; s/"$//'
}

TOOL_NAME=$(extract_field tool_name "$INPUT")

# --- Guard 1: Block destructive shell commands ---
# Claude Code: Bash. Antigravity: run_command.
if [ "$TOOL_NAME" = "Bash" ] || [ "$TOOL_NAME" = "run_command" ]; then
  COMMAND=$(extract_field command "$INPUT")
  if echo "$COMMAND" | grep -qE 'rm -rf|DROP TABLE|DROP DATABASE|TRUNCATE'; then
    echo "BLOCKED: Destructive command detected. Manual override required." >&2
    exit 2
  fi
fi

# --- Guard 2 & 3: content-bearing tools ---
# Claude Code: Write (full content) and Edit (old_string/new_string, no `content` key).
# Antigravity: write_to_file / create_file / replace_file_content.
if [ "$TOOL_NAME" = "Write" ] || [ "$TOOL_NAME" = "Edit" ] \
   || [ "$TOOL_NAME" = "write_to_file" ] || [ "$TOOL_NAME" = "create_file" ] \
   || [ "$TOOL_NAME" = "replace_file_content" ]; then
  FILE_PATH=$(extract_field file_path "$INPUT")
  CONTENT=$(extract_field content "$INPUT")
  if [ -z "$CONTENT" ]; then
    # Edit calls have no `content` field — inspect what's actually being written instead.
    CONTENT=$(extract_field new_string "$INPUT")
  fi

  # --- Guard 2: SQL files must contain ENABLE ROW LEVEL SECURITY ---
  if echo "$FILE_PATH" | grep -qE '\.sql$'; then
    if echo "$CONTENT" | grep -qi 'CREATE TABLE'; then
      if ! echo "$CONTENT" | grep -qi 'ENABLE ROW LEVEL SECURITY'; then
        echo "BLOCKED: SQL file creates tables without ENABLE ROW LEVEL SECURITY." >&2
        exit 2
      fi
    fi
  fi

  # --- Guard 3: Server Actions must contain "use server" ---
  if echo "$FILE_PATH" | grep -qE 'src/actions/.*\.ts$'; then
    if ! echo "$CONTENT" | grep -q 'use server'; then
      echo "BLOCKED: Server Action file must contain 'use server' directive." >&2
      exit 2
    fi
  fi
fi

exit 0
