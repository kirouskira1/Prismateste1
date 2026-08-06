# UX Specification: Agent Control Center — Prisma V4

**Classification:** REFERENCE  
**Codename:** `Agent_Dashboard_Wireframe`  
**Version:** V5.0  
**Context Layer:** Task (UI Design)  
**Est. Tokens:** ~300 tokens  

---

This document defines the visual and functional structure of the Governance Dashboard.

---

## 1. Visual Concept

- **Style:** "Mission Control." Dark background (`bg-slate-950`), medium information density, focus on text and status.
- **Metaphor:** This is not a car dashboard (speed). It is a control tower panel (safety and traffic).
- **Palette:** Blue Midnight tokens (ref: `04_Design_Agent.md` §3.1).

---

## 2. "My Agents" Screen Structure

- **Header:** System health summary (e.g., "All 3 agents operational").
- **Agent Grid:** Individual cards for each Policy Agent.
  - *Card Content:* Name, Icon, Status (`Badge`: Online/Training/Paused/Error), Last Activity (timestamp).
  - *Actions:* "Configure Rules", "View Logs", "Pause".
- **Components:** Tremor `<Card>` + `<Badge>` + `<Text>`.

---

## 3. "Audit Logs" Screen Structure

- **Objective:** Radical Transparency.
- **Layout:** Master-Detail.
  - *Left Panel:* Chronological list of events/decisions (shadcn `DataTable`).
  - *Right Panel (Preview):* Details of the selected decision.
- **Citation Highlight:** The "Rule Citation" must be visually highlighted (e.g., `amber-100/10` background) to prove the AI did not hallucinate.
- **Human Feedback:** `👍 / 👎` buttons next to each decision for RLHF (Refinement).
- **Decision Details:**
  - Agent name and decision timestamp.
  - `reasoning_text` — full explanation.
  - `citation_metadata` — file name, page, exact snippet.
  - `confidence` score and `latency_ms`.

---

## 4. "Rule Simulator" Screen Structure (Playground)

- **Input:** Text area for typing a scenario (e.g., "Order of $2000").
- **Selector:** Choose which rule file to use (Production or Draft).
- **Output:** Shows the agent's simulated decision and which rule was activated.
- **Use Case:** Client can test rule changes before publishing.

---

*Wireframe specification generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*