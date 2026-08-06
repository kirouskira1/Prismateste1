# Evals Pipeline Specification (Offline Evaluation)

**Classification:** REFERENCE  
**Codename:** `Evals_Pipeline`  
**Version:** V5.0 (Harness Engineering Layer)  
**Context Layer:** Quality Assurance (Post-Prompt Update)  
**Est. Tokens:** ~1200 tokens  

---

## 1. Purpose

The Evals Pipeline is the definitive quality gate for the Prisma system. When a prompt is updated (by a human or the Evolutionary Optimizer), we must prove it didn't break existing functionality. "Evals" are not vague LLM-as-a-judge scores; they are deterministic, structured tests comparing agent output against proven Golden Samples.

**Why this matters:**
- Without Evals: A prompt change to fix a Zod schema issue might silently break Row Level Security policies.
- Without Golden Samples: LLM judges tend to approve anything that "looks like code" (AI Slop).

---

## 2. EvalCase Structure

Each test case defines inputs and strict structural/content rules the generated output must pass.

```typescript
/**
 * EvalCase: A single deterministic test for agent output.
 */
interface EvalCase {
  eval_id: string;
  category: "SERVER_ACTION" | "RLS_POLICY" | "UI_COMPONENT" | "POLICY_DECISION";
  input: {
    task_description: string;
    context_files: string[];          // Documents/schemas provided to the agent
  };
  golden_output: {
    must_contain: string[];           // Exact strings or regex that MUST be present
    must_not_contain: string[];       // Exact strings or regex that MUST NOT be present
    structural_checks: string[];      // Functional AST checks (e.g., "has default export")
  };
  scoring: {
    pass_criteria: "ALL_MUST_PASS" | "PERCENTAGE";
    min_pass_rate?: number;           // E.g., 0.8 for PERCENTAGE
  };
}
```

---

## 3. Golden Dataset (The 20 Core Evals)

*The full dataset is loaded from `11_Golden_Sample_FitPro.md` and `12_Golden_Sample_Ecommerce.md`. Below is the canonical subset definition.*

### 3.1 Server Actions (5 Cases)
*Focus: Zod contracts, authorization, error boundaries.*

1. **`sa_01_basic_mutation`**: Create a standard insert action.
   - *Must contain:* `"use server"`, `ActionResponse<T>`, `z.object(`
   - *Must not contain:* `any`, `fetch(`, `console.log`
2. **`sa_02_auth_required`**: Action requiring user session.
   - *Must contain:* `createClient()`, `supabase.auth.getUser()`, `if (!user)`
3. **`sa_03_zod_edge_cases`**: Complex validation (dates, enums).
   - *Must contain:* `z.enum(`, `z.coerce.date()`
4. **`sa_04_policy_delegation`**: Action invoking Policy Agent.
   - *Must contain:* `consultPolicyAgent(`
5. **`sa_05_error_handling`**: Standardized error returns.
   - *Must contain:* `return { success: false, error: `

### 3.2 RLS Policies (5 Cases)
*Focus: Tenant isolation, role-based access.*

1. **`rls_01_tenant_isolation`**: Basic owner-only access.
   - *Must contain:* `auth.uid() = owner_id`
2. **`rls_02_org_isolation`**: Organization-level access.
   - *Must contain:* `EXISTS (SELECT 1 FROM user_orgs WHERE user_orgs.org_id = target.org_id)`
3. **`rls_03_public_read`**: Read-only public tables.
   - *Must contain:* `FOR SELECT USING (true)`, *Must not contain:* `FOR INSERT USING (true)`
4. **`rls_04_service_role`**: Bypass for specific backend tasks.
   - *Structural:* Validate bypassing logic doesn't expose to anon.
5. **`rls_05_delete_protection`**: Soft delete enforcement.
   - *Must contain:* `deleted_at IS NULL`

### 3.3 UI Components (5 Cases)
*Focus: Factory 1 Island architecture, Tailwind, shadcn.*

1. **`ui_01_server_component`**: Default data fetching UI.
   - *Must not contain:* `"use client"`, `useState`, `useEffect`
2. **`ui_02_client_island`**: Interactive form isolated.
   - *Must contain:* `"use client"`, `useTransition`, `useActionState`
3. **`ui_03_tailwind_standards`**: Blue Midnight palette.
   - *Must contain:* `bg-slate-950`, `text-slate-50`
4. **`ui_04_shadcn_integration`**: Correct primitive usage.
   - *Must contain:* `import { Button } from "@/components/ui/button"`
5. **`ui_05_suspense_boundary`**: Loading states.
   - *Must contain:* `<Suspense fallback={`

### 3.4 Policy Decisions (5 Cases)
*Focus: Governance, rule enforcement without hardcoding.*

1. **`pol_01_financial_approval`**: High-value transaction rule.
   - *Must contain:* `requires_manual_approval: true` (if > limit)
2. **`pol_02_refund_eligibility`**: Time-based rule.
   - *Must not contain:* Hardcoded `30 days` (must query config).
3. **`pol_03_compliance_check`**: Data sovereignty.
4. **`pol_04_tier_limits`**: Subscription limits.
5. **`pol_05_discount_stacking`**: E-commerce logic.

---

## 4. Eval Runner Execution

**Script:** `scripts/eval-runner.ts`

**Algorithm:**
```
FOR EACH EvalCase IN dataset:
  1. Initialize Agent with CURRENT PromptVersion.
  2. Provide EvalCase.input.
  3. Capture Agent output.
  4. Run structural and regex checks (must_contain, must_not_contain).
  5. Mark PASS or FAIL.
  
CALCULATE eval_pass_rate = (TOTAL PASS / TOTAL CASES)
```

---

## 5. Regression Metrics & Auto-Rollback

**Reference:** `20_Prompt_Versioning_Protocol.md`

Whenever a new `PromptVersion` is generated (via `16_Evolutionary_Optimizer` or human):
1. The Eval Suite is triggered automatically.
2. If `eval_pass_rate` drops by **> 5%** compared to the `parent_hash` version's score, a **REGRESSION** is declared.
3. The Orchestrator automatically blocks the prompt promotion and initiates Rollback.

**Calibration:** the 5% figure is a declared starting point, not derived from observed variance
across repeated eval runs of an unchanged prompt — without that baseline noise measurement, it's
not possible to know whether 5% is comfortably above natural run-to-run variance or close enough
to it to cause false-positive rollbacks. Measure baseline variance first, then set this threshold
above it. See `docs/29_Methodology_Gaps_Implementation_Plan.md` Sprint C2.

---

*Specification generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*
