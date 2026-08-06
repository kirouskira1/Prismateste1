#!/bin/bash
# stop.sh — Clean Exit Guard
# Part of Prisma V5.0 Dual-Layer Hooks Architecture

echo "[Hook] Agent session ending."
echo "[Hook] Checking Session End Verification..."

# scripts/session-verifier.ts is TypeScript, not scripts/session-verifier.js —
# `node scripts/session-verifier.js` (the previous line here) could never run:
# that file doesn't exist and node cannot execute .ts directly.
# Advisory only: a failing verifier should not block the shell from exiting.
if command -v npx >/dev/null 2>&1; then
  npx --yes ts-node scripts/session-verifier.ts || echo "[Hook] Session End Verification reported issues (non-blocking)."
else
  echo "[Hook] npx not found — skipping Session End Verification."
fi

exit 0
