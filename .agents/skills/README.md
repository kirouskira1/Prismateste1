# Prisma V5.0 — Skill Tracks Directory

This directory contains specialized 'skills' that extend the cognitive capabilities of Prisma Agents.

> **Canonical source note (fixed in `docs/26_Version_Unification_Plan.md` T3.3):** for the three
> *coding* skills below, this directory used to hold a full, independently-drifting copy of each
> `SKILL.md`. `agentes/02_Worker_TRM_Agent.md` §2.1 has always pointed the Worker at `docs/skills/*.md`
> — that is the one the Worker actually reads, so `docs/skills/` is now the canonical body of each
> skill. The files here are thin pointers, kept only so Antigravity 2.0's directory-based
> auto-discovery (§"How Agents Use Skills" below) still finds a `SKILL.md` in `.agents/skills/`.
> Edit the content in `docs/skills/`, never here.

## Structure of a Skill Track
Each folder represents a specific engineering domain or playbook.
A skill folder **MUST** contain:
- `SKILL.md`: The main instruction file with YAML frontmatter (name, description) and detailed markdown instructions.

Optionally, it may include:
- `examples/`: Reference implementations and usage patterns.
- `references/`: Additional documentation.

## How Agents Use Skills
The Orchestrator or Subagents will automatically trigger these skills based on the task type or user request.
Before acting, the agent uses `view_file` (Antigravity) / `Read` (Claude Code) to read the full instructions —
for `react_component`, `rls_policy`, and `server_action`, that means following the pointer in this
directory's stub straight to `docs/skills/`.

## Existing Canonical Skills
- **`boot_prisma_agents`**: Zero-Loss Injection boot protocol for the 9 subagents. IDE-boot skill,
  lives only here — it has no `docs/skills/` counterpart because it isn't a coding pattern.
- **`react_component`** → canonical body: `docs/skills/react_component.md`. Tailwind/shadcn patterns and Server vs Client Component (Islands) architecture.
- **`rls_policy`** → canonical body: `docs/skills/rls_policy.md`. Supabase/PostgreSQL Row Level Security patterns.
- **`server_action`** → canonical body: `docs/skills/server_action.md`. Next.js Server Actions contracts and Policy Agent delegation.

*To add a new coding skill, write it in `docs/skills/<name>.md` first, then add a stub here if
Antigravity-side auto-discovery needs it. To add an IDE-boot skill (like `boot_prisma_agents`),
it belongs only in `.agents/skills/` — there is no `docs/skills/` equivalent for that category.*
