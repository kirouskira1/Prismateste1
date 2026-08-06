# Security Governance Policy — The Constitution

**Classification:** REFERENCE  
**Codename:** `Security_Constitution`  
**Version:** V5.0  
**Context Layer:** Task (Security Review)  
**Est. Tokens:** ~1,200 tokens  

---

## 1. Data Protection

### 1.1 Intellectual Property Isolation
- Documents in `/docs` (Prisma IP) MUST NEVER be sent to public LLM APIs.
- Vectorization of internal documentation MUST be performed locally via Docker/Gemma.
- Client data follows separate rules (see Section 1.2).

### 1.2 Client Data Sovereignty
- Client business rule documents (PDFs/TXTs) are stored in the `prisma-rules` Supabase Storage bucket.
- RAG queries for client documents use Google File Search API (managed RAG).
- Client PII is never logged in `audit_logs.reasoning_text`. Sanitize before storage.

### 1.3 Credential Security
- API keys, tokens, and secrets MUST use environment variables (`process.env`).
- No credentials in source code, logs, or client-side bundles.
- `.env.local` is always in `.gitignore`.

---

## 2. Row Level Security (RLS) — Mandatory Policy

### 2.1 Universal RLS Requirement
- **Every table** in the Supabase database MUST have RLS enabled.
- No table may exist without at least a `SELECT` policy.
- Tables without RLS are a **CRITICAL** audit failure — automatic rejection.

### 2.2 Isolation Pattern
```sql
-- Standard pattern: user isolation by auth.uid()
CREATE POLICY "Users can view own records" ON public.[table_name]
  FOR SELECT USING (auth.uid() = user_id);
```

### 2.3 Nested Resource Access
- For child tables (e.g., `generated_artifacts` belonging to `project_configurations`):
  - Access is validated through JOIN to the parent table's `owner_user_id`.
  - Direct ownership checks on child tables are insufficient.

---

## 3. Forbidden Patterns (Anti-Legacy)

The following patterns are **expressly prohibited** in any Prisma-built project. Most of these
(rows 1-4, 6) are the universal Anti-Legacy Filter (`000_Kernel_System_Override.md` §3) — they
apply regardless of `compilation_target`. Only "Hard-coded business rules" is specific to the
`V4`/`HYBRID` compilation targets (see `05_Backend_Agent.md` §3 — `V3.1` mode permits simple
stable rules directly in code):

| Pattern | Why Forbidden | Required Alternative |
|:---|:---|:---|
| `src/app/api/` route handlers | Legacy pattern, bypasses Server Action safety | Server Actions in `/actions/` |
| Direct `fetch()` to Edge Functions | Breaks Policy Agent abstraction | `consultPolicyAgent()` |
| Prisma ORM | Conflicts with Supabase RLS | `@supabase/ssr` client |
| Pages Router | Legacy Next.js architecture | App Router only |
| Hard-coded business rules | Creates technical debt, blocks client autonomy | Policy Agent + RAG document |
| `any` type in TypeScript | Destroys type safety | Explicit interfaces |
| Legacy prefixed audit table name | Verbose legacy naming | `audit_logs` (canonical) |
| Verbose governance/service enum values | Verbose legacy naming | `V4` / `V3.1` |

---

## 4. Audit Trail Requirements

### 4.1 Canonical Table
- The audit log table is named `audit_logs` — no legacy prefixes allowed.
- Every Policy Agent decision MUST be logged with:
  - `decision` (approved/rejected/escalated)
  - `reasoning_text` (LLM explanation)
  - `citation_metadata` (source document, page, snippet)

### 4.2 What to Log
- All Policy Agent invocations
- Authentication events (sign-in, sign-out, failed attempts)
- Schema migrations and RLS policy changes
- Security violations (blocked requests, injection attempts)

### 4.3 What to NEVER Log
- User passwords or password hashes
- Full credit card numbers
- Raw API keys or tokens
- PII beyond what is necessary for the audit trail (e.g., full SSN)

---

## 5. Prompt Injection Defense

### 5.1 Input Sanitization
- All user inputs that reach Policy Agents MUST be sanitized.
- Use `"""` or `###` delimiters to separate RAG context from user input.
- Never allow user input to override system prompts.

### 5.2 Context Isolation
- RAG-retrieved context is always placed in a clearly delimited block.
- If user input contradicts the RAG context, the agent MUST follow the RAG context.
- Conflicting instructions result in `decision: "escalated"` — not silent override.

---

## 6. Naming Conventions

### 6.1 Database
- Tables: `snake_case`, plural (`users`, `audit_logs`, `project_configurations`)
- Columns: `snake_case` (`created_at`, `owner_user_id`)
- Enums: `snake_case` values (`draft`, `approved`, `rejected`)
- Compilation targets: `V4`, `V3.1` — always short-form, no verbose suffixes

### 6.2 TypeScript
- Interfaces/Types: `PascalCase` (`ProjectConfig`, `AuditLog`)
- Functions: `camelCase` (`createProject`, `consultPolicyAgent`)
- Zod schemas: `camelCase` + `Schema` suffix (`createProjectSchema`)
- Server Actions: `camelCase`, always `async`, always return `ActionResponse<T>`

### 6.3 Files and Folders
- Source code: `kebab-case` files, `camelCase` exports
- Documentation: numbered prefix + `PascalCase` (`00_Sprint_Zero_Protocol.md`)
- Agent specs: in `/agents/` directory
- Reference docs: in `/docs/` directory

---

## 7. Escalation Protocol

When a security violation is detected:

1. **LOW severity:** Log warning in `audit_logs`, continue execution, flag for review.
2. **MEDIUM severity:** Log in `audit_logs`, notify developer in sprint status report.
3. **HIGH severity:** Block the operation immediately, log with full context, halt sprint execution.
4. **CRITICAL severity:** Block operation, log incident, record in `.prisma/learnings.json`, request human arbitration before any further execution.

---

## 8. Agent Access Control

| Agent | Filesystem Access | Database Access | Can Write Code |
|:---|:---|:---|:---|
| Orchestrator | Read `docs/`, `.prisma/` | Read/Write `state.json` | No |
| Sub-Dev (Worker) | Read/Write `/src` | Read schema | Yes |
| Sub-Auditor | Read `/src` (diff only) | Read-only | **No** |
| Sub-Security | Read `/src` (diff only) | Read-only | **No** |

The Auditor and Security agents operate in **READ-ONLY** mode. They NEVER write to files. Violations are reported via PMP contracts only.

---

*Security Constitution — Prisma V5.0 — Lead Architect Pedro Lucas Santos de Araújo*