# Architectural Decision Framework (ADR Generator)

**Classification:** REFERENCE  
**Codename:** `ADR_Framework`  
**Version:** V5.0  
**Context Layer:** Phase (Initial Triage)  
**Est. Tokens:** ~300 tokens  

> **Nota de desambiguação:** o campo `compilation_target` descrito abaixo (`"V3.1"` | `"V4"` | `"HYBRID"`) é um **rótulo fixo de perfil arquitetural** do projeto gerado, não relacionado à versão do Kernel Prisma (acima). "V4" aqui nunca deve ser lido como "versão desatualizada do framework" — é um nome de arquitetura permanente. Ver [[26_Version_Unification_Plan]].

---

## 1. The Decision Object (Output)

The Contextual Auditor returns a JSON that defines the factory's operation mode:

```json
{
  "decision_id": "uuid",
  "selected_target": "V4",
  "confidence_score": 0.95,
  "reasoning": "The briefing mentions financial compliance and approval hierarchies."
}
```

**Valid Targets:**
- `"V3.1"` — Service Logic (traditional SaaS, direct code).
- `"V4"` — Governance Logic (Policy Agents, RAG, audit trail).
- `"HYBRID"` — Mixed mode (V4 core + V3.1 modules).

---

## 2. Classification Heuristics

### ⚡ Signals for Target `V3.1` (Service Logic)

| Signal Type | Examples |
|:---|:---|
| Keywords | "MVP", "Prototype", "Fast", "Landing Page", "Simple CRUD" |
| Scenarios | Marketing tools, personal scripts, static sites |
| Risk Level | Low |
| Decision | Direct code implementation, no Policy Agents needed |

### 🛡️ Signals for Target `V4` (Governance Logic)

| Signal Type | Examples |
|:---|:---|
| Keywords | "Compliance", "Audit", "Regulation", "Approval", "Hierarchy" |
| Scenarios | Financial systems, HR, Healthcare, ERPs |
| Risk Level | High |
| Decision | Full Policy Agent architecture with RAG and audit_logs |

### 🔄 Signals for Target `HYBRID` (80/20 Rule)

| Signal Type | Examples |
|:---|:---|
| Scenario | Complex system with both static and volatile modules |
| Action | V4 core (Agents) + V3.1 modules (Fast Code) |
| Rule | If the rule is volatile AND requires textual/contextual judgment → Agent. If volatile but a single simple value (a limit, rate, or price with no judgment needed) → `business_config` lookup, no Agent required. If static (login, CRUD) → Code. See `05_Backend_Agent.md` §3.3 "The Rule Detector" for the full test. |

---

## 3. Decision Flow

```
RECEIVE project briefing
  │
  ├── Scan for V4 keywords (compliance, audit, approval...)
  │     └── Found? → selected_target = "V4"
  │
  ├── Scan for V3.1 keywords (MVP, prototype, landing...)
  │     └── Found? → selected_target = "V3.1"
  │
  ├── Mixed signals detected?
  │     └── Yes → selected_target = "HYBRID"
  │           → Tag volatile rules for Policy Agents
  │           → Tag static rules for direct code
  │
  └── Record decision in audit_logs with reasoning
```

---

*Framework generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*