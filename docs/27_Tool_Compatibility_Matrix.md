# Tool Compatibility Matrix (Antigravity ↔ Claude Code)

**Classification:** KERNEL
**Codename:** `Tool_Compatibility`
**Version:** V5.0
**Context Layer:** Always (Loaded before any tool dispatch)
**Est. Tokens:** ~500 tokens

---

## 1. Purpose

Every agent spec in `agentes/` and `.prisma/agent_registry.json` names tools using **Antigravity 2.0** vocabulary (`view_file`, `write_to_file`, `invoke_subagent`, ...). None of these are real tool names in **Claude Code**. Before this document, that mismatch was silent: hooks that grepped for `write_to_file` never fired, and the boot protocol asked for a `define_subagent` primitive that doesn't exist here.

This document is the **single source of truth** for translating between the two runtimes. Nothing downstream (registry, hooks, agent specs) should hardcode a raw tool name without resolving it through this table first.

---

## 2. Canonical Capabilities

Every tool any Prisma agent uses reduces to one of these 8 capabilities:

| Capability | What it does | Antigravity 2.0 | Claude Code |
|:---|:---|:---|:---|
| `read_file` | Read a file's contents | `view_file` | `Read` |
| `search_code` | Pattern/grep search across files | `grep_search` | `Grep` |
| `write_file` | Create a new file / full overwrite | `write_to_file` | `Write` |
| `edit_file` | Targeted in-place edit of an existing file | `replace_file_content` | `Edit` |
| `run_shell` | Execute a shell/terminal command | `run_command` | `Bash` |
| `spawn_agent` | Dispatch isolated work to a subagent | `invoke_subagent` | `Agent` |
| `web_search` | Search the web | `search_web` | `WebSearch` |
| `fetch_url` | Retrieve content from a specific URL | `read_url_content` | `WebFetch` |

**Rule:** any new tool reference added to an agent spec, the registry, or a hook MUST be expressed as one of these 8 capabilities, then resolved via this table — never hardcoded to one runtime's literal name.

---

## 3. The One Capability Without a 1:1 Match: `spawn_agent`

This is the gap that matters most, and papering over it with a fake mapping would be dishonest. Antigravity actually has **two** distinct primitives that both collapse into Claude Code's single `Agent` tool:

| Antigravity primitive | Semantics | Claude Code equivalent |
|:---|:---|:---|
| `define_subagent` | Registers a **persistent named persona** in IDE memory for the rest of the session (the boot protocol calls this 9 times at session start) | **None.** Claude Code has no persistent subagent registry — every `Agent` call is a fresh, stateless spawn. |
| `invoke_subagent` | Dispatches **one unit of work** to an already-registered persona, physically isolated from the caller's context | `Agent` tool call, with the target agent's spec file content passed as the prompt |

**Consequence — Claude Code Boot Adapter:** because `define_subagent` has no equivalent, Claude Code MUST NOT attempt the "register 9 personas at boot" ritual literally. See §4 for the adapted protocol.

---

## 4. Claude Code Boot Adapter

When the detected environment is Claude Code (§5), "iniciar modo prisma" resolves to:

```
1. DO NOT attempt define_subagent. It does not exist here — do not claim agents are
   "registered in operational memory." That claim would be false in this environment.
2. Treat the 9 files in agentes/ as KNOWN CONTEXT, not persistent registrations:
   the root agent (this conversation) keeps their location and codenames in mind and
   reads the relevant spec file on demand when a hat is needed.
3. For each dispatch, choose ONE of two adapted strategies:

   a. SEQUENTIAL HAT (default — same context, no tool call)
      Read the target agent's .md file, adopt its persona directly in the current
      turn, and — if switching FROM a generating hat (Worker/Design/Backend) TO the
      Auditor hat — insert the textual Context Break (Orchestrator §6.1) before doing so.
      Use this when isolation is advisory, not load-bearing (e.g. Worker → Architect).

   b. AGENT-TOOL SPAWN (for isolation-critical roles)
      Call the `Agent` tool with the target spec file's content as the prompt, when
      the role's value depends on PHYSICAL isolation from the caller's reasoning —
      this is the Claude Code equivalent of Antigravity's "Physical Isolation
      Advantage" (Orchestrator §5.1). Use for: Auditor_TRM, Security_Agent,
      Fresh Eyes Auditor, Scout_Agent. These are exactly the agents whose specs
      already say "you must not see the Worker's reasoning_trace" — an Agent-tool
      spawn enforces that for real, the same way invoke_subagent does in Antigravity.

4. Confirm to the user, in Portuguese, which strategy was used per role — do not
   claim "9 subagents loaded in IDE memory" (Antigravity phrasing); say instead
   "9 especificações de agente carregadas como contexto; papéis de isolamento
   crítico (Auditor, Security, Scout, Fresh Eyes) serão despachados via Agent tool
   quando acionados."
5. Update .prisma/state.json: "execution_mode": "claude_code_hybrid" (see
   docs/000_Kernel_System_Override.md §1 and agentes/00_Orchestrator_Protocol.md §3).
```

---

## 5. Three-Way Environment Detection

Replaces the old binary check (Kernel §1 / Orchestrator §3 — both now point here):

```
STEP 1: Is a tool named exactly "invoke_subagent" available?
  └── YES → executionMode = "subagents"           (Antigravity 2.0, full physical isolation)

STEP 2: Is a tool named "Agent" (or "Task") available?
  └── YES → executionMode = "claude_code_hybrid"  (this runtime — see §4 Boot Adapter)

STEP 3: Neither is available.
  └── executionMode = "sequential_hats"            (pure textual hat-switching, Antigravity
                                                      fallback with no subagent tool at all)
```

`"claude_code_hybrid"` is now a third valid value of `execution_mode`, alongside the two already defined in `agentes/00_Orchestrator_Protocol.md` §3. It is NOT a synonym for `"SOLO"` (see `prisma.config.json` — that key is being reconciled separately in `docs/26_Version_Unification_Plan.md`).

---

## 6. Hooks Are Claude-Code-Only — No Translation Needed

`.claude/hooks/*.sh` only ever runs inside Claude Code (Antigravity does not read `.claude/settings.json`). These hooks should check Claude Code's **real** tool names (`Write`, `Edit`, `Bash`) as the primary condition. They keep the old Antigravity names as a secondary fallback only for defense-in-depth, never as the primary check. See `docs/26_Version_Unification_Plan.md` changelog and the hook files themselves for the fix applied.

---

## 7. What This Document Does Not Change

- `agent_registry.json`'s `tool_mode` (`READ_ONLY` / `READ_WRITE`) is a **permission** concept, not a tool-name concept — it does not need environment resolution.
- The 5-domain scoring formula, Kill Switches, and Anti-Collapse protocol are behavioral, not tool-name-dependent — unaffected by this document.

---

*Specification generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*
