# Deployment Pipeline Specification

**Classification:** REFERENCE  
**Codename:** `Deployment_Pipeline`  
**Version:** V5.0 (Harness Engineering Layer)  
**Context Layer:** DevOps / Production  

---

## 1. CI/CD Architecture (V5.0)

Prisma V5.0 relies on automated continuous integration to guarantee code quality and prevent AI hallucinations from reaching production. The default CI tool is **GitHub Actions**.

### 1.1 Core Pipeline Stages

For every Pull Request and push to `main`, the CI pipeline MUST execute:

1. **Lint & Format (Static Analysis):**
   - Runs `npm run lint` (ESLint).
   - Checks against the Prisma V5.0 rules (e.g., no Pages Router, no direct fetch, strict TypeScript).
   - *Failure:* CI halts immediately.

2. **Unit & Integration Tests:**
   - Runs `npx vitest run`.
   - Tests custom hooks, context providers, and deterministic utility functions.

3. **Offline Eval Suite (AI Regression Check):**
   - Runs `npx ts-node scripts/eval-runner.ts`.
   - Validates that recent modifications to Agent Prompts or templates did not break the structural guarantees of the generated code.

4. **Database Migration Dry-Run:**
   - Supabase local CLI is used to verify that SQL schemas (including RLS, Vector tables, and Policy Agents) apply cleanly without conflicts.

### 1.2 Continuous Deployment (CD)

- **Frontend/Backend:** Vercel (automatically linked to the GitHub repository). Vercel builds the Next.js App Router application.
- **Database:** Supabase CI integration. Migrations are applied automatically to the staging database on PR merge, and to production on releases.

## 2. Environment Bootstrap

### 2.1 Essential Variables

The following variables MUST be injected via `.env` (or Vercel Environment Variables):
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key (safe for client-side).
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key (Backend only, MUST NEVER leak to the frontend).
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`: API keys for the Policy Agents and TRM loop (Backend only).

### 2.2 Security Auditing

Before deployment, the `.env` configuration must be audited to ensure that:
- No sensitive keys (`SUPABASE_SERVICE_ROLE_KEY`, LLM provider keys) are prefixed with `NEXT_PUBLIC_`.

---

*Specification generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*
