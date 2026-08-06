#!/bin/bash
# run.sh — Prisma Headless Loop Runner
# Usage: ./run.sh --briefing ./briefing.json --output ./output/

set -e

BRIEFING=""
OUTPUT_DIR="./output"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --briefing) BRIEFING="$2"; shift ;;
        --output) OUTPUT_DIR="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

if [ -z "$BRIEFING" ]; then
    echo "❌ Missing --briefing parameter."
    exit 1
fi

if [ ! -f "$BRIEFING" ]; then
    echo "❌ Briefing file not found: $BRIEFING"
    exit 1
fi

echo "🚀 Starting Headless Runner with briefing $BRIEFING..."
mkdir -p "$OUTPUT_DIR"

# Ensure env is loaded
if [ -f .env.local ]; then
    source .env.local
fi

# Run the TypeScript headless runner
npx ts-node scripts/headless-runner.ts --briefing "$BRIEFING" --output "$OUTPUT_DIR"
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Prisma Headless Run completed successfully."
elif [ $EXIT_CODE -eq 1 ]; then
    echo "⚠️ Prisma Headless Run finished, but Eval failed or regression detected."
else
    echo "❌ Prisma Headless Run failed with a fatal error."
fi

exit $EXIT_CODE
