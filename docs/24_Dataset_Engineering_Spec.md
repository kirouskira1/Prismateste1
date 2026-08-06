# Dataset Engineering & DPO Pipeline

**Classification:** REFERENCE  
**Codename:** `Dataset_Engineering`  
**Version:** V5.0 (Harness Engineering Layer)  
**Context Layer:** Continuous Learning / Post-Production  
**Est. Tokens:** ~800 tokens  

---

## 1. Purpose

Prisma V5.0 moves beyond zero-shot or few-shot prompting. To continuously improve the TRM Worker and Auditor agents, we must collect high-quality interaction traces in production and convert them into datasets for **Direct Preference Optimization (DPO)** or Supervised Fine-Tuning (SFT).

**Why this matters:**
- Over time, we want smaller, faster models (e.g., Llama 3 8B or Gemma 7B) to perform the tasks that currently require Claude 3.5 Sonnet. This is only possible with a proprietary dataset of *Golden Traces*.

---

## 2. Trace Collection Pipeline

Every time an agent executes a task, the Orchestrator (via `afterAction` hooks) captures the telemetry and trace data.

### 2.1 Trace Schema (JSONL)

Traces are appended to `.prisma/traces/training_data.jsonl`.

```json
{
  "session_id": "uuid-1234",
  "agent_role": "TRM_WORKER",
  "task_type": "SERVER_ACTION",
  "prompt_version": "v4.5.1",
  "inputs": {
    "system_prompt": "...",
    "user_prompt": "Create a Server Action to update user profile..."
  },
  "outputs": {
    "reasoning_trace": "<thought>...</thought>",
    "code_draft": "export const updateProfile = ..."
  },
  "feedback": {
    "auditor_score": 9.8,
    "auditor_violations": [],
    "human_approval": true
  },
  "timestamp": "2026-07-21T03:00:00Z"
}
```

### 2.2 Quality Filtering (The "Golden" Filter)

Not all traces are useful for training. The pipeline filters traces based on the following criteria:

- **Score >= 9.5:** Traces that were approved by the Auditor on the first attempt (Zero-Shot Success). These are positive examples (Chosen).
- **Score < 9.5:** Traces that failed the audit. These serve as negative examples (Rejected) for DPO.
- **Human Escalated & Fixed:** Traces where a human intervened, provided the fix, and approved. The human's final code becomes the positive example (Chosen), and the agent's draft becomes the negative example (Rejected).

---

## 3. Direct Preference Optimization (DPO) Formatting

To fine-tune models to prefer correct architectural patterns (e.g., Prisma V5 rules vs legacy rules), the dataset is reformatted into Preference Pairs.

```json
{
  "prompt": "Create a Server Action for user login...",
  "chosen": "export const login = async () => { ... } // (Follows V5 rules)",
  "rejected": "export default async function login() { ... fetch('/api/login') } // (Legacy V3)"
}
```

### 3.1 DPO Export Script

A script (`scripts/export-training-data.ts`) will run periodically to:
1. Parse `training_data.jsonl`.
2. Find matching pairs of Rejected (Initial Draft) and Chosen (Final Approved Draft after Refinement).
3. Export them in the HuggingFace `trl` library format.

---

*Specification generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*
