# 🚀 Sprint Zero — Document Generation Protocol

**Classification:** Project Initialization Protocol  
**Codename:** `Sprint_Zero`  
**Executor:** All agents operate under `Architect_TRM` orchestration  
**Trigger:** Activated by **"Prisma Solo Mode"** command + Client Briefing  
**Version:** V5.0 (Loop Architecture + Fable Patterns)  

---

## 1. Fundamental Principle

> **No line of code exists without documentation to justify it.**
>
> Sprint Zero is the mandatory Phase 0 that precedes Phases 1-5 of the Playbook.
> It transforms a vague briefing into 8 precise documentary artifacts that
> feed the Worker TRM throughout the software construction.

### Why does this exist?

```
WITHOUT SPRINT ZERO:
  Briefing → Direct code → Rework → Technical debt → Chaos

WITH SPRINT ZERO:
  Briefing → 8 Documents → Docs-guided code → Zero ambiguity
```

### Metaphor

Sprint Zero is the **architectural blueprint of the building**. No bricklayer (Worker TRM) starts raising a wall without having the floor plan, electrical plan, plumbing plan, and soil report approved by the engineer (Architect TRM) first.

<access_list agent="Sprint_Zero">
  <always_load>
    <file>000_Kernel_System_Override.md</file>
    <file>00_Execution_Playbook.md</file>
    <file>Client briefing</file>
  </always_load>
  <load_if_needed>
    <file>01_Whitepaper_Architecture.md</file>
    <file>00_Prisma_Concepts_DeepDive.md</file>
    <file>15_Architectural_Decision_Framework.md</file>
  </load_if_needed>
  <never_load>
    <file>04_Audit_Framework.md (loaded only during audit phase)</file>
    <file>Worker reasoning_trace</file>
  </never_load>
</access_list>

## 2. Position in the Project Lifecycle

```
┌──────────────────────────────────────────────────────────┐
│                  PRISMA V5.0 LIFECYCLE                    │
│                                                          │
│  ┌────────────┐                                          │
│  │  BRIEFING  │  Client input (description or Stitch)    │
│  └─────┬──────┘                                          │
│        │                                                 │
│        ▼                                                 │
│  ╔════════════════════════════════════════╗               │
│  ║  SPRINT ZERO (Documentation)          ║  ◀── HERE     │
│  ║  8 artifacts generated sequentially   ║               │
│  ║  Each audited before the next         ║               │
│  ╚════════════════╤═══════════════════════╝               │
│                   │                                      │
│                   ▼                                      │
│  ┌────────────────────────────────────────┐              │
│  │  PHASES 1-5 (Code)                    │              │
│  │  Each sprint queries the Sprint Zero  │              │
│  │  artifacts as the source of truth     │              │
│  └────────────────────────────────────────┘              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Artifact Chain (Order and Dependencies)

The sequence is **rigid**. Each artifact depends on the previous ones. Skipping is not allowed.

```
ARTIFACT 1          ARTIFACT 2         ARTIFACT 3
Domain       ──────▶ SQL Script ──────▶ API Contract
Analysis             + RLS              (OpenAPI)
   │                    │                   │
   │                    │                   │
   ▼                    ▼                   ▼
ARTIFACT 6          ARTIFACT 4         ARTIFACT 5
Monitoring   ◀──── Zod Schemas  ◀────── Gherkin Scenarios
& Observab.                             (BDD)
                        │
                        ▼
                    ARTIFACT 7          ARTIFACT 8
                    Validation  ──────▶ Implementation
                    Report              Plan (Sprints)
```

---

## 4. Complete Specification of Each Artifact

---

### 📄 ARTIFACT 1: Domain Analysis & Strategy

**Filename:** `Sprint0_01_Domain_Analysis.md`  
**Responsible Agent:** `Architect_TRM`  
**Input:** Client briefing (free text or Stitch HTML)  
**Goal:** Map the problem universe BEFORE thinking about solutions.

#### What it must contain:

```markdown
1. PROJECT CONTEXT
   ├── Project name
   ├── Sector/Industry
   ├── Target audience
   ├── Problem it solves
   └── Unique value proposition

2. ENTITY MAP (Domain Model)
   ├── Entity: [Name]
   │   ├── Main attributes
   │   ├── Relationships (1:N, N:N, 1:1)
   │   └── Linked business rules
   └── Entity diagram (Mermaid)

3. USER JOURNEYS
   ├── Persona 1: [Name/Role]
   │   └── Flow: Login → Main action → Result
   ├── Persona 2: [Name/Role]
   │   └── Flow: ...
   └── Admin flows

4. BUSINESS RULE CLASSIFICATION
   ├── STATIC RULES (can live in code — V3.1)
   │   └── Ex: "User needs a valid email to register"
   ├── VOLATILE RULES (must go to Policy Agent — V4)
   │   └── Ex: "Project limit per plan", "Discount rate"
   └── Classification table with justification

5. ARCHITECTURAL TRIAGE
   ├── Compilation Target: V3.1 | V4 | HYBRID
   ├── Justification based on the 80/20 Rule
   └── Signals detected in the briefing
```

#### TRM Verification (Before proceeding):

- [ ] Are all entities from the briefing mapped?
- [ ] No "invented" entities that don't exist in the briefing?
- [ ] Rules classified correctly (static vs volatile)?
- [ ] Architectural triage justified with concrete signals?
- [ ] User journeys cover all identified personas?

---

### 📄 ARTIFACT 2: SQL Script & Security (Schema + RLS)

**Filename:** `Sprint0_02_SQL_Schema.sql`  
**Responsible Agent:** `Backend_Agent` (under `Architect_TRM` supervision)  
**Input:** Artifact 1 (Domain Analysis)  
**Goal:** Translate the domain model into an impenetrable data structure.

#### What it must contain:

```sql
-- 1. EXTENSIONS
--    (vector, uuid-ossp — if necessary)

-- 2. DOMAIN ENUMS
--    Derived EXACTLY from Artifact 1 classifications
--    Ex: create type project_status as enum ('draft', 'active', 'completed');

-- 3. TABLES
--    One table per entity from the Entity Map
--    Constraints with descriptive names
--    Audit fields: created_at, updated_at

-- 4. ROW LEVEL SECURITY (RLS)
--    MANDATORY on ALL tables
--    SELECT, INSERT, UPDATE, DELETE policies
--    Isolation by auth.uid()

-- 5. INDEXES
--    Frequently searched columns
--    Partial indexes where applicable

-- 6. TRIGGERS
--    Automatic updated_at
--    Soft delete where applicable

-- 7. FUNCTIONS
--    SECURITY DEFINER only when justified
--    Each function documented with COMMENT ON FUNCTION
```

#### TRM Verification:

- [ ] Does every entity from Artifact 1 have a corresponding table?
- [ ] Does every table have RLS enabled (`ENABLE ROW LEVEL SECURITY`)?
- [ ] Do enums reflect exactly the domain classifications?
- [ ] No table without a SELECT policy?
- [ ] Audit fields present (`created_at`, `updated_at`)?
- [ ] Table and column names in `snake_case`?
- [ ] Constraints named descriptively?

---

### 📄 ARTIFACT 3: API Contract (OpenAPI / Server Actions)

**Filename:** `Sprint0_03_API_Contract.yaml`  
**Responsible Agent:** `Backend_Agent`  
**Input:** Artifact 1 (Domain) + Artifact 2 (SQL)  
**Goal:** Define ALL system operations before implementing them.

#### What it must contain:

```yaml
# For EACH Server Action in the system:

/actions/{domain}.ts:
  actionName:
    description: "What this action does and WHY it exists"
    auth_required: true | false
    input:
      schema: Zod schema name
      fields:
        - name: field1
          type: string | number | uuid | enum
          validation: "min(1), max(100), email(), uuid()"
    output:
      success_type: "Data type when success=true"
      error_cases:
        - "Not authenticated"
        - "Record not found"
        - "Validation failed"
    tables_accessed:
      - table_name (SELECT | INSERT | UPDATE | DELETE)
    rls_dependency: "Which RLS policy protects this operation"
    business_rules:
      - rule: "Rule description"
        type: STATIC | VOLATILE
        delegation: "V3.1 (code) | V4 (Policy Agent)"
```

#### TRM Verification:

- [ ] Does every user flow from Artifact 1 have corresponding actions?
- [ ] Does every action reference tables that exist in Artifact 2?
- [ ] Are all actions `async` and return `ActionResponse<T>`?
- [ ] Volatile rules marked as "V4 (Policy Agent)"?
- [ ] No action without `auth_required` defined?
- [ ] Error cases cover real scenarios (not generic)?

---

### 📄 ARTIFACT 4: Zod Validation Schemas

**Filename:** `Sprint0_04_Zod_Schemas.ts`  
**Responsible Agent:** `Backend_Agent`  
**Input:** Artifact 2 (SQL) + Artifact 3 (API)  
**Goal:** Generate Zod schemas that validate ALL system inputs.

#### What it must contain:

```typescript
// For EACH action defined in Artifact 3:

import { z } from "zod";

// === ENUMS (Mirror SQL enums from Artifact 2) ===
export const projectStatusSchema = z.enum([
  "draft", "active", "completed"
]);

// === INPUT SCHEMAS (One per Server Action) ===
export const createProjectSchema = z.object({
  projectName: z.string()
    .min(1, "Name required")
    .max(100, "Maximum 100 characters"),
  industry: z.string().min(1),
  targetAudience: z.string().min(1),
  // ... each field validated individually
});

// === OUTPUT SCHEMAS (Return types) ===
export const projectResponseSchema = z.object({
  id: z.string().uuid(),
  projectName: z.string(),
  status: projectStatusSchema,
  createdAt: z.string().datetime(),
});

// === INFERRED TYPES (For TypeScript use) ===
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type ProjectResponse = z.infer<typeof projectResponseSchema>;
```

#### TRM Verification:

- [ ] Does every action from Artifact 3 have a corresponding Zod schema?
- [ ] Do Zod enums mirror EXACTLY the SQL enums from Artifact 2?
- [ ] Are error messages descriptive (not generic)?
- [ ] Inferred types exported for use in Server Components?
- [ ] No field with `z.any()` or `z.unknown()` without justification?
- [ ] Optional fields explicitly marked with `.optional()`?

---

### 📄 ARTIFACT 5: Gherkin Scenarios (BDD)

**Filename:** `Sprint0_05_Gherkin_Scenarios.feature`  
**Responsible Agent:** `Auditor_TRM`  
**Input:** Artifact 1 (User Flows) + Artifact 3 (API)  
**Goal:** Define the expected behavior in verifiable human language.

#### What it must contain:

```gherkin
# One Feature per user flow from Artifact 1

Feature: Project Creation
  As an authenticated user on the Pro plan
  I want to create a new project
  So that I can generate my software automatically

  Scenario: Successful creation
    Given that I am authenticated as a "pro" user
    And that I have less than 10 active projects
    When I send a creation request with name "My App"
    Then the system returns success=true
    And the project appears in the list with status "draft"

  Scenario: Project limit reached
    Given that I am authenticated as a "free" user
    And that I already have 3 active projects
    When I send a creation request
    Then the system returns success=false
    And the error message contains "Project limit reached"

  Scenario: Unauthenticated user
    Given that I am NOT authenticated
    When I send a creation request
    Then the system returns success=false
    And the error message contains "Not authenticated"

  # V4 SCENARIOS (Volatile Rules):
  Scenario: Limit defined by policy document
    Given that the "plan_rules.pdf" document defines a 5-project limit for Free
    And that the Policy Agent is active
    When a Free user with 4 projects tries to create the 5th
    Then the Policy Agent queries the document
    And returns decision="APPROVED" with citation snippet
```

#### TRM Verification:

- [ ] Does every user flow from Artifact 1 have at least 3 scenarios (happy path + 2 edge cases)?
- [ ] Authentication scenarios covered (authenticated, unauthenticated, wrong plan)?
- [ ] V4 scenarios include reference to Policy Agent (if `target = V4`)?
- [ ] Scenario language is verifiable (precise Given/When/Then)?
- [ ] No generic scenarios ("the system works") — all are specific?

---

### 📄 ARTIFACT 6: Monitoring & Observability Plan

**Filename:** `Sprint0_06_Monitoring.md`  
**Responsible Agent:** `Security_Agent` + `Architect_TRM`  
**Input:** Artifact 3 (API) + Artifact 1 (Domain)  
**Goal:** Define WHAT to monitor, HOW to log, and WHEN to alert.

#### What it must contain:

```markdown
1. STRUCTURED LOGS
   ├── Which actions generate logs in audit_logs?
   ├── Format: { action, user_id, input_summary, result, timestamp }
   ├── What NEVER to log (PII, passwords, tokens)
   └── Retention: 90 days (configurable)

2. USAGE METRICS (usage_metrics table)
   ├── operation_type: Each mapped action
   ├── tokens_consumed: LLM usage tracking
   ├── cost_usd: Estimated cost per operation
   └── Aggregations: per user, per day, per plan

3. AGENT METRICS (if V4)
   ├── Decisions per agent (approved/rejected/escalated)
   ├── Average latency per agent
   ├── Confidence distribution
   └── Human escalation rate

4. ALERTS
   ├── Token budget > 80% → WARNING
   ├── Token budget > 95% → CRITICAL
   ├── Agent with > 30% escalation → INVESTIGATE
   ├── Agent latency > 5s → DEGRADATION
   └── Security failure (BLOCK) → IMMEDIATE

5. DASHBOARD KPIs
   ├── Which charts to display (ref: Tremor components)
   ├── Refresh rate
   └── Available filters (date, user, plan)
```

#### TRM Verification:

- [ ] Do all actions from Artifact 3 have mapped logs?
- [ ] PII explicitly excluded from logs?
- [ ] Do alerts have concrete thresholds (not "when it is too much")?
- [ ] Agent metrics present if `target = V4`?
- [ ] Dashboard KPIs defined with specific Tremor components?

---

### 📄 ARTIFACT 7: Cross-Validation Report

**Filename:** `Sprint0_07_Validation_Report.md`  
**Responsible Agent:** `Auditor_TRM`  
**Input:** ALL previous artifacts (1 to 6)  
**Goal:** Cross-reference all documents and guarantee total consistency.

#### What it must contain:

```markdown
# TRACEABILITY MATRIX

| Entity (Art.1) | SQL Table (Art.2) | Actions (Art.3) | Zod (Art.4) | Gherkin (Art.5) | Logs (Art.6) |
|:---|:---|:---|:---|:---|:---|
| User | public.users ✅ | signIn, signOut ✅ | signInSchema ✅ | auth.feature ✅ | auth_logs ✅ |
| Project | public.projects ✅ | createProject ✅ | createProjectSchema ✅ | projects.feature ✅ | project_logs ✅ |
| ... | ... | ... | ... | ... | ... |

# CONSISTENCY CHECKS

□ Does every entity from Art.1 have a table in Art.2?
□ Does every table from Art.2 have an action in Art.3?
□ Does every action from Art.3 have a Zod schema in Art.4?
□ Does every flow from Art.1 have a Gherkin scenario in Art.5?
□ Does every action from Art.3 have a log in Art.6?
□ Consistent naming between SQL (snake_case) and TS (camelCase)?
□ SQL Enums = Zod Enums = TypeScript Enums?

# RESULT

| Check | Status | Observation |
|:---|:---:|:---|
| Entity Coverage | ✅/❌ | [detail] |
| Actions Coverage | ✅/❌ | [detail] |
| Validation Coverage | ✅/❌ | [detail] |
| Test Coverage | ✅/❌ | [detail] |
| Logs Coverage | ✅/❌ | [detail] |
| Name Consistency | ✅/❌ | [detail] |

# VERDICT
"Sprint Zero is APPROVED/REJECTED to begin Code Phases."
```

#### TRM Verification:

- [ ] Complete traceability matrix (no empty cells)?
- [ ] Does every ❌ have a justification and correction plan?
- [ ] Are cross-referenced names consistent between artifacts?
- [ ] No "orphan" entities (exist in domain but not in SQL)?
- [ ] No "orphan" actions (exist in API but not in Gherkin)?

---

### 📄 ARTIFACT 8: Implementation Plan (Project Sprints)

**Filename:** `Sprint0_08_Implementation_Plan.md`  
**Responsible Agent:** `Architect_TRM`  
**Input:** ALL previous artifacts + Generic Playbook  
**Goal:** Translate Sprint Zero artifacts into concrete code sprints.

#### What it must contain:

```markdown
# IMPLEMENTATION PLAN — [Project Name]

## Compilation Target: V3.1 | V4 | HYBRID
## Estimate: X sprints | Y files

---

## PHASE 1: INFRASTRUCTURE
Sprint 1.1: Initialize Next.js + deps
Sprint 1.2: .env.local (Supabase keys)
Sprint 1.3: Supabase utils (server.ts, client.ts)
Sprint 1.4: Blue Midnight theme (tailwind.config + globals.css)
→ GATEWAY: Validate Infra

## PHASE 2: DATA (Derived from Artifact 2)
Sprint 2.1: Execute Sprint0_02_SQL_Schema.sql in Supabase
Sprint 2.2: Verify RLS of each table
→ GATEWAY: Validate Security

## PHASE 3: BACKEND (Derived from Artifacts 3 + 4)
Sprint 3.1: /actions/auth.ts (ref: Artifact 3 → auth actions)
Sprint 3.2: /actions/[domain].ts (ref: Artifact 3 → domain actions)
Sprint 3.3: Zod Schemas (ref: Artifact 4)
Sprint 3.4: Policy Agents (if V4, ref: Artifact 3 → volatile rules)
→ GATEWAY: Validate Contracts

## PHASE 4: FRONTEND (Derived from Stitch + Artifact 1)
Sprint 4.1: Root Layout
Sprint 4.2: Dashboard Layout + Sidebar
Sprint 4.3: Main pages (ref: Artifact 1 → flows)
→ GATEWAY: Validate Performance

## PHASE 5: INTERACTIVITY
Sprint 5.1: Forms (ref: Artifact 4 → Zod schemas)
Sprint 5.2: Connection with Server Actions
Sprint 5.3: Toasts and visual feedback
→ GATEWAY: Validate UX

## FINAL VERIFICATION (Derived from Artifact 5)
Sprint F.1: Validate Gherkin scenarios against running app
Sprint F.2: Verify monitoring (ref: Artifact 6)
Sprint F.3: Final delivery report
```

#### TRM Verification:

- [ ] Does each sprint reference the Sprint Zero artifact that justifies it?
- [ ] No "invented" sprint without documentary basis?
- [ ] Gateways present between each phase?
- [ ] Compilation target coherent with Artifact 1 triage?
- [ ] Final verification sprints include Gherkin and monitoring?

---

## 5. Sprint Zero Execution Protocol

### 5.1 Cadence

```
RULE: One artifact at a time. Same protocol as code.

1. Generate Artifact N
2. Execute TRM verification of Artifact N
3. Declare: "Artifact N of Sprint Zero complete.
   Audit Gateway approved."
4. Smart Pause (consistent with Kernel §4 <smart_pause> and 00_Execution_Playbook.md's
   Audit Gateways — do NOT blanket-pause after every artifact, that contradicts the
   Kernel's general autonomy rule):
     ├── TRM verification found a genuine ❌ or a briefing gap that needs human
     │   clarification → PAUSE, ask the specific question, wait for a real answer.
     └── TRM verification passed clean → PROCEED automatically to Artifact N+1.
           Report progress (§10 of 00_Orchestrator_Protocol.md) without stopping.
5. Generate Artifact N+1
```

### 5.2 Conditional Triage

Not every project needs all 8 artifacts with the same depth:

| Target | Mandatory Artifacts | Optional Artifacts |
|:---:|:---|:---|
| V3.1 | 1, 2, 3, 4, 7, 8 | 5 (Simplified Gherkin), 6 (basic) |
| V4 | 1, 2, 3, 4, 5, 6, 7, 8 | None — all mandatory |
| HYBRID | 1, 2, 3, 4, 7, 8 | 5 (for V4 modules), 6 (for V4 modules) |

### 5.3 Sprint Zero Completion Criteria

Sprint Zero is only completed when:

1. ✅ All mandatory artifacts have been generated
2. ✅ The Validation Report (Artifact 7) has no pending ❌
3. ✅ The Implementation Plan (Artifact 8) references each artifact
4. ✅ The Lead Architect approves the complete documentary package

**Only then is the Code Playbook (Phases 1-5) activated.**

---

## 6. Relationship with Agents

| Artifact | Primary Agent | Support Agent |
|:---|:---|:---|
| 1. Domain Analysis | `Architect_TRM` | — |
| 2. SQL Script | `Backend_Agent` | `Security_Agent` (RLS) |
| 3. API Contract | `Backend_Agent` | `Architect_TRM` (triage) |
| 4. Zod Schemas | `Backend_Agent` | `Auditor_TRM` (zero any) |
| 5. Gherkin Scenarios | `Auditor_TRM` | `Architect_TRM` (flows) |
| 6. Monitoring | `Security_Agent` | `Backend_Agent` (metrics) |
| 7. Validation Report | `Auditor_TRM` | All (cross-reference) |
| 8. Implementation Plan | `Architect_TRM` | `Auditor_TRM` (viability) |

---

## 7. Absolute Rules of Sprint Zero

1. **Documentation before code.** If Artifact 7 has an ❌, coding does not start. No exceptions.
2. **Total traceability.** Every code sprint MUST reference the documentary artifact that originated it.
3. **Briefing is sacred.** If the client said "3 user types", there are 3. Do not invent a 4th.
4. **Consistent names.** If the entity is "Project" in Artifact 1, it is `projects` in SQL, `createProject` in API, and `createProjectSchema` in Zod. Convention break = rejection.
5. **Triage before everything.** Artifact 1 defines the `compilation_target`. All other artifacts respect this decision.
6. **Artifact 7 is the final judge.** If the traceability matrix shows gaps, Sprint Zero is rejected.

<agent_constraint>
Do not add entities, flows, tables, or API endpoints beyond what the client briefing describes. Sprint Zero maps what exists in the briefing — it does not invent requirements. If the briefing is vague, flag it as a gap in Artifact 7 rather than filling it with assumptions.
</agent_constraint>

<investigate_before_answering>
Before generating each artifact, re-read the client briefing and all previously generated artifacts. Never assume what the briefing says — always verify. Cross-reference entity names, field types, and user flows against the source before declaring consistency.
</investigate_before_answering>

<progress_grounding>
Before reporting that an artifact is complete, verify each section against the briefing. Only declare completion when every required section has been filled with traceable content. If a section could not be filled due to insufficient briefing data, mark it explicitly as "PENDING: requires client clarification".
</progress_grounding>

<context_awareness>
You have ample context remaining. Do not stop, summarize, or suggest a new session on account of context limits. Continue generating artifacts sequentially until all 8 are complete or a blocker requires human input.
</context_awareness>

---

## 🔗 Graph Topology
### Agentes Envolvidos
- [[01_Architect_Agent]] — Domain Analysis, Implementation Plan
- [[05_Backend_Agent]] — SQL Script, API Contract, Zod Schemas
- [[03_Auditor_Agent]] — Gherkin Scenarios, Validation Report
- [[07_Security_Agent]] — Monitoring, RLS
### Docs de Referência
- [[000_Kernel_System_Override]]
- [[00_Execution_Playbook]]
- [[01_Whitepaper_Architecture]]
- [[00_Prisma_Concepts_DeepDive]]
- [[15_Architectural_Decision_Framework]]

---

*Protocol generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*
