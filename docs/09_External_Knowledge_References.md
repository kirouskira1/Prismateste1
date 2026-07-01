# External Knowledge References and Inspiration — Prisma V4

**Classification:** REFERENCE  
**Codename:** `External_References`  
**Version:** V4  
**Context Layer:** Always (Bibliography)  
**Est. Tokens:** ~700 tokens  

---

This document lists the primary sources, tools, and concepts that underpin the Prisma AI architecture. The TRM Cognitive Agent must use these references to align its reasoning and technical decisions.

---

## 1. Agent Philosophy and Reasoning (The "Brain")

### TRM (Tiny Recursive Model)
- **Source:** Paper *"Less is More: Recursive Reasoning with Tiny Networks"* (arXiv:2510.04871v1).
- **Key Concept:** Smaller models can outperform giant models when they use a recursive refinement process (`generate → critique → refine`).
- **Prisma Application:** Underpins our "Self-Audit Loop" and the decision to use a single intelligent agent instead of a linear chain.

### Autonomous Agent Architecture (SAP Strategy)
- **Source:** SAP BTP / Joule Studio documentation.
- **Key Concept:** Distinction between **Build-Time** (Agent Factory) and **Run-Time** (Process Execution). Use of "Policy Agents" to read business rules instead of hard-coding.
- **Prisma Application:** Defines the *product* we deliver: a Business Process Automation platform (BPA).

### Deep Agents & Subagents
- **Source:** LangChain research (`langchain-ai/deepagents`).
- **Key Concept:** Agent training via Reinforcement Learning and subtask delegation to specialists.

### Advanced Agent Practices (Adaptive-Informed)
- **Key Concept:** Adaptive Thinking (effort levels based on task), Anti-Collapse state filtering, and Fresh Eyes tiebreaker node.
- **Prisma Application:** Orchestrator task routing, Auditor isolation, and intelligent pausing without breaking autonomy.

---

## 2. Orchestration Tools and Libraries

### LangGraph
- **Function:** Cyclic orchestration framework in Python.
- **Application:** The "chassis" of our orchestrator, enabling loops and persistent state memory.

### Branchlet
- **Source:** GitHub `raghavpillai/branchlet`.
- **Function:** Library for conditional logic management and worktree (sandbox) creation.
- **Application:** Used to manage complex conditional transitions within the graph and to isolate code experiments.

---

## 3. Memory and RAG Infrastructure

### Google Embedding Gemma (Local)
- **Source:** Google Developers Blog (Introducing Embedding Gemma).
- **Function:** State-of-the-art, open-source embedding model.
- **Application:** Run locally via Docker to vectorize Prisma IP (`/docs`) with zero API cost and total data privacy (Golden Rule #3).

### Google File Search API (RAG-as-a-Service)
- **Source:** Gemini API Documentation.
- **Function:** Google-managed RAG.
- **Application:** Used *exclusively* in the client product (Pillar 2) to allow "Policy Agents" to query rule documents without us managing their vector infrastructure.

---

## 4. Design and Prototyping Tools (Design-First)

### Google Stitch
- **Source:** Google Developers Blog.
- **Function:** High-fidelity HTML/CSS prototype generation from text prompts.
- **Application:** Creates the "Visual Source of Truth" (`prototype.html`) that the agent refactors.

### Skip Design Extractor
- **Source:** Chrome Extension.
- **Application:** Used to extract HTML from real visual references (e.g., Magic UI, Agent Sky) to serve as a base for Stitch or direct refactoring.

### MCP Catalog (Premium Components)
- **Tremor UI:** (Dashboards & Data) — Standard for administrative areas.
- **Magic UI & Aceternity UI:** (Marketing & Effects) — Standard for Landing Pages and "Wow Factor."
- **shadcn/ui:** (Structure) — Standard for basic functional components.

---

## 5. Governance and Theoretical Foundations

### 5 Golden Rules for AI
- **Source:** AI Governance reference.
- **Key Concepts:** Visibility, Contextual Risk Assessment, Data Protection, Access Control, Continuous Monitoring.
- **Application:** Defines security policies in `05_Security_Governance_Policy.md`.

### Software 2.0 (Andrej Karpathy)
- **Key Concept:** The programmer stops writing imperative code and becomes the "teacher" who curates the dataset (RAG) and evaluates results (Audit).

### Classic Software Engineering
- **Myers' Rule of 10:** Bug correction cost increases exponentially over time. Economic justification for TRM's immediate self-audit.
- **Nielsen's 10 Heuristics:** Usability principles the Design Agent must verify.

---

*References compiled under Prisma V4 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*