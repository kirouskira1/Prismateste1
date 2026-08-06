# Prompt Versioning Protocol

**Classification:** REFERENCE  
**Codename:** `Prompt_Versioning`  
**Version:** V5.0 (Harness Engineering Layer)  
**Context Layer:** Always (Quality Assurance Infrastructure)  
**Est. Tokens:** ~500 tokens  

---

## 1. Purpose

When prompts change — whether by human editing, Evolutionary Optimizer (doc 16) promotion, or agent refinement — the system MUST track what changed, when, by whom, and what the quality impact was. Without versioning, a "small tweak" to a Worker prompt can silently degrade Server Action quality while improving RLS quality, and nobody notices until production breaks.

**Why this matters:**
- Without versions: You change a prompt, scores drop, and you have no way to revert.
- Without performance snapshots: You can't correlate prompt changes with quality shifts.
- Without auto-rollback: Degradation accumulates silently across sessions.

---

## 2. Version Structure

### 2.1 Core Interface

```typescript
/**
 * PromptVersion: Tracks a single version of a single prompt in the system.
 * 
 * WHY each field exists:
 * - prompt_id: Human-readable identifier for the prompt (e.g., "worker_system_v4.5").
 *   Uniquely identifies WHICH prompt this version belongs to.
 * - content_hash: SHA-256 hash of the prompt content. Enables fast equality checks
 *   without comparing full text. Two identical prompts = same hash, guaranteed.
 * - semver: Semantic version following standard convention:
 *   MAJOR = complete rewrite (different reasoning strategy)
 *   MINOR = adjusted wording (same strategy, refined phrasing)
 *   PATCH = typo fix or whitespace change
 * - created_at: ISO-8601 timestamp for chronological ordering.
 * - author: WHO made the change. Critical for attribution:
 *   "human" = developer manually edited the prompt
 *   "optimizer" = Evolutionary Optimizer (doc 16) promoted a challenger
 * - parent_hash: SHA-256 hash of the PREVIOUS version. Creates a linked list
 *   of versions for rollback traversal. null = first ever version.
 * - performance_snapshot: Quality metrics AT THE TIME of version creation.
 *   Used to detect regression: if current metrics are worse than parent's
 *   snapshot, the change may have degraded quality.
 */
interface PromptVersion {
  prompt_id: string;
  content_hash: string;           // SHA-256 of prompt content
  semver: string;                 // "1.0.0" → "1.1.0" → "2.0.0"
  created_at: string;             // ISO-8601
  author: "human" | "optimizer";
  parent_hash: string | null;     // null = first version (no parent)
  change_description: string;     // WHY the change was made (mandatory, non-empty)
  performance_snapshot: {
    avg_quality_score: number;    // Average Auditor score across recent tasks
    first_pass_rate: number;      // % of tasks passing audit on first attempt
    sample_size: number;          // How many tasks were used for these metrics
    kill_switch_rate: number;     // % of tasks that triggered K1-K6 (should be ~0%)
  };
}
```

### 2.2 Storage

**File:** `.prisma/prompt_versions.jsonl`  
**Format:** JSON Lines (one JSON object per line, append-only)

```jsonl
{"prompt_id":"worker_system","content_hash":"a1b2c3d4...","semver":"1.0.0","created_at":"2026-07-21T03:00:00Z","author":"human","parent_hash":null,"change_description":"Initial V4.5 worker system prompt","performance_snapshot":{"avg_quality_score":9.6,"first_pass_rate":0.62,"sample_size":50,"kill_switch_rate":0.02}}
{"prompt_id":"worker_system","content_hash":"e5f6g7h8...","semver":"1.1.0","created_at":"2026-07-22T10:00:00Z","author":"optimizer","parent_hash":"a1b2c3d4...","change_description":"Optimizer challenger won: added explicit Zod validation reminder to reduce Zod-related rejections","performance_snapshot":{"avg_quality_score":9.7,"first_pass_rate":0.68,"sample_size":30,"kill_switch_rate":0.01}}
```

**Why JSONL, not a database table?**
- Prompts are used at BUILD TIME by the agent system, not at RUNTIME by the application.
- JSONL is human-readable, git-diffable, and requires zero database infrastructure.
- Append-only semantics prevent accidental overwrites (you can only ADD versions, never DELETE).
- If needed in the future, JSONL can be trivially imported into `audit_logs` for dashboard visualization.

---

## 3. Regression Detection & Auto-Rollback

### 3.1 Detection Algorithm

```typescript
/**
 * Regression Detection: Compares current performance against parent version.
 * 
 * Runs automatically:
 * - After every 5 tasks completed with the new prompt version
 * - Triggered by the Orchestrator's afterAction hook (Sprint 3, Tarefa 3.2)
 * 
 * WHY the thresholds:
 * - 0.5 point drop in avg_quality_score is significant (e.g., 9.6 → 9.1)
 * - 5 tasks minimum sample prevents false positives from statistical noise
 * - kill_switch_rate increase of ANY amount is critical (K1-K6 are zero-tolerance)
 */
interface RegressionCheck {
  current_version: PromptVersion;
  parent_version: PromptVersion;
  current_metrics: PerformanceSnapshot;

  // Regression is detected if ANY of these conditions is true:
  is_regression: boolean;
  reasons: RegressionReason[];
}

type RegressionReason =
  | "QUALITY_DROP"         // avg_quality_score dropped > 0.5 points
  | "FIRST_PASS_DECLINE"   // first_pass_rate dropped > 10 percentage points
  | "KILL_SWITCH_SPIKE";   // kill_switch_rate increased above parent's rate
```

### 3.2 Auto-Rollback Protocol

```
IF regression detected AND current_version.author === "optimizer"
THEN
  1. REVERT prompt content to parent_hash version
  2. LOG rollback event in SHIFT_LOG.md:
     "⚠️ AUTO-ROLLBACK: Prompt '{prompt_id}' reverted from {semver} to {parent_semver}.
      Reason: {reasons}. avg_quality_score dropped from {parent_score} to {current_score}
      over {sample_size} tasks."
  3. EMIT INCIDENT_BRIEFING to Watcher with domain: "QUALITY"
  4. MARK the reverted version in JSONL with flag: "reverted": true
  5. BLOCK the Evolutionary Optimizer from re-promoting the same challenger
     (content_hash is added to a blacklist in prisma.config.json)

IF regression detected AND current_version.author === "human"
THEN
  1. Do NOT auto-rollback (human changes require human decision to revert)
  2. EMIT WATCHER_ALERT to human:
     "⚠️ REGRESSION DETECTED: Your manual change to prompt '{prompt_id}' (v{semver})
      has decreased avg_quality_score from {parent_score} to {current_score}.
      Consider reverting. Run: prisma prompt rollback {prompt_id}"
  3. LOG warning in SHIFT_LOG.md
```

### 3.3 Real-World Scenario

```
SCENARIO: "O prompt do Worker foi ajustado para melhorar RLS"

1. Pedro edits the Worker system prompt to add emphasis on RLS checks.
   → New version: worker_system v1.2.0, author: "human"
   → Parent snapshot: avg_score=9.6, first_pass=62%, kill_switch=2%

2. Over the next 8 tasks:
   - 3 RLS tasks: avg score 9.8 (↑ improved!)
   - 5 Server Action tasks: avg score 8.9 (↓ degraded!)
   - Combined: avg score 9.2, first_pass=50%, kill_switch=3%

3. After task #5, regression check fires:
   - avg_quality_score: 9.2 vs parent 9.6 → DROP of 0.4 (borderline)
   - After task #8: avg_quality_score still 9.2 → DROP confirmed at 0.4 < 0.5
   - first_pass_rate: 50% vs parent 62% → DROP of 12pp > 10pp threshold
   - Regression reason: FIRST_PASS_DECLINE

4. Since author === "human":
   → WATCHER_ALERT sent to Pedro:
     "Your change to worker_system v1.2.0 improved RLS scores (+0.2)
      but degraded Server Action scores (-0.7). First-pass rate dropped 12pp.
      Consider creating separate prompts for RLS vs Server Action contexts,
      or revert with: prisma prompt rollback worker_system"
```

---

## 4. Evolutionary Optimizer Integration

Reference: `16_Evolutionary_Optimizer_Spec.md`

The Optimizer's A/B testing workflow is enhanced with mandatory versioning:

```
BEFORE promoting a challenger prompt:
  1. Optimizer MUST create a PromptVersion entry for the challenger
  2. performance_snapshot MUST contain metrics from the A/B test (not estimates)
  3. sample_size MUST be ≥ 10 tasks (statistical significance)
  4. content_hash of challenger MUST NOT be in the rollback blacklist

AFTER promoting:
  1. Parent prompt is preserved in JSONL (never deleted)
  2. Regression monitoring activates immediately for the new version
  3. If regression detected within 10 tasks → auto-rollback (see §3.2)
```

---

## 5. CLI Commands (Future)

```bash
# List all versions of a prompt
prisma prompt history worker_system

# Compare two versions
prisma prompt diff worker_system 1.0.0 1.2.0

# Rollback to a specific version
prisma prompt rollback worker_system 1.1.0

# View current regression status
prisma prompt status
```

---

## 6. Kernel Version vs. Individual Prompt semver

This protocol's `semver` field (§2.1) tracks the version of **one prompt** (e.g. `worker_system` going `1.0.0` → `1.2.0`) — it is independent from the **Prisma Kernel version** (`/VERSION` at repo root, currently `5.0.0`), which tracks the whole agent framework across all specs, configs, and prompts at once.

- Never assume the two numbers move together. A prompt at `semver: "1.0.0"` can exist under Kernel `5.0.0`.
- Historical changelog entries (e.g. `"change_description":"Initial V4.5 worker system prompt"` in §3's examples) legitimately reference old Kernel versions — that is the intended use of this protocol and must never be "corrected" to the current Kernel version, or the audit trail becomes meaningless.
- Any **non-historical** prose claiming the system currently runs on `V4.1`–`V4.5` is drift, not a valid changelog entry. Run `npm run check:version` (`scripts/version-consistency-check.ts`) to catch it — see `docs/26_Version_Unification_Plan.md` for the full migration record and `docs/25_Headless_CI_Spec.md` §3.5 for the CI gate.

---

*Prompt Versioning Protocol generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*
