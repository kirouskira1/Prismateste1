# 🚀 Antigravity 2.0 — Kernel Boot Manifesto (Prisma V5.0 Fleet)

**Classification:** IDE BOOT MANIFESTO  
**Purpose:** Ensure all 9 specialized subagents are native-indexed and ready at session start without starting from zero.

> ⚠️ **Rodando em Claude Code, não em Antigravity?** A tabela abaixo (e o passo 2 do protocolo de
> reinicialização) descreve `define_subagent`, que não existe em Claude Code. Vá direto para
> `docs/27_Tool_Compatibility_Matrix.md` §4 (Claude Code Boot Adapter) em vez de executar o
> passo 2 literalmente. As "Permissões / Modo" e "Ferramentas e Regras Nucleares" da tabela
> continuam válidas em ambos os ambientes — só o mecanismo de registro muda.

---

## 🤖 Catálogo Canônico de Subagentes Nativos (Zero-Loss Native English)

| # | Codename Canônico | Registry Codename | Arquivo Fonte | Permissões / Modo | Ferramentas e Regras Nucleares |
|:---:|:---|:---|:---:|:---:|:---|
| 01 | `architect_trm_en` | `ARCHITECT_TRM` | `agentes/01_Architect_Agent.md` | Read / Write / Execute | TRM Loop, Triage, 4 Gateways, Rubric Generation |
| 02 | `worker_trm_en` | `TRM_WORKER` | `agentes/02_Worker_TRM_Agent.md` | Read / Write / Execute | Sacred Contract (`"use server"`), Zod, Anti-Legacy |
| 03 | `auditor_trm_en` | `AUDITOR_TRM` | `agentes/03_Auditor_Agent.md` | **READ_ONLY** | Zero Empathy, Kill Switches K1-K6, Anti-Collapse |
| 04 | `design_agent_en` | `DESIGN_AGENT` | `agentes/04_Design_Agent.md` | Read / Write <em>(sem Execute — Design nunca recebe `run_command`/`Bash`)</em> | Tokens *Blue Midnight*, MCP Registry, RSC Islands |
| 05 | `backend_agent_en` | `BACKEND_AGENT` | `agentes/05_Backend_Agent.md` | Read / Write / Execute | ActionResponse<T>, Zod validation, Supabase SSR RLS |
| 06 | `policy_agent_en` | `POLICY_AGENT` | `agentes/06_Policy_Agent.md` | **READ_ONLY** | Zero Hard-Code, RAG heuristic lookups |
| 07 | `security_agent_en`| `SECURITY_AGENT` | `agentes/07_Security_Agent.md` | **READ_ONLY** | 5 Golden Laws, Prompt Injection XML defense |
| 08 | `watcher_agent_en` | `WATCHER_AGENT` | `agentes/08_Watcher_Agent.md` | **READ_ONLY** <em>(run_command permitido apenas para SQL SELECT nas views de audit — nunca escrita)</em> | Convergence monitor, 3-Loop Ceiling, Token Alert |
| 09 | `scout_agent_en`   | `SCOUT_AGENT` | `agentes/09_Scout_Agent.md`   | **READ_ONLY / Search** | Next.js 15+ breaking changes, Web Docs Recon |

*Correção nesta revisão: a linha 04 (Design) dizia "Read / Write / Execute", superestimando suas permissões — nem a spec do próprio agente, nem o registry, nem `00_Orchestrator_Protocol.md` §5.1 concedem `run_command` ao Design Agent. A linha 08 (Watcher) foi reclassificada de "Read / Execute (Logs)" para **READ_ONLY** com a mesma nota de escopo já aplicada em `agent_registry.json` (`tool_mode_note`) — "Execute" sem qualificação sugeria permissão de escrita geral, que o Watcher nunca teve.*

---

## ⚙️ Protocolo de Reinicialização Rápida (Zero-to-One Boot)
**GATILHO DE ATIVAÇÃO IMEDIATA (ZERO-WAIT EXECUTION):**
Sempre que uma nova sessão for iniciada e o usuário digitar `iniciar modo prisma`, `ativar modo prisma` ou similar:
1. **É PROIBIDO APENAS RESPONDER EM TEXTO:** Não prometa que os agentes serão ativados no futuro ou ao criar arquivos. Isso é falha de execução — em qualquer ambiente.
2. **DETECTE O AMBIENTE, DEPOIS EXECUTE O REGISTRO CORRESPONDENTE:**
   - **Antigravity 2.0 (`invoke_subagent` disponível):** chame `define_subagent` PIXEL A PIXEL para registrar cada um dos 9 agentes da tabela acima injetando **exatamente o conteúdo integral em inglês do respectivo arquivo `.md`**, sem resumos ou traduções (ver skill canônica `.agents/skills/boot_prisma_agents/SKILL.md`).
   - **Claude Code (`Agent`/`Task` disponível, `invoke_subagent` ausente):** não existe `define_subagent` aqui. Siga o Claude Code Boot Adapter (`docs/27_Tool_Compatibility_Matrix.md` §4) — carregue os 9 arquivos como contexto conhecido; reserve o spawn real via `Agent` para os papéis marcados `isolation_critical: true` em `.prisma/agent_registry.json` (Auditor, Security, Watcher, Scout, Fresh Eyes).
3. **ATUALIZE O ESTADO:** O auto-diagnóstico checa a disponibilidade das ferramentas MCP (`supabase`, `insomnia`, `TestSprite`) e grava o `execution_mode` **realmente detectado** (`"subagents"` | `"claude_code_hybrid"` | `"sequential_hats"`) e `"language_mode": "native_english"` no arquivo `.prisma/state.json`.
4. **CONFIRME A ATIVAÇÃO REAL EM PORTUGUÊS:** Apresente o relatório ao usuário no chat (sempre em Português do Brasil) descrevendo com precisão o que ocorreu para o ambiente detectado — nunca afirme "registrados na memória operacional do IDE" em Claude Code, onde isso não é literalmente verdade.
