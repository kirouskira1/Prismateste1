# Prisma AI V4: Hybrid Architecture Whitepaper

**Classification:** REFERENCE  
**Codename:** `Whitepaper_Architecture`  
**Version:** V4  
**Context Layer:** Always (Strategic Foundation)  
**Est. Tokens:** ~800 tokens  

---

## 1. The New Identity (From Generator to Platform)

Prisma AI has evolved. We abandoned the idea of being merely a fast "MicroSaaS" generator. We now define ourselves as an **Autonomous Software Engineering Platform** that operates at two distinct levels of reality, fusing the technical precision of TRM with the business vision of SAP.

### Pillar 1: The "Build-Time" Engine (Our Factory)

This is the internal system that builds software. It is the "Master Craftsman."

- **Intelligence (TRM):** Based on the **TRM Cognitive Agent** (Tiny Recursive Model). Instead of using a linear assembly line, we use a single intelligent agent that operates in a loop of **recursive reasoning and self-correction**, ensuring code is audited before delivery.
- **Orchestration:** Managed via **LangGraph** (Pure Python), enabling complex cyclic flows that no-code tools cannot support.
- **Secure Memory (Internal RAG):** We use **Gemma Embedding (2b)** running locally via Docker + **pgvector**. This ensures data sovereignty: our Intellectual Property (Frameworks, Prompts) is never sent to public APIs.
- **Prototyping:** We use **Google Stitch** to generate the "Visual Source of Truth" (HTML) from prompts, eliminating design hallucinations.

### Pillar 2: The "Run-Time" Product (What We Deliver)

This is the software we deliver to the end client. It is the "Executive Team."

- **BPA Architecture (Business Process Automation):** We no longer deliver monolithic systems with hard-coded business rules. We deliver platforms composed of agents.
- **Policy Agents:** Business rules (e.g., approval limits, rate calculations) are encapsulated in agent microservices, not in `if/else` scattered through the code.
- **Client RAG (Rule Memory):** The client defines their rules in natural language (PDFs/TXTs). Policy Agents query this base in real-time to make decisions. This gives the client the power to alter software behavior without needing a developer.
- **Control Center:** The dashboard is not just for viewing data, but for supervising and training business agents.

---

## 2. Implementation Methodology (Bootstrapping)

How does Prisma build itself?

We use the **IDE Agent in Solo Mode** as the initial executor.

1. **Input:** The complete V4 Dossier (these documents) acts as the agent's "Implanted Memory."
2. **Process:** The agent simulates the **TRM Cognitive Agent**. For each task from the sprint plan, it:
   - Consults the relevant agent spec to know *how* to think.
   - Generates a draft.
   - **Self-Audits** using `04_Audit_Framework.md`.
   - Recursively refines the code until perfection or max iterations.
3. **Result:** Clean, secure, modular code faithful to the visual design.

---

## 3. Official V4 Technology Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| Orchestration | LangGraph (Python) | Complex cyclic agent flows |
| Internal RAG | Gemma 2b (Local/Docker) + pgvector | Secure IP embedding |
| Client RAG | Google File Search API | RAG-as-a-Service for client docs |
| Frontend | Next.js 15 (App Router) + Tailwind + MCPs | Server-first UI |
| Backend | Supabase (Auth, DB, RLS, Storage) | Data and auth layer |
| UI Components | Tremor (data) + Magic UI (effects) + shadcn/ui (functional) | Premium MCP catalog |
| Icons | lucide-react | Consistent iconography |
| Validation | Zod | Input schema validation |

---

*Whitepaper generated under Prisma V4 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*