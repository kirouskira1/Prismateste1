# Audit and Quality Framework — Prisma V4

**Classification:** REFERENCE  
**Codename:** `Audit_Framework`  
**Version:** V4.5 (Loop Architecture + Fable Patterns)  
**Context Layer:** Task (Every Audit Cycle)  

---

This document is the "Supreme Law" of Prisma. The TRM Cognitive Agent **MUST** use this checklist in every self-correction cycle. If any critical item fails, the code must be rejected and refined.

---

## 1. Business Architecture Audit (V4 Critical)

*This section ensures we are building an Agent Platform (BPA), not a legacy monolith.*

- [ ] **Hard-Coding Prohibition:** Does the code contain fixed business values (e.g., rates, limits, deadlines)?
    - *Fail:* `if (order.total > 500)`
    - *Pass:* `const policy = await consultPolicyAgent(order)`
- [ ] **Agent Abstraction:** Is complex decision logic encapsulated in a separate "Policy Agent" service invoked via `consultPolicyAgent()`?
- [ ] **External Source of Truth:** Does the agent query a knowledge base (Client RAG) or dynamic configuration before making a decision?

**Kill Switch:** Any failure in Section 1 when `compilation_target = 'V4'` → automatic score = 0.0.

---

## 2. Security and Governance Audit (5 Golden Rules)

- [ ] **Credential Protection:** Are there any hard-coded API keys, tokens, or passwords? (Must use `process.env` environment variables).
- [ ] **Input Sanitization:** Are data entering Agents (especially for RAG) sanitized to prevent *Prompt Injection*?
- [ ] **RLS Security:** (For Backend) Are Supabase Row Level Security policies defined to ensure users only access their own data?
- [ ] **IP Protection:** Is any Prisma IP (`/docs` content, system prompts) exposed client-side or sent to public APIs?
- [ ] **Audit Trail:** Are Policy Agent decisions recorded in `audit_logs` with `reasoning_text` and `citation_metadata`?

**Kill Switch:** API key exposed client-side → automatic score = 0.0.

---

## 3. Frontend Audit (Design-First & MCPs)

- [ ] **Visual Fidelity:** Does the React component visually correspond to the `prototype.html` (Stitch) structure?
- [ ] **MCP Usage:** Does the code use premium components from `03_MCP_Component_Registry.md`?
    - *Check:* Charts use **Tremor**? Hero animations use **Magic UI**? Functional elements use **shadcn/ui**?
- [ ] **Responsiveness:** Does the layout work correctly on Mobile and Desktop (Tailwind classes `md:`, `lg:`)?
- [ ] **Server-First:** Are pages Server Components by default? Is `"use client"` only on isolated interactive islands?
- [ ] **Blue Midnight:** Does the palette follow the canonical design tokens (`bg-slate-950`, `text-slate-50`, `blue-500` accent)?

---

## 4. Code Quality and Maintainability

- [ ] **Strict Typing:** Is the TypeScript code free of implicit `any`? Are interfaces defined?
- [ ] **Intent Documentation:** Does the code have comments (JSDoc) explaining the *why* of architectural decisions (e.g., "Delegates to Financial Agent to allow client rule adjustments")?
- [ ] **Modularity:** Does the code follow the single responsibility principle? (UI components separated from Agent logic).
- [ ] **Contract Compliance:** Do all Server Actions have `"use server"` on line 1 and return `ActionResponse<T>`?
- [ ] **Anti-Legacy Filter:** No Prisma ORM, no Pages Router, no `/api/` routes, no direct `fetch()` to Edge Functions?

---

## 5. SMART Criteria & Anti-Hallucination

- [ ] **Specific:** Does the code solve exactly the problem described in the task, without excessive abstractions or generalizations?
- [ ] **Measurable:** Is the action result verifiable (e.g., returns correct data, inserts into the correct table, validates Zod)?
- [ ] **Achievable:** Is the code contained within the sprint scope and does not require cascading refactors in other areas?
- [ ] **Relevant:** Does the logic directly serve the objective (e.g., Policy Enforcement, RLS, UI translation)?
- [ ] **Time-bound:** Is the solution direct and does not introduce unsolicited "preparations" for the future (anti-over-engineering)?

**Anti-Hallucination Checklist:**
- [ ] **No Phantom Features:** Does the code implement ONLY what was requested? (Check for functions, libraries, or rules that nobody asked for.)
- [ ] **Traceability:** Does every generated component trace back to the original request or the stipulated architecture?
- [ ] **Self-Verification Protocol:** Every N iterations, stop looking at the immediate error and compare your current progress directly against the original task specification.

---

## Scoring Formula

```
quality_score = Σ (category_weight × category_pass_rate) × 10

Weights (when NO dynamic rubric is provided — legacy V4.2):
  Architecture V4:  30%
  Security:         25%
  Frontend/Design:  20%
  Code Quality:     15%
  Data Contract:    10%

Weights (when dynamic rubric IS provided — V4.3):
  Architecture V4:  27%
  Security:         23%
  Frontend/Design:  18%
  Code Quality:     12%
  Data Contract:    10%
  Dynamic Rubric:   10%   ← NEW (V4.3)

Threshold: score >= 9.5 → APPROVED
           score <  9.5 → REJECTED + feedback
```

---

## 6. Dynamic Rubric Integration (V4.3 — Loop Architecture)

When the Architect provides a `<task_rubric>` for a task, the Auditor MUST evaluate code against both the static framework (Sections 1-5) and the dynamic rubric criteria.

### Hierarchy of Authority

```
LEVEL 1 (ABSOLUTE): Kill Switches (§3 — K1 through K5)
  → If ANY fires → score = 0.0, game over. No rubric can save it.

LEVEL 2 (UNIVERSAL): Static Audit Framework (Sections 1-5)
  → Always evaluated. Weight: 90% of final score when rubric is present.

LEVEL 3 (TASK-SPECIFIC): Dynamic Rubric (<task_rubric>)
  → Only evaluated when provided by the Architect.
  → Weight: 10% of final score.
  → A failed rubric criterion does NOT trigger a Kill Switch,
    but it WILL lower the score and generate remediation feedback.
```

### Rubric Scoring Formula

```
rubric_score = (criteria_passed / total_criteria) × 10

Example with 4 criteria, 3 passed:
  rubric_score = (3/4) × 10 = 7.5

Combined:
  final_score = (static_score × 0.9) + (rubric_score × 0.1)
  final_score = (9.8 × 0.9) + (7.5 × 0.1) = 8.82 + 0.75 = 9.57 → APPROVED
```

### When Rubric is Absent

If no `<task_rubric>` is provided (e.g., for `EXECUTION_ONLY`, `DEEP_READ`, or legacy tasks), the Auditor evaluates using the static framework only (100% weight). This preserves full backward compatibility with V4.2.

---

## Failure Protocol

If **any** item in Sections 1 or 2 fails, the TRM Agent must immediately discard the draft and start a new reasoning iteration (`z`), focusing specifically on correcting the violation.

If after maximum attempts (configurable via `prisma.config.json`, default: 3) the score remains below 9.5, escalate to the Lead Architect with the full `reasoning_trace`.

---

*Framework generated under Prisma V4.3 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*