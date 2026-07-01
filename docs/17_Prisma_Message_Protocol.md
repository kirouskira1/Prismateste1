# Prisma Message Protocol (Inter-Agent Communication)

**Classification:** REFERENCE  
**Codename:** `Message_Protocol`  
**Version:** V4.5 (Loop Architecture + Fable Patterns)  
**Context Layer:** Always (Communication Standard)  

---

## 1. Purpose

This document defines the standardized message format for communication between Prisma V4.5 agents. Whether agents run in Solo mode (simulated context switching) or Multi mode (real subagent delegation), all inter-agent data exchange MUST follow this protocol.

**Why this matters:**
- In Solo mode, the message format structures the agent's internal reasoning.
- In Multi mode, it becomes the actual data payload between LangGraph nodes.
- In Headless mode, it becomes the API contract for CI/CD pipelines.

---

## 2. Core Message Type

```typescript
/**
 * PrismaMessage: The universal envelope for all inter-agent communication.
 * Every message between agents flows through this structure.
 */
interface PrismaMessage {
  // === Identity ===
  message_id: string;                    // UUID v4
  timestamp: string;                     // ISO-8601
  
  // === Routing ===
  from: AgentRole;                       // Sending agent
  to: AgentRole;                         // Target agent
  type: MessageType;                     // What kind of message
  priority: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
  
  // === Payload ===
  task_id: string;                       // Links to sprint task
  payload: MessagePayload;              // Type-specific content
  
  // === Context ===
  session_id: string;                    // Links to .prisma/state.json
  compilation_target: "V3.1" | "V4" | "HYBRID";
  iteration: number;                     // Current TRM loop iteration
  effort_level: "low" | "medium" | "high" | "xhigh" | "max";
}

type AgentRole =
  | "ORCHESTRATOR"
  | "ARCHITECT_TRM"
  | "TRM_WORKER"
  | "AUDITOR_TRM"
  | "BACKEND_AGENT"
  | "DESIGN_AGENT"
  | "SECURITY_AGENT"
  | "POLICY_AGENT"
  | "WATCHER_AGENT"              // V4.3 — Autonomous monitoring agent
  | "SCOUT_AGENT";               // V4.4 — Intelligence gathering agent

type MessageType =
  | "TASK_ASSIGNMENT"        // Orchestrator → Agent: "Do this task"
  | "TASK_DELIVERY"          // Agent → Orchestrator: "Here's my output"
  | "AUDIT_REQUEST"          // Worker → Auditor: "Review this code"
  | "AUDIT_RESULT"           // Auditor → Worker/Orchestrator: "Verdict"
  | "CONTEXT_REQUEST"        // Agent → RAG/Agent: "I need context"
  | "CONTEXT_RESPONSE"       // RAG/Agent → Agent: "Here's context"
  | "SECURITY_CHECK"         // Backend → Security: "Is this safe?"
  | "SECURITY_RESULT"        // Security → Backend: "Safe/Blocked"
  | "POLICY_QUERY"           // Backend → Policy: "What should I do?"
  | "POLICY_DECISION"        // Policy → Backend: "Do this"
  | "DESIGN_FIRST"           // Orchestrator → Design: "Generate PRD from Vision"
  | "ESCALATION"             // Any → Orchestrator: "I need human help"
  | "GATEWAY_CHECK"          // Orchestrator → Auditor: "Run gateway"
  | "GATEWAY_RESULT"         // Auditor → Orchestrator: "Pass/Fail"
  | "STATE_UPDATE"           // Orchestrator → State: "Update state"
  | "TASK_ROUTING"           // Orchestrator → Router: "Classify this task"
  | "FRESH_EYES_AUDIT"       // Orchestrator → Fresh Auditor: "Zero-state review"
  | "CONTEXT_BREAK"          // Orchestrator → Self: "Anti-collapse marker"
  | "RUBRIC_GENERATION"      // V4.3 — Architect → Orchestrator: "Here's the task rubric"
  | "INCIDENT_BRIEFING"      // V4.3 — Watcher → Orchestrator: "Anomaly detected"
  | "WATCHER_ALERT"          // V4.3 — Watcher → Human: "Threshold breached"
  | "SESSION_START"          // V4.4 — Orchestrator → State: "Create session folder"
  | "SESSION_END"            // V4.4 — Orchestrator → State: "Archive session folder"
  | "SCOUT_MISSION"          // V4.4 — Architect → Scout: "Research this topic"
  | "SCOUT_REPORT"           // V4.4 — Scout → Architect: "Here are the findings"
  | "TELEMETRY_EVENT";       // V4.4 — Any → Watcher/State: "Observable action occurred"
```

---

## 3. Payload Schemas (By Message Type)

### 3.1 TASK_ASSIGNMENT

```typescript
interface TaskAssignmentPayload {
  task_description: string;
  task_type: "DOCUMENT" | "SQL" | "SERVER_ACTION" | "UI_COMPONENT" | "POLICY_AGENT" | "AUDIT";
  sprint_reference: string;              // "Phase 2 — Sprint 2.1"
  context: {
    rag_context?: string;                // RAG snippets
    visual_context?: string;             // Stitch HTML
    schema_context?: string;             // SQL schema
    sprint_zero_artifacts?: string[];    // Paths to relevant artifacts
  };
  constraints: {
    max_iterations: number;              // Default: 3
    deadline_priority: "CRITICAL" | "HIGH" | "NORMAL";
  };
  // V4.3 — Dynamic Rubric (Loop Architecture)
  task_specific_rubric?: string[];       // 3-5 boolean criteria from Architect
                                         // NEVER included when target is Worker
                                         // ALWAYS included when target is Auditor
}
```

### 3.2 TASK_DELIVERY

```typescript
interface TaskDeliveryPayload {
  code_draft: string;
  file_path: string;
  reasoning_trace: string;
  self_check: {
    compiles_mentally: boolean;
    zero_any: boolean;
    imports_valid: boolean;
    naming_consistent: boolean;
    use_server_present?: boolean;         // For Server Actions
    action_response_typed?: boolean;      // For Server Actions
  };
  factory_used: "FACTORY_1" | "FACTORY_2";
  components_used?: string[];            // MCP components (for UI tasks)
}
```

### 3.3 AUDIT_RESULT

```typescript
interface AuditResultPayload {
  verdict: "APPROVED" | "REJECTED" | "ESCALATED";
  quality_score: number;                  // 0.0 to 10.0
  violations: Array<{
    category: string;
    rule_violated: string;
    evidence: string;
    expected_behavior: string;
    severity: "CRITICAL" | "MAJOR" | "MINOR";
  }>;
  is_zero_shot: boolean;
  remediation_guidance?: string;          // For REJECTED
  escalation_reason?: string;             // For ESCALATED
  // V4.3 — Dynamic Rubric Results
  rubric_results?: Array<{               // How each dynamic criterion was evaluated
    criterion_id: string;                // "R1", "R2", etc.
    passed: boolean;                     // Pass/fail for this criterion
    evidence?: string;                   // Line number or code snippet
  }>;
}
```

### 3.4 POLICY_DECISION

```typescript
interface PolicyDecisionPayload {
  decision: "APPROVED" | "REJECTED" | "ESCALATED";
  action?: string;
  value?: number;
  reason: string;
  citation: {
    file_name: string;
    page?: number;
    snippet: string;
  };
  confidence: number;
  agent_id: string;
  latency_ms: number;
  tokens_used: number;
}
```

### 3.5 ESCALATION

```typescript
interface EscalationPayload {
  severity: "WARNING" | "CRITICAL";
  reason: string;
  source_context: string;
  iteration_history?: Array<{
    iteration: number;
    score: number;
    primary_violation: string;
  }>;
  recommended_action: string;
  requires_human_decision: boolean;
}
```

### 3.6 TASK_ROUTING (V4.2 — Adaptive-Informed)

```typescript
interface TaskRoutingPayload {
  task_description: string;
  classified_type: "EXECUTION_ONLY" | "DEEP_READ" | "CREATION" | "HYBRID" | "DESIGN_FIRST" | "SPRINT_ZERO";
  reasoning: string;                     // Why this classification
  sub_tasks?: TaskRoutingPayload[];     // For HYBRID decomposition
  skip_audit_loop: boolean;              // True for EXECUTION_ONLY and DEEP_READ
}
```

### 3.7 FRESH_EYES_AUDIT (V4.2 — Adaptive-Informed)

```typescript
interface FreshEyesAuditPayload {
  code_draft: string;                    // ONLY the final version
  original_task: string;                 // ONLY the original description
  // NOTE: No iteration_history, no previous feedback, no reasoning_trace
  // The Fresh Eyes auditor sees ZERO context from prior attempts
  audit_type: "FRESH_EYES";
  previous_iterations_count: number;     // How many attempts preceded this
}
```

### 3.8 CONTEXT_BREAK (V4.2 — Adaptive-Informed)

```typescript
interface ContextBreakPayload {
  from_role: AgentRole;                  // Which hat is being removed
  to_role: AgentRole;                    // Which hat is being put on
  anti_collapse_instruction: string;     // The context break text
  files_to_discard: string[];           // Docs to unload from context
  files_to_load: string[];              // Docs to load for new hat
}
```

### 3.9 DESIGN_FIRST_PRD (V4.2 — Adaptive-Informed)

```typescript
interface DesignFirstPrdPayload {
  visual_reference: string;              // HTML string or image path
  extracted_palette: string[];           // Colors mapped to Blue Midnight
  detected_components: string[];         // Mapped to MCP registry
  negative_constraints: string[];        // What NOT to build
  approval_status: "PENDING" | "APPROVED";
}
```

### 3.10 INCIDENT_BRIEFING (V4.3 — Watcher Agent)

```typescript
interface IncidentBriefingPayload {
  incident_id: string;                    // UUID
  severity: "INFO" | "WARNING" | "CRITICAL";
  domain: "COST" | "PERFORMANCE" | "QUALITY" | "SECURITY";
  summary: string;                        // Human-readable one-liner
  evidence: {
    metric_name: string;                  // What was measured
    current_value: number;                // What was observed
    threshold_value: number;              // What the limit is
    trend?: "RISING" | "FALLING" | "STABLE";
    time_window: string;                  // "last_24h", "last_7d", etc.
  };
  affected_entities: string[];            // User IDs, project IDs, agent IDs
  recommended_action: string;             // What should happen next
  auto_actionable: boolean;               // Can Orchestrator handle without human?
  timestamp: string;                      // ISO-8601 — when the anomaly was detected
}
```

### 3.11 WATCHER_ALERT (V4.3 — Watcher Agent)

```typescript
interface WatcherAlertPayload {
  alert_id: string;                       // UUID
  severity: "WARNING" | "CRITICAL";
  incidents: IncidentBriefingPayload[];   // One or more related incidents
  overall_health: "HEALTHY" | "WARNING" | "CRITICAL";
  metrics_snapshot: {
    total_tokens_consumed: number;
    total_cost_usd: number;
    avg_audit_score: number;
    rejection_rate: number;
    escalation_rate: number;
  };
  requires_human_action: boolean;
}
```

### 3.13 SCOUT_MISSION (V4.4)

```typescript
interface ScoutMissionPayload {
  mission_type: "UI_SCOUT" | "ENGINEERING_SCOUT" | "DOCS_SCOUT";
  query: string;
  scope_restrictions: string[];           // What NOT to research
  max_sources: number;                    // Default: 3
}
```

### 3.14 SCOUT_REPORT (V4.4)

```typescript
interface ScoutReportPayload {
  findings: string[];                     // The actual intelligence
  sources: Array<{ url: string; context: string }>; // Mandatory citations
  recommendations: string[];              // How to apply this to the code
  confidence_score: number;               // 0-100
}
```

### 3.15 TELEMETRY_EVENT (V4.4)

```typescript
interface TelemetryEventPayload {
  event_type: "TASK_START" | "TASK_END" | "AUDIT_PASS" | "AUDIT_FAIL" | "FRESH_EYES_TRIGGER" | "ESCALATION" | "SCOUT_RETURN";
  agent_role: AgentRole;
  task_id: string;
  session_id: string;
  timestamp: string;                      // ISO-8601
  duration_ms?: number;                   // Execution time
  metadata?: Record<string, unknown>;     // E.g., { "score": 9.2 }
}
```

---

## 4. Message Flow Patterns

### 4.1 Standard Build Flow (Happy Path)

```
Orchestrator ──TASK_ROUTING────► Task Router
Task Router  ──TASK_ASSIGNMENT──► TRM_Worker
TRM_Worker   ──CONTEXT_REQUEST──► RAG Pipeline
RAG Pipeline ──CONTEXT_RESPONSE─► TRM_Worker
TRM_Worker   ──TASK_DELIVERY────► Orchestrator
Orchestrator ──CONTEXT_BREAK────► Self (anti-collapse)
Orchestrator ──AUDIT_REQUEST────► Auditor_TRM
Auditor_TRM  ──AUDIT_RESULT─────► Orchestrator
  │
  ├── APPROVED → Orchestrator advances sprint
  └── REJECTED → Orchestrator re-routes to TRM_Worker with feedback
```

### 4.2 V4 Policy Flow

```
Orchestrator ──TASK_ASSIGNMENT──► Backend_Agent
Backend_Agent──SECURITY_CHECK───► Security_Agent
Security_Agent─SECURITY_RESULT──► Backend_Agent
  │
  ├── BLOCKED → Backend_Agent ──ESCALATION──► Orchestrator
  └── SAFE    → Continue
       │
       Backend_Agent──POLICY_QUERY────► Policy_Agent
       Policy_Agent ──POLICY_DECISION─► Backend_Agent
       Backend_Agent──TASK_DELIVERY───► Orchestrator
       Orchestrator ──AUDIT_REQUEST───► Auditor_TRM
       ...
```

### 4.3 Fresh Eyes Flow (V4.2 — Adaptive-Informed)

```
Orchestrator ──AUDIT_REQUEST────► Auditor_TRM (iteration 3)
Auditor_TRM  ──AUDIT_RESULT─────► Orchestrator (REJECTED, score < 9.5)
  │
  └── iteration >= max → FRESH EYES TRIGGERED
       │
       Orchestrator ──FRESH_EYES_AUDIT──► NEW Auditor_TRM (zero state)
       NEW Auditor  ──AUDIT_RESULT──────► Orchestrator
         │
         ├── Root cause different? → BONUS iteration granted
         │     Orchestrator ──TASK_ASSIGNMENT──► TRM_Worker (with root cause only)
         │     TRM_Worker   ──TASK_DELIVERY────► Orchestrator
         │     Orchestrator ──AUDIT_REQUEST────► Auditor_TRM
         │     ...
         │
         └── Same issues → ESCALATE TO HUMAN
```

### 4.4 Gateway Flow

```
Orchestrator ──GATEWAY_CHECK───► Auditor_TRM
Auditor_TRM  ──GATEWAY_RESULT──► Orchestrator
  │
  ├── PASSED → Orchestrator ──STATE_UPDATE──► .prisma/state.json
  │            Advance to next Phase
  └── FAILED → Orchestrator identifies failures
               Routes fix tasks to appropriate agents
               Re-runs GATEWAY_CHECK after fixes
```

### 4.5 Watcher Flow (V4.3 — Autonomous Monitoring)

```
Watcher_Agent ──[Scheduled/Manual]──► SQL Views (read-only)
  │
  ├── No anomalies → Log health snapshot to learnings.json
  │
  └── Anomaly detected:
       │
       ├── severity = INFO
       │     → Log only (passive)
       │
       ├── severity = WARNING
       │     → Watcher ──INCIDENT_BRIEFING──► Orchestrator
       │       Orchestrator logs, notifies user next session
       │
       └── severity = CRITICAL
             → Watcher ──INCIDENT_BRIEFING──► Orchestrator
             → [Watcher] → (`WATCHER_ALERT`) → [Human Supervisor]
             → Orchestrator may pause affected operations
```

### 4.7 Scout Research Flow (V4.4)

Occurs when the Architect encounters a task requiring external verification before planning.

```
[Architect]
   │
   ├── (1) Needs intelligence → Sends `SCOUT_MISSION` to Orchestrator
   ▼
[Orchestrator]
   │
   ├── (2) Routes to Scout Agent
   ▼
[Scout Agent]
   │
   ├── (3) Executes web search & reads URLs
   ├── (4) Synthesizes findings and cites sources
   ├── (5) Emits `SCOUT_REPORT`
   ▼
[Orchestrator]
   │
   ├── (6) Forwards report to Architect
   ▼
[Architect] (Incorporates findings into 10_Implementation_Plan.md)
```

### 4.8 Telemetry Ingestion Flow (V4.4)

Provides real-time event streaming for the Watcher Agent and future Dashboards, bypassing SQL delays.

```
[Any Agent or Orchestrator]
   │
   ├── (1) Important action occurs (e.g. Audit Fail)
   ├── (2) Emits `TELEMETRY_EVENT` to event bus
   ▼
[Watcher Agent]
   │
   ├── (3) Ingests stream to detect rapid failure loops
   ▼
[Dashboard UI] (Future)
   ├── Renders live progress timeline
```

---

## 5. Solo Mode Adaptation

In Solo mode (single IDE agent), messages are not sent over a bus — they are **simulated as structured reasoning blocks**:

```markdown
## Reasoning Step (Simulated PrismaMessage)

**From:** ORCHESTRATOR → **To:** TRM_WORKER  
**Type:** TASK_ASSIGNMENT | **Priority:** NORMAL  
**Task:** Implement createProject Server Action  
**Context:** Sprint Zero Artifact 3, Section: createProject  
**Constraints:** max_iterations=3

---

### Worker Response (Simulated TASK_DELIVERY)

**reasoning_trace:** "I need to create a Server Action with 'use server' on line 1..."
**code_draft:** [generated code]
**self_check:** { compiles_mentally: true, zero_any: true, ... }

---

### Context Break (Simulated CONTEXT_BREAK)

**from_role:** TRM_WORKER → **to_role:** AUDITOR_TRM
**anti_collapse_instruction:** "You are now a DIFFERENT agent..."
**files_to_discard:** [reasoning_trace, Implementation_Plan]
**files_to_load:** [Audit_Framework, Security_Policy]
```

This simulation ensures that even in Solo mode, the agent follows the same routing and audit logic as Multi mode.

---

## 6. Message Validation Rules

1. **Required Fields:** Every PrismaMessage MUST have `message_id`, `from`, `to`, `type`, `task_id`, and `session_id`. Missing fields = rejected message.
2. **Type Safety:** `payload` must match the declared `type`. A `TASK_ASSIGNMENT` message with an `AuditResultPayload` is invalid.
3. **Iteration Tracking:** The `iteration` field must increment monotonically within a task. Resetting to 0 mid-task is invalid.
4. **Priority Respect:** `CRITICAL` messages are processed before `HIGH`, which are processed before `NORMAL`. The Orchestrator enforces this ordering.
5. **Audit Trail:** Every message is logged for traceability. In Multi mode, messages are persisted in `audit_logs`. In Solo mode, they appear in the `reasoning_trace`.
6. **Anti-Collapse Enforcement:** A `CONTEXT_BREAK` message MUST precede every `AUDIT_REQUEST` or `FRESH_EYES_AUDIT` message. An audit without a prior context break is invalid.
7. **Access List Enforcement:** Every `TASK_ASSIGNMENT` must respect the `<access_list>` for the target agent role. Files in `<never_load>` MUST NOT appear in the message payload.

---

*Protocol generated under Prisma V4.5 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*
