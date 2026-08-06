# Headless CI & Bootstrap Specification

**Classification:** REFERENCE  
**Codename:** `Headless_CI`  
**Version:** V5.0 (Harness Engineering Layer)  
**Context Layer:** CI/CD & Operations  
**Est. Tokens:** ~600 tokens  

---

## 1. Purpose

Prisma V5.0 is designed to operate autonomously outside of an IDE. The Headless CI mode allows the agent swarm to run inside GitHub Actions or any server environment to continuously audit, generate, and evaluate code based on JSON briefings.

**Why this matters:**
- Scaling: You can't scale AI engineers if they require a human clicking "Approve" in an IDE for every step.
- Automation: Allows the system to react to Webhooks (e.g., Jira ticket created -> Agent generates PR).

---

## 2. One-Line Bootstrap

To ensure zero-friction onboarding for new developers and CI servers, the entire environment can be provisioned with a single command.

### 2.1 `install.sh`
A bash script that:
1. Validates prerequisites (Node 20+, npm, git).
2. Runs `npm ci` to install dependencies.
3. Ensures `.env.local` exists (copies from `.env.example` if missing).
4. Runs the `eval` suite to verify the baseline integrity of the Prompts.

---

## 3. The Headless Runner

> **Current implementation status:** `scripts/headless-runner.ts` now calls the real
> `EvalRunner` (`scripts/eval-runner.ts`) and exits non-zero on a genuine failed check — it no
> longer has a hard-coded `mockEvalPass = true`. What is still a placeholder is the *generation*
> step itself: there is no live Orchestrator/Worker LLM call wired into this repo yet, so the
> "generated code" the eval runs against is a static stub, not a real agent response. Treat this
> pipeline today as a structural smoke test of the CI wiring (briefing parsing → output file →
> real eval verdict → correct exit code), not yet a quality gate on real generated code.

### 3.1 `run.sh`
The entry point for executing tasks. It wraps the Node.js runner to provide a standard CLI interface.

**Usage:**
```bash
./run.sh --briefing ./task.json --output ./out/
```

### 3.2 `scripts/headless-runner.ts`
The core TypeScript loop that:
1. Parses the briefing JSON.
2. Initializes the `Orchestrator` agent.
3. Feeds the task into the TRM Loop.
4. Outputs the generated artifacts to the designated folder.
5. Automatically runs `eval-runner.ts` on the output to ensure quality before returning an exit code.

**Exit Codes:**
- `0`: Success (Task completed, Score >= 9.5).
- `1`: Eval Failed (Task completed, but regression detected or score < 9.5).
- `2`: Fatal Error (API limit, invalid config, network failure).

---

## 3.5 Version Consistency Gate

`scripts/version-consistency-check.ts` (`npm run check:version`) scans every `.md`/`.json`/`.js`/`.ts`/`.yaml` file in the repo for **active** claims of running a stale Kernel version (`V4.1`–`V4.5`), comparing against the canonical `/VERSION` file. It intentionally ignores `compilation_target` values (`"V3.1"` | `"V4"` | `"HYBRID"` — a fixed architecture-profile enum, unrelated to Kernel version) and lines explicitly marked historical (`legacy`, `Historical`, `Nota histórica`). See `docs/26_Version_Unification_Plan.md` for the full rationale.

This runs as a required step in `.github/workflows/main.yml`, right after lint — cheap enough to fail fast before the test/eval suites run.

---

## 4. GitHub Actions Workflow

The pipeline is defined in `.github/workflows/prisma-headless.yml`.

**Secrets Required:**
- `ANTHROPIC_API_KEY`: For the TRM Loop.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: For RLS and pgvector RAG.

**Triggers:**
Can be triggered manually (`workflow_dispatch`) with a JSON briefing payload, or via API (e.g., from a project management tool webhook).

---

*Specification generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*
