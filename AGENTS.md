<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Prisma Governance

This file only covers Next.js version-specific rules. The Prisma agent-orchestration governance
(9 subagents, TRM loop, Audit Framework, execution-mode detection) lives in a **separate file with
the same name**: [`.agents/AGENTS.md`](.agents/AGENTS.md). `CLAUDE.md`'s `@AGENTS.md` import only
resolves to this file — it does not automatically pull in `.agents/AGENTS.md`. If you are operating
under "modo prisma", read `.agents/AGENTS.md` explicitly; do not assume this file is the whole
picture (fixed: `docs/26_Version_Unification_Plan.md`, Rodada 2, G1).
