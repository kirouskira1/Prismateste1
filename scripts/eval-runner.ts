/**
 * Evals Runner (Prisma V5.0 - Harness Engineering)
 * Deterministic testing suite for Agent outputs.
 *
 * Runs 20 golden test cases extracted from:
 *   - 11_Golden_Sample_FitPro.md
 *   - 12_Golden_Sample_Ecommerce.md
 *
 * Reference: docs/22_Evals_Pipeline_Spec.md
 */

interface EvalCase {
  eval_id: string;
  category: 'SERVER_ACTION' | 'RLS_POLICY' | 'UI_COMPONENT' | 'POLICY_DECISION';
  description: string;
  golden_output: {
    must_contain: string[];
    must_not_contain: string[];
  };
}

/** The 20 canonical eval cases as defined in 22_Evals_Pipeline_Spec.md §3. */
const GOLDEN_DATASET: EvalCase[] = [
  // ─── SERVER ACTIONS (5 Cases) ─────────────────────────────
  {
    eval_id: 'sa_01_basic_mutation',
    category: 'SERVER_ACTION',
    description: 'Standard insert action with Zod validation',
    golden_output: {
      must_contain: ['"use server"', 'ActionResponse', 'z.object'],
      must_not_contain: ['fetch(', 'console.log'],
    },
  },
  {
    eval_id: 'sa_02_auth_required',
    category: 'SERVER_ACTION',
    description: 'Action requiring user session',
    golden_output: {
      must_contain: ['createClient()', 'auth.getUser()', 'if (!user'],
      must_not_contain: ['fetch('],
    },
  },
  {
    eval_id: 'sa_03_zod_edge_cases',
    category: 'SERVER_ACTION',
    description: 'Complex validation with dates and enums',
    golden_output: {
      must_contain: ['z.enum(', 'z.coerce.date('],
      must_not_contain: [],
    },
  },
  {
    eval_id: 'sa_04_policy_delegation',
    category: 'SERVER_ACTION',
    description: 'Action invoking Policy Agent instead of hardcoding rules',
    golden_output: {
      must_contain: ['consultPolicyAgent('],
      must_not_contain: ['if (order.total', 'if (amount >'],
    },
  },
  {
    eval_id: 'sa_05_error_handling',
    category: 'SERVER_ACTION',
    description: 'Standardized error returns',
    golden_output: {
      must_contain: ['return { success: false, error:'],
      must_not_contain: ['throw new Error'],
    },
  },

  // ─── RLS POLICIES (5 Cases) ───────────────────────────────
  {
    eval_id: 'rls_01_tenant_isolation',
    category: 'RLS_POLICY',
    description: 'Basic owner-only access',
    golden_output: {
      must_contain: ['auth.uid()'],
      must_not_contain: ['USING (true)', 'FOR ALL'],
    },
  },
  {
    eval_id: 'rls_02_org_isolation',
    category: 'RLS_POLICY',
    description: 'Organization-level access via join',
    golden_output: {
      must_contain: ['EXISTS (SELECT 1'],
      must_not_contain: ['USING (true)'],
    },
  },
  {
    eval_id: 'rls_03_public_read',
    category: 'RLS_POLICY',
    description: 'Read-only public tables with strict write protection',
    golden_output: {
      must_contain: ['FOR SELECT USING (true)'],
      must_not_contain: ['FOR INSERT USING (true)', 'FOR UPDATE USING (true)'],
    },
  },
  {
    eval_id: 'rls_04_service_role',
    category: 'RLS_POLICY',
    description: 'Service role bypass must not expose to anon',
    golden_output: {
      must_contain: ['service_role'],
      must_not_contain: ['anon'],
    },
  },
  {
    eval_id: 'rls_05_delete_protection',
    category: 'RLS_POLICY',
    description: 'Soft delete enforcement in SELECT policies',
    golden_output: {
      must_contain: ['deleted_at IS NULL'],
      must_not_contain: ['DROP', 'TRUNCATE'],
    },
  },

  // ─── UI COMPONENTS (5 Cases) ──────────────────────────────
  {
    eval_id: 'ui_01_server_component',
    category: 'UI_COMPONENT',
    description: 'Default data-fetching page (no client directives)',
    golden_output: {
      must_contain: ['async function'],
      must_not_contain: ['"use client"', 'useState', 'useEffect'],
    },
  },
  {
    eval_id: 'ui_02_client_island',
    category: 'UI_COMPONENT',
    description: 'Interactive form isolated as client island',
    golden_output: {
      must_contain: ['"use client"', 'useTransition'],
      must_not_contain: [],
    },
  },
  {
    eval_id: 'ui_03_tailwind_standards',
    category: 'UI_COMPONENT',
    description: 'Blue Midnight palette compliance',
    golden_output: {
      must_contain: ['bg-slate-950', 'text-slate-50'],
      must_not_contain: ['bg-white', 'text-black'],
    },
  },
  {
    eval_id: 'ui_04_shadcn_integration',
    category: 'UI_COMPONENT',
    description: 'Correct shadcn/ui primitive usage',
    golden_output: {
      must_contain: ['@/components/ui/'],
      must_not_contain: [],
    },
  },
  {
    eval_id: 'ui_05_suspense_boundary',
    category: 'UI_COMPONENT',
    description: 'Loading states with Suspense boundary',
    golden_output: {
      must_contain: ['<Suspense fallback={'],
      must_not_contain: ['isLoading'],
    },
  },

  // ─── POLICY DECISIONS (5 Cases) ───────────────────────────
  {
    eval_id: 'pol_01_financial_approval',
    category: 'POLICY_DECISION',
    description: 'High-value transaction requires approval via Policy Agent',
    golden_output: {
      must_contain: ['requires_manual_approval'],
      must_not_contain: ['if (amount > 500)', 'if (total > 1000)'],
    },
  },
  {
    eval_id: 'pol_02_refund_eligibility',
    category: 'POLICY_DECISION',
    description: 'Time-based rule without hardcoded days',
    golden_output: {
      must_contain: ['consultPolicyAgent'],
      must_not_contain: ['30 days', '30days', 'daysSincePurchase > 30'],
    },
  },
  {
    eval_id: 'pol_03_compliance_check',
    category: 'POLICY_DECISION',
    description: 'Data sovereignty and compliance check',
    golden_output: {
      must_contain: ['compliance', 'policy'],
      must_not_contain: [],
    },
  },
  {
    eval_id: 'pol_04_tier_limits',
    category: 'POLICY_DECISION',
    description: 'Subscription tier limits queried dynamically',
    golden_output: {
      must_contain: ['subscription', 'limit'],
      must_not_contain: ['if (plan === "free")', 'maxProjects = 3'],
    },
  },
  {
    eval_id: 'pol_05_discount_stacking',
    category: 'POLICY_DECISION',
    description: 'E-commerce discount rules not hardcoded',
    golden_output: {
      must_contain: ['discount', 'policy'],
      must_not_contain: ['0.1', '10%', 'discountRate = 0.15'],
    },
  },
];

export class EvalRunner {
  private cases: EvalCase[] = GOLDEN_DATASET;

  /**
   * Run a single eval case against agent output.
   */
  public runEval(evalId: string, agentOutput: string): { passed: boolean; failures: string[] } {
    const testCase = this.cases.find((c) => c.eval_id === evalId);
    if (!testCase) throw new Error(`EvalCase ${evalId} not found in golden dataset.`);

    const failures: string[] = [];
    const { must_contain, must_not_contain } = testCase.golden_output;

    for (const term of must_contain) {
      if (!agentOutput.includes(term)) {
        failures.push(`Missing required: "${term}"`);
      }
    }

    for (const term of must_not_contain) {
      if (agentOutput.includes(term)) {
        failures.push(`Contains forbidden: "${term}"`);
      }
    }

    const passed = failures.length === 0;
    if (passed) {
      console.log(`  ✅ [PASS] ${evalId}: ${testCase.description}`);
    } else {
      console.error(`  ❌ [FAIL] ${evalId}: ${testCase.description}`);
      failures.forEach((f) => console.error(`         → ${f}`));
    }

    return { passed, failures };
  }

  /**
   * Run the full eval suite against a map of agent outputs.
   * @param agentOutputs - Map of eval_id → generated code/output string.
   * @param previousPassRate - The pass rate from the previous prompt version (for regression check).
   */
  public runFullSuite(
    agentOutputs: Record<string, string>,
    previousPassRate?: number
  ): { passRate: number; regressionDetected: boolean; details: Record<string, string[]> } {
    console.log('══════════════════════════════════════════════');
    console.log('  Prisma V5.0 Eval Suite — 20 Golden Cases');
    console.log('══════════════════════════════════════════════\n');

    let passedCount = 0;
    const details: Record<string, string[]> = {};
    const total = Object.keys(agentOutputs).length;

    for (const [evalId, output] of Object.entries(agentOutputs)) {
      const result = this.runEval(evalId, output);
      if (result.passed) passedCount++;
      if (result.failures.length > 0) details[evalId] = result.failures;
    }

    const passRate = total === 0 ? 0 : passedCount / total;

    console.log(`\n══════════════════════════════════════════════`);
    console.log(`  Pass Rate: ${passedCount}/${total} (${(passRate * 100).toFixed(1)}%)`);

    // Regression check: if pass rate dropped > 5% from previous run
    let regressionDetected = false;
    if (previousPassRate !== undefined) {
      const delta = previousPassRate - passRate;
      if (delta > 0.05) {
        regressionDetected = true;
        console.error(`  🔴 REGRESSION DETECTED: Pass rate dropped ${(delta * 100).toFixed(1)}%`);
        console.error(`     Previous: ${(previousPassRate * 100).toFixed(1)}% → Current: ${(passRate * 100).toFixed(1)}%`);
      } else {
        console.log(`  ✅ No regression (delta: ${(delta * 100).toFixed(1)}%)`);
      }
    }

    console.log('══════════════════════════════════════════════\n');

    return { passRate, regressionDetected, details };
  }

  /** Get the full list of eval IDs for reference. */
  public getEvalIds(): string[] {
    return this.cases.map((c) => c.eval_id);
  }
}

// CLI entry point
if (require.main === module) {
  console.log('Prisma V5.0 Eval Runner loaded.');
  console.log(`Total eval cases registered: ${GOLDEN_DATASET.length}`);
  console.log('Categories:');
  const cats = new Set(GOLDEN_DATASET.map((c) => c.category));
  cats.forEach((cat) => {
    const count = GOLDEN_DATASET.filter((c) => c.category === cat).length;
    console.log(`  - ${cat}: ${count} cases`);
  });
  console.log('\nTo run evals, import EvalRunner and call runFullSuite() with agent outputs.');
}
