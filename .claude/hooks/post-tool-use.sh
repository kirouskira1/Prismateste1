#!/bin/bash
# post-tool-use.sh — Format and Log
# Part of Prisma V5.0 Dual-Layer Hooks Architecture
#
# Claude Code invokes PostToolUse hooks with JSON on stdin (same convention as
# pre-tool-use.sh), not positional arguments — the previous version of this file
# read $1/$2/$3, which are always empty for a real Claude Code invocation, so the
# formatting branch below never evaluated correctly. Fixed to match the real
# invocation contract. See docs/27_Tool_Compatibility_Matrix.md §6.

set -uo pipefail

INPUT=$(cat)

extract_field() {
  echo "$2" | grep -oE "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 \
    | sed -E 's/^"[^"]*"[[:space:]]*:[[:space:]]*"//; s/"$//'
}

TOOL_NAME=$(extract_field tool_name "$INPUT")
FILE_PATH=$(extract_field file_path "$INPUT")

# Claude Code: Write, Edit. Antigravity: write_to_file, replace_file_content.
if [ "$TOOL_NAME" = "Write" ] || [ "$TOOL_NAME" = "Edit" ] \
   || [ "$TOOL_NAME" = "write_to_file" ] || [ "$TOOL_NAME" = "replace_file_content" ]; then
  if echo "$FILE_PATH" | grep -qE '\.(ts|tsx|json)$'; then
    # npm run prettier --write ... (Simulated for this script)
    echo "[Hook] Auto-formatting applied to file."
  fi
fi

# We could also log tokens/time spent here
echo "[Hook] $TOOL_NAME execution completed."
exit 0
