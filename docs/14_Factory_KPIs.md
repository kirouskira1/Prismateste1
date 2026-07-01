# KPIs for the Prisma AI Engine (Self-Improvement)

**Classification:** REFERENCE  
**Codename:** `Factory_KPIs`  
**Version:** V4  
**Context Layer:** Always (Performance Monitoring)  
**Est. Tokens:** ~300 tokens  

---

## 1. Efficiency and Cost Metrics

| Metric | Description | Target |
|:---|:---|:---|
| **Token Cost per Task** | Total tokens spent to complete a `task_id` | Minimize |
| **Effort Level Utilizado** | Nível de esforço alocado (low a max) por tarefa para medir custo cognitivo | Otimizar |
| **Iteration Efficiency** | `Total Tasks / Total TRM Iterations` | Approach 1.0 |
| **Latency per Iteration** | Time (seconds) each self-audit cycle takes | Minimize |
| **Cost per Approved Artifact** | USD cost from tokens for a single approved output | Track trend |

---

## 2. Quality Metrics

| Metric | Description | Target |
|:---|:---|:---|
| **Zero-Shot Pass Rate (ZS-PR)** | Percentage of code passing self-audit on first attempt | Maximize (>60%) |
| **Compliance Failure Rate (CFR)** | Rate of failures related to "Hard-Coding Prohibition" | Minimize (<5%) |
| **Kill Switch Trigger Rate** | How often automatic score=0.0 is triggered | Minimize (<1%) |
| **Escalation Rate** | Percentage of tasks escalated to human | Track |

---

## 3. Evolution Metrics (Optimizer)

| Metric | Description | Target |
|:---|:---|:---|
| **Optimization Gain** | Percentage improvement (Cost/Quality) from A/B prompt tests | Positive trend |
| **Win Rate** | How often the "Challenger Prompt" beats the "Control Prompt" | Track |
| **Experiment Coverage** | Percentage of eligible tasks that run experiments | ~5% |

---

## 4. Log Structure (Dashboard Input)

Every Self-Audit event must be saved as a JSON record in `audit_logs` with:

```typescript
interface AuditMetricsLog {
  task_id: string;
  final_score: number;
  token_cost: number;
  effort_level: string;
  iteration_count: number;
  is_zero_shot: boolean;
  violation_reason: string | null;
  kill_switch_triggered: boolean;
  escalated: boolean;
  latency_ms: number;
  compilation_target: "V3.1" | "V4" | "HYBRID";
}
```

---

*KPI specification generated under Prisma V4 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*