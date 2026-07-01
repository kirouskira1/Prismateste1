# Execution Playbook — Prisma V4

**Classification:** REFERENCE  
**Codename:** `Execution_Playbook`  
**Version:** V4  
**Context Layer:** Always (Execution Order)  
**Est. Tokens:** ~600 tokens  

---

**Phase:** Code Implementation with Continuous Audit  
**Golden Rule:** Strict Single-Artifact Cadence (one file at a time).

This document governs the construction pipeline. The coding AI must execute the project from the "structural core" to the "visual shell" (Backend-First), stopping mandatorily at **Audit Gateways** before changing phases.

---

## PHASE 1: INFRASTRUCTURE & CONFIGURATION (BOOTSTRAP)

*Objective: Prepare the ecosystem.*

- **Sprint 1.1:** Generate terminal commands to initialize Next.js 15, install Supabase, Tailwind, shadcn/ui, and lucide-react.
- **Sprint 1.2:** Generate `.env.local` file (keys only, no real values).
- **Sprint 1.3:** Configure Supabase utilities (`src/lib/supabase/server.ts` and `client.ts`).
- **Sprint 1.4:** Configure theme (Tailwind Config and `globals.css` for Dark Mode / Blue Midnight).

> 🛑 **AUDIT GATEWAY 1 (Infra):** The AI must internally validate: "Are Supabase keys in client.ts using the `NEXT_PUBLIC_` prefix to prevent leaks?"
> *Action:* Pausa Inteligente — Prossiga automaticamente se o gateway passar. Pause e peça permissão APENAS em falha crítica ou se for uma ação irreversível.

---

## PHASE 2: DATA LAYER & SECURITY (FACTORY 2)

*Objective: Build the impenetrable foundation. Ref: `schemas/02_Initial_Schema_V4.sql`.*

- **Sprint 2.1:** Generate `.sql` script for tables, relationships, and enum creation.
- **Sprint 2.2:** Generate `.sql` script for **Row Level Security (RLS)**.

> 🛑 **AUDIT GATEWAY 2 (Security):** The AI must internally validate: "Is there any table without RLS enabled? Is user data properly isolated to read only their own records?"
> *Action:* Pausa Inteligente — Prossiga automaticamente se o gateway passar. Pause e peça permissão APENAS em falha crítica ou se for uma ação irreversível.

---

## PHASE 3: SERVER ACTIONS & API CONTRACTS (FACTORY 2)

*Objective: Create business logic without touching the UI. Ref: `schemas/03_OpenAPI_V4.yaml`.*

- **Sprint 3.1:** Generate `/actions/auth.ts` (Supabase SSR Authentication Logic).
- **Sprint 3.2:** Generate main business actions (CRUDs, operations) in `/actions`.
- **Sprint 3.3:** Generate external integrations (`/actions/integrations.ts` or Policy Agent calls).

> 🛑 **AUDIT GATEWAY 3 (Data Contract):** The AI must internally validate: "Do all exported functions have the `"use server"` directive on line 1? Do all return `ActionResponse<T>` with `{ success, data, error }`?"
> *Action:* Pausa Inteligente — Prossiga automaticamente se o gateway passar. Pause e peça permissão APENAS em falha crítica ou se for uma ação irreversível.

---

## PHASE 4: SERVER-SIDE INTERFACE (FACTORY 1)

*Objective: Create the static visual structure with ultra-high performance. Ref: `03_MCP_Component_Registry.md`.*

- **Sprint 4.1:** Generate Root Layout (`layout.tsx`).
- **Sprint 4.2:** Generate nested Layouts (e.g., Sidebar navigation in `/dashboard/layout.tsx`).
- **Sprint 4.3:** Generate main Pages (`page.tsx`). They must consume Server Actions (Phase 3) data directly on the server, without `useEffect`.

> 🛑 **AUDIT GATEWAY 4 (Performance):** The AI must internally validate: "Did I put the `"use client"` directive on an entire page by mistake? Is the layout respecting native Dark Mode?"
> *Action:* Pausa Inteligente — Prossiga automaticamente se o gateway passar. Pause e peça permissão APENAS em falha crítica ou se for uma ação irreversível.

---

## PHASE 5: CLIENT-SIDE INTERACTIVITY (FACTORY 1)

*Objective: Hydrate the system with buttons, modals, and forms.*

- **Sprint 5.1:** Generate interactive components (`src/components/forms/`, `src/components/ui/`).
- **Sprint 5.2:** Connect visual components to Server Actions using hooks (`useTransition`, `useFormStatus`).
- **Sprint 5.3:** Implement interface alerts (Toasts) to manage success/failure action states.

---

## GENERATION PROTOCOL (THE AI'S ABSOLUTE RULE)

During execution of any Sprint above, you (the Coding AI) are **prohibited** from responding with more than one code file.

1. Generate the exact Sprint file.
2. Say: *"Sprint X.Y complete. Audit Gateway approved."*
3. Stop and await the command: *"Proceed."*

---

*Playbook generated under Prisma V4 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*
