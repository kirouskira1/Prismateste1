# Evolutionary Optimizer Specification (Feed-Forward)

**Classification:** REFERENCE  
**Codename:** `Evolutionary_Optimizer`  
**Version:** V4  
**Context Layer:** Phase (Continuous Improvement)  
**Est. Tokens:** ~300 tokens  

---

## 1. Concept

Transform Prisma from a reactive system (corrects errors) into a proactive system (seeks improvement). The Evolutionary Optimizer continuously experiments with prompt variations to find better-performing alternatives.

---

## 2. A/B Testing Architecture

The Orchestrator implements an `ExperimentNode` in the LangGraph flow.

- **The 5% Rule:** On 5% of medium-risk tasks, the system executes two prompts in parallel:
  - **A (Control):** Current production prompt.
  - **B (Challenger):** Experimental prompt (e.g., new Chain-of-Thought technique, different few-shot examples, restructured System Prompt).

- **Isolation:** Each variant runs in a separate sandbox (Branchlet worktree) to prevent cross-contamination.

---

## 3. Victory Criteria

The system compares results automatically using a weighted score:

| Criterion | Weight | Metric Source |
|:---|:---:|:---|
| **Quality** | 50% | Auditor `quality_score` |
| **Efficiency** | 20% | Number of TRM iterations (fewer = better) |
| **Thinking Cost**| 10% | Amount of reasoning tokens generated |
| **Cost** | 20% | Token consumption (`tokens_used`) |

**Formula:**
```
variant_score = (quality × 0.5) + ((1 / iterations) × 0.2) + ((1 / thinking_cost) × 0.1) + ((1 / cost) × 0.2)
```

**Statistical Significance:** A variant must win in at least 3 consecutive experiments or show p < 0.05 over 10+ experiments before promotion.

---

## 4. Automatic Promotion

If Variant B wins consistently:

1. The system flags the winning prompt.
2. **Branchlet** creates a Pull Request updating `07_Prompt_Engineering_Library.md` with the new best practice.
3. The old prompt is archived in `.prisma/learnings.json` with performance comparison data.
4. The new prompt becomes the Control for future experiments.

---

## 5. Learning Record

Each experiment generates a record:

```typescript
interface ExperimentRecord {
  experiment_id: string;
  task_id: string;
  control_prompt_hash: string;
  challenger_prompt_hash: string;
  control_score: number;
  challenger_score: number;
  winner: "CONTROL" | "CHALLENGER";
  improvement_percentage: number;
  promoted: boolean;
  timestamp: string;
}
```

Records are stored in `.prisma/learnings.json` and feed the KPI Dashboard (ref: `14_Factory_KPIs.md`).

---

*Specification generated under Prisma V4 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*