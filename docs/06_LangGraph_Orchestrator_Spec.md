# LangGraph Orchestrator Specification

**Classification:** REFERENCE  
**Codename:** `LangGraph_Orchestrator`  
**Version:** V5.0 (Loop Architecture + Fable Patterns)  
**Context Layer:** Phase (Orchestration Setup)  

> ⚠️ **Modo não ativo neste projeto.** `prisma.config.json` declara `"execution_mode": "SOLO"` — este documento especifica o orquestrador **Multi-Agent via LangGraph/Python**, um modo alternativo de execução ainda não em uso aqui. Agentes de IA não devem assumir que este é o modo de orquestração corrente; consulte `.prisma/state.json` (`execution_mode`) para o modo real da sessão.

---

This document defines the architecture of the "Micro-Orchestrator" in Python. It is the engine that executes the TRM reasoning cycle to build Prisma AI. Updated in V4.3 with Loop Architecture innovations: dynamic rubric state, model routing, task-type routing (incl. SPRINT_ZERO), Fresh Eyes tiebreaker node, and anti-collapse state filtering.

---

## 1. State Definition (AgentState)

The state object must carry the project context, financial/quality control metrics, and adaptive-informed fields.

```python
from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    # --- Project Context (Input) ---
    job_id: str                  # UUID from the job
    project_context: Dict        # Briefing data (entities, flows)
    current_task: Dict           # Active task from sprint plan
    
    # --- Session Isolation ---
    active_session_id: str
    session_path: str
    
    # --- Telemetry Stream ---
    telemetry_log: List[Dict]    # Append-only list of TELEMETRY_EVENT payloads
    
    # --- Architecture Control (V4) ---
    compilation_target: str      # 'V3.1', 'V4' or 'HYBRID' (Set during Triage)
    risk_level: str              # 'LOW', 'MEDIUM', 'HIGH'
    
    # --- Task Type Router (Adaptive-Informed) ---
    task_type: str               # 'EXECUTION_ONLY', 'DEEP_READ', 'CREATION', 'HYBRID', 'DESIGN_FIRST', 'SPRINT_ZERO'
    
    # --- Resource Control (Optimization) ---
    token_budget: float          # Spending limit for the task
    current_cost: float          # Accumulated cost
    
    # --- TRM Working Memory (Recursive Loop) ---
    code_draft: str              # Generated code (y)
    reasoning_trace: str         # Step-by-step rationale (z)
    audit_feedback: str          # Auditor return (critique)
    quality_score: float         # Score 0.0 to 10.0
    iteration_count: int         # Attempt counter (Max: configurable)
    
    # --- Fresh Eyes (Adaptive-Informed) ---
    fresh_eyes_used: bool        # Has Fresh Eyes been triggered?
    fresh_eyes_bonus: bool       # Was bonus iteration granted?
    root_cause_finding: Optional[str]  # What Fresh Eyes found
    
    # --- Dynamic Rubric (Loop Architecture) ---
    task_specific_rubric: List[str]     # 3-5 boolean criteria from Architect
    rubric_results: Optional[List[Dict]]  # Auditor's evaluation of each criterion
    
    # --- Model Routing (Multi-Vendor Orchestration) ---
    model_config: Dict[str, str]       # Maps AgentRole → model_name
                                       # e.g. {"TRM_WORKER": "claude-3.5-sonnet",
                                       #        "AUDITOR_TRM": "gpt-4o"}
    
    # --- Tools ---
    rag_context: str             # Snippets retrieved from RAG pipeline
    visual_context: str          # Stitch prototype HTML
```

---

## 2. Graph Topology (Nodes)

### A. Node: `Contextual_Auditor` (Initial Triage)
- **Function:** Analyzes `project_context` and defines `compilation_target`.
- **Rule:** If briefing contains "compliance", "audit-trail", or "approval hierarchy" → Target = `V4`.

### B. Node: `Task_Router` (Adaptive-Informed)
- **Function:** Classifies `current_task` into task types before entering the TRM loop.
- **Rule:** Maps task description to `EXECUTION_ONLY`, `DEEP_READ`, `CREATION`, `HYBRID`, `DESIGN_FIRST`, or `SPRINT_ZERO`. Sets `effort_level` accordingly.
- **Edge:** Routes directly to execution (bypass TRM), `TRM_Worker`, or `Design_Agent`.

### C. Node: `TRM_Worker` (The Builder)
- **Function:** Generates the code.
- **Inputs:** `current_task` + `rag_context` + `visual_context`.
- **Action:**
  1. Consults `03_MCP_Component_Registry.md` to map visual HTML.
  2. Generates code (e.g., `page.tsx` or `policy-agent.ts`).
  3. Records `reasoning_trace`.

### D. Node: `Auditor` (The Conscience)
- **Function:** Validates `code_draft`.
- **Inputs:** Generated code + `04_Audit_Framework.md`.
- **Anti-Collapse:** The Auditor node receives a **filtered state** — the `reasoning_trace` key is explicitly removed before passing state to this node. This prevents orchestration collapse.
- **Output:** Updates `quality_score` and `audit_feedback`.

### E. Node: `Design_Agent` (Factory 1)
- **Function:** Handles `DESIGN_FIRST` tasks (converting images/wireframes to PRD Visual).
- **Rule:** Bypasses TRM Loop. Outputs a specification document.
- **Output:** Updates `project_context` with PRD Visual.

### F. Node: `Scout_Agent`
- **Function:** Handles `RESEARCH` tasks (web search, docs parsing).
- **Rule:** Bypasses TRM Worker. Does not write code.
- **Output:** Emits a `ScoutReportPayload` and updates `project_context` with intelligence before returning to Architect.

### A. `filter_state_for_auditor(state: AgentState) -> AgentState`
- **Function:** Enforces the Anti-Collapse guardrail by creating an isolated view of the state.
- **Rule:** 
  1. Deletes `reasoning_trace` completely.
  2. Deletes `session_path` so the Auditor cannot peek into the worker's temporal folder.
  3. Preserves `task_specific_rubric`.
- **Why:** The Auditor must evaluate the raw output (`code_draft`) against the framework, unaffected by the Worker's logic or internal scratchpad.

```python
def filter_state_for_auditor(state: AgentState) -> AgentState:
    """Anti-Collapse: Remove Worker's reasoning from Auditor's view.
    Preserve task_specific_rubric — the Auditor MUST see it."""
    filtered = dict(state)
    filtered.pop('reasoning_trace', None)
    filtered.pop('session_path', None)
    # task_specific_rubric is intentionally KEPT in filtered state.
    # The rubric flows: Architect → State → Auditor (never to Worker).
    return filtered

def filter_state_for_worker(state: AgentState) -> dict:
    """Remove rubric from Worker's view to prevent gaming."""
    filtered = dict(state)
    filtered.pop('task_specific_rubric', None)  # Worker must not see grading criteria
    filtered.pop('rubric_results', None)         # No previous rubric evaluations
    return filtered
```

### E. Node: `Fresh_Eyes_Tiebreaker` (Adaptive-Informed)
- **Function:** Invoked when the standard TRM loop exhausts all iterations without success.
- **Inputs:** ONLY `code_draft` (final version) + `current_task` (original). No iteration history.
- **Action:**
  1. Reviews code from zero — no bias from previous feedback.
  2. Identifies root cause (may differ from prior audit findings).
  3. If root cause is fundamentally different → grants bonus iteration.
- **Output:** Updates `root_cause_finding`, may set `fresh_eyes_bonus = True`.

---

## 3. Conditional Logic (Edges)

Transitions use declarative routing:

```python
def route_task_type(state: AgentState) -> str:
    """Route based on task type before entering TRM loop."""
    task_type = state.get('task_type', 'CREATION')
    
    if task_type == 'EXECUTION_ONLY':
        return "execute_directly"
    elif task_type == 'DEEP_READ':
        return "deep_read"
    elif task_type == 'HYBRID':
        return "decompose_task"
    elif task_type == 'DESIGN_FIRST':
        return "design_agent"
    elif task_type == 'SPRINT_ZERO':
        return "sprint_zero"
    elif task_type == 'RESEARCH':
        return "scout_agent"
    else:
        # EXECUTION_ONLY or others
        return "direct_execution"

def route_after_audit(state: AgentState) -> str:
    """Route based on audit score, with Fresh Eyes support."""
    max_attempts = state.get('max_audit_attempts', 3)
    
    # Success: High quality
    if state['quality_score'] >= 9.5:
        return "finalize_task"
    
    # Standard refinement: Low quality but within limit
    if state['iteration_count'] < max_attempts:
        return "retry_refinement"  # Back to TRM_Worker
    
    # Fresh Eyes: Max attempts reached, try tiebreaker
    if not state.get('fresh_eyes_used', False):
        return "fresh_eyes_tiebreaker"
    
    # Bonus iteration from Fresh Eyes
    if state.get('fresh_eyes_bonus', False) and not state.get('bonus_used', False):
        return "retry_with_root_cause"  # One more try with new insight
    
    # Critical Failure: All options exhausted → Human
    return "escalate_to_human"
```

---

## 4. API Contract (External Integration)

- **Input:** `POST /run-task` — Receives the project JSON.
- **Output:** Webhook with status and link to generated artifact.

---

## 5. Asynchronous Bus & LangGraph Checkpoints (V5.0)

**Insight:** In production, agents must not run on synchronous HTTP requests. A full TRM loop with model fallbacks can take 3-5 minutes. The Orchestrator must be decoupled via an asynchronous bus.

### 5.1 Checkpoint Architecture
The LangGraph `checkpointer` must use PostgreSQL (Supabase). This ensures:
1. **Fault Tolerance:** If a worker node crashes mid-generation, a new instance resumes from the exact last state.
2. **Human-in-the-loop (Escalation):** When the Orchestrator hits the `escalate_to_human` node, it writes the state to the checkpoint and pauses. The API can resume the graph using `thread_id` once the human approves.

### 5.2 Event Stream Webhooks
Instead of waiting for a single output, the Orchestrator emits `TELEMETRY_EVENT` items to an Event Bus (e.g., Redis or Kafka, depending on scale).
- Client dashboards connect via WebSocket to the Event Bus to render real-time logs (e.g., "Agent is thinking...", "Auditor rejected code: Zod missing").

---

*Specification generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*