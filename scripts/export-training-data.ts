/**
 * Dataset Engineering (Prisma V5.0)
 * DPO (Direct Preference Optimization) Export Script
 *
 * Parses traces from .prisma/traces/training_data.jsonl and outputs
 * chosen/rejected pairs in HuggingFace TRL format.
 * Includes basic deduplication, train/val split, and PII masking.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface TraceLog {
  session_id: string;
  agent_role: string;
  task_type: string;
  prompt_version: string;
  inputs: {
    system_prompt: string;
    user_prompt: string;
  };
  outputs: {
    reasoning_trace: string;
    code_draft: string;
  };
  feedback: {
    auditor_score: number;
    human_approval: boolean;
  };
  timestamp: string;
}

interface DPOPair {
  prompt: string;
  chosen: string;
  rejected: string;
}

const TRACES_FILE = path.join(process.cwd(), '.prisma', 'traces', 'training_data.jsonl');
const OUT_TRAIN = path.join(process.cwd(), '.prisma', 'dataset', 'dpo_train.jsonl');
const OUT_VAL = path.join(process.cwd(), '.prisma', 'dataset', 'dpo_val.jsonl');

// Simple mask for typical PII/Secrets
function maskPII(text: string): string {
  if (!text) return text;
  return text
    .replace(/(sk-[a-zA-Z0-9]{48})/g, '[REDACTED_API_KEY]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
}

function hashContent(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function generateDPODataset() {
  if (!fs.existsSync(TRACES_FILE)) {
    console.error(`[DPO Export] No traces found at ${TRACES_FILE}`);
    return;
  }

  const lines = fs.readFileSync(TRACES_FILE, 'utf-8').split('\n').filter(Boolean);
  const traces: TraceLog[] = lines.map((l) => JSON.parse(l));

  // Group by session_id to find rejected -> chosen evolutions
  const sessions = new Map<string, TraceLog[]>();
  for (const trace of traces) {
    if (!sessions.has(trace.session_id)) sessions.set(trace.session_id, []);
    sessions.get(trace.session_id)!.push(trace);
  }

  const pairs: DPOPair[] = [];
  const seenHashes = new Set<string>();

  for (const [sessionId, sessionTraces] of sessions.entries()) {
    // Sort by timestamp asc
    sessionTraces.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const rejected = sessionTraces.find((t) => t.feedback.auditor_score < 9.5);
    const chosen = sessionTraces.find((t) => t.feedback.auditor_score >= 9.5);

    if (rejected && chosen) {
      const prompt = `System: ${rejected.inputs.system_prompt}\n\nUser: ${rejected.inputs.user_prompt}`;
      const hashedPrompt = hashContent(prompt);

      // Deduplication
      if (seenHashes.has(hashedPrompt)) continue;
      seenHashes.add(hashedPrompt);

      pairs.push({
        prompt: maskPII(prompt),
        chosen: maskPII(chosen.outputs.code_draft),
        rejected: maskPII(rejected.outputs.code_draft),
      });
    }
  }

  console.log(`[DPO Export] Extracted ${pairs.length} valid DPO pairs.`);

  if (pairs.length === 0) {
    console.log('[DPO Export] Not enough data to generate splits.');
    return;
  }

  // Split 90% train / 10% val
  const splitIdx = Math.floor(pairs.length * 0.9);
  const train = pairs.slice(0, splitIdx);
  const val = pairs.slice(splitIdx);

  fs.mkdirSync(path.dirname(OUT_TRAIN), { recursive: true });

  const writeJsonl = (file: string, data: any[]) => {
    fs.writeFileSync(file, data.map((d) => JSON.stringify(d)).join('\n'));
  };

  writeJsonl(OUT_TRAIN, train);
  writeJsonl(OUT_VAL, val);

  console.log(`[DPO Export] Saved ${train.length} train pairs to ${OUT_TRAIN}`);
  console.log(`[DPO Export] Saved ${val.length} val pairs to ${OUT_VAL}`);
}

// CLI entry point
if (require.main === module) {
  generateDPODataset().catch(console.error);
}
