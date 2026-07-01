# 📋 Lista Completa de Características: Sakana Fugu + Fable 5 no Prisma V4.2

---

## 🐡 SAKANA FUGU — 12 Características Implementadas

Baseado no cruzamento direto com o documento [sakana-fugu-orchestration.md](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/sakana-fugu-orchestration.md) e o paper `2606.21228v2.pdf`.

### Já existiam ANTES desta rodada (da V4.1 original):

| # | Conceito Fugu (§ no doc) | Como ficou no Prisma | Onde no projeto |
|:---:|:---|:---|:---|
| 1 | **Orchestrator como Conductor** (§0 TL;DR) — O orquestrador não executa tarefas, ele decide "quem faz o quê, quando, com que contexto" | O Orchestrator do Prisma nunca gera código. Ele roteia, isola e governa. Regra Absoluta #1: "Never Generate Code" | [Orchestrator §1, §12](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/agentes/00_Orchestrator_Protocol.md#L13) |
| 2 | **Task-Type Routing** (§0 + §3) — Decisão de roteamento POR QUERY, classificando antes de agir. "Não é um grafo fixo de agentes" | Task Type Router com 6 categorias (EXECUTION_ONLY, DEEP_READ, CREATION, HYBRID, DESIGN_FIRST, SPRINT_ZERO), cada uma com effort e rota diferente | [Orchestrator §4](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/agentes/00_Orchestrator_Protocol.md#L73) + [LangGraph §2B](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/docs/06_LangGraph_Orchestrator_Spec.md#L64) |
| 3 | **Orchestration Collapse** (§2.3) — "Se todos os agentes compartilham a mesma trajetória, o 1º a agir ancora todos os outros" | Conceito nomeado explicitamente. Anti-Collapse Guardrails é uma seção inteira do Orchestrator. Checklist de verificação obrigatória | [Orchestrator §6](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/agentes/00_Orchestrator_Protocol.md#L192) + [Auditor §4](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/agentes/03_Auditor_Agent.md#L156) |
| 4 | **Isolamento Intra-Workflow** (§2.3) — "Cada agente só vê o transcript das SUAS ações + o que a access list permite" | Worker NUNCA recebe o Audit Framework. Auditor NUNCA recebe reasoning_trace. Design NUNCA vê Schema SQL. Tabela completa de isolamento por agente | [Orchestrator §7](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/agentes/00_Orchestrator_Protocol.md#L272) |
| 5 | **State Management por Workflow** (§2.1) — "O estado amarra agente ↔ subtask ↔ posição na topologia" | `OrchestratorState` interface com `active_hat`, `iteration_count`, `fresh_eyes_used`, `active_task_id` rastreando posição exata de cada agente no loop | [Orchestrator §9.1](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/agentes/00_Orchestrator_Protocol.md#L446) + [LangGraph §1 AgentState](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/docs/06_LangGraph_Orchestrator_Spec.md#L21) |
| 6 | **Tool Execution dentro do agente, não do orquestrador** (§2.2) — "A execução de tools acontece DENTRO do contexto de cada agente individual" | No Prisma: Worker tem tools R/W, Auditor tem tools READ-ONLY, Policy tem view_file only. O Orchestrator nunca toca em ferramentas de geração | [Orchestrator §5.1 Dispatch Table](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/agentes/00_Orchestrator_Protocol.md#L94) |
| 7 | **Physical Sandbox (Tool Sandboxing)** (§2.2) — Garantir que o callback de tool volte pro agente certo | Subagent mode: cada agente é um LLM separado com ferramentas fisicamente restritas. Solo mode: restrição instrucional explícita (Auditor: "❌ write_to_file — FORBIDDEN") | [Orchestrator §6.2](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/agentes/00_Orchestrator_Protocol.md#L228) + [Auditor §5.1](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/agentes/03_Auditor_Agent.md#L206) |
| 8 | **Fresh Eyes / Deadlock Resolution** (§2.5, item 4 — "Especialista trazido pontualmente") — "Um fresh worker reexamina do zero sem bias" | Fresh Eyes Protocol completo: descarta todo feedback anterior, spawna novo Auditor, busca root_cause_shift, concede +1 iteração bonus se encontrar causa diferente | [Orchestrator §8.2](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/agentes/00_Orchestrator_Protocol.md#L335) + [LangGraph §2E](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/docs/06_LangGraph_Orchestrator_Spec.md#L91) |
| 9 | **Feedback Bidirecional Agent-to-Agent** (§2.5, itens 3+4) — "feedback relayed back ao agente que precisa corrigir" | O Worker recebe feedback do Auditor via Orchestrator relay para refinar. Se Auditor rejeita → Worker recebe remediation_guidance e retenta. Loop bidirecional completo | [Orchestrator §8.1 TRM Loop](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/agentes/00_Orchestrator_Protocol.md#L299) + [PMP §4.1 Standard Build Flow](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/docs/17_Prisma_Message_Protocol.md#L237) |

### Adicionadas NESTA rodada (V4.2):

| # | Conceito Fugu (§ no doc) | Como ficou no Prisma | Onde no projeto |
|:---:|:---|:---|:---|
| 10 | **Access Lists Formais XML** (§2.3 + §1.2) — "Pense na access list como uma ACL de contexto por step" | `<access_list>` XML formal em todos os agentes com `<always_load>`, `<load_if_needed>`, `<never_load>`. Validação obrigatória no PMP rule #7 | Todos os agentes §2 + [Orchestrator §6.4](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/agentes/00_Orchestrator_Protocol.md#L250) + [Prompt Library §6](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/docs/07_Prompt_Engineering_Library.md) |
| 11 | **Isolated Feedback Relay** (§2.5 item 3) — "descobertas são relayed back, mas não o contexto completo de quem descobriu" | `remediation_relay`: apenas fix instructions, sem score/raciocínio/identidade do Auditor. Previne o Worker de "gamificar" os critérios | [Orchestrator §9.5](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/agentes/00_Orchestrator_Protocol.md#L520) + [Prompt Library §7](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/docs/07_Prompt_Engineering_Library.md) |
| 12 | **Context Break com files_to_discard/load** (§2.3 + §2.1) — "ACL de contexto com limpeza explícita de memória por step" | Context Break agora exige parâmetros explícitos: `files_to_discard` e `files_to_load` declarados formalmente | [Orchestrator §6.1](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/agentes/00_Orchestrator_Protocol.md#L196) + [PMP §3.8 ContextBreakPayload](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/docs/17_Prisma_Message_Protocol.md#L206) |

---

## 🧠 FABLE 5 — 14 Características Implementadas (todas nesta rodada)

| # | Conceito | Como ficou no Prisma | Onde |
|:---:|:---|:---|:---|
| 1 | **Tags XML Estruturais** | `<agent_identity>`, `<workspace_sync>`, `<absolute_rules>`, `<access_list>` | Kernel, todos os agentes |
| 2 | **Default to Action (Proatividade)** | `<default_to_action>` — implementar em vez de sugerir | Kernel §4, Worker §8 |
| 3 | **Context Awareness** | `<context_awareness>` — não parar por limites de contexto | Kernel §4, todos os agentes |
| 4 | **Smart Pause** | `<smart_pause>` — pausar SÓ para ações irreversíveis | Kernel §4, Orchestrator §9.3 |
| 5 | **Investigate Before Answering** | `<investigate_before_answering>` — ler antes de avaliar | Kernel §5, Worker, Backend |
| 6 | **No Reasoning Extraction** | Proibição de reproduzir raciocínio interno | Kernel §5, Worker, Auditor |
| 7 | **Anti-Over-Engineering** | `<agent_constraint>` — sem abstrações prematuras | Kernel §4, Prompt Library §9, Backend §8 |
| 8 | **Progress Grounding** | `<progress_grounding>` — auditar claims contra evidência real | Kernel §5, Orchestrator §12, Auditor §3.4 |
| 9 | **Adaptive Thinking (Effort Levels)** | low/high/xhigh/max por Task Type | Kernel §7 |
| 10 | **Re-grounding Periódico** | `<re_grounding>` — reler spec para evitar drift | Auditor §3.4 |
| 11 | **Parallel Dispatch** | `<use_parallel_tool_calls>` — delegar e continuar | Orchestrator §5.1 |
| 12 | **Proactive Execution (Last Paragraph Rule)** | "Se prometeu, faça agora" | Kernel §4, Architect §9 |
| 13 | **Boundary Declaration** | Separar "investigar" de "executar" | Kernel §5.5 |
| 14 | **Prevenção de Alucinação** | Leitura obrigatória antes de claims sobre código | Kernel §5, Worker, Backend |

---

## 📊 Totais

| Fonte | Já existiam (V4.1) | Adicionadas (V4.2) | **Total** |
|:---|:---:|:---:|:---:|
| **Sakana Fugu** | 9 | 3 | **12** |
| **Fable 5** | 0 | 14 | **14** |
| **TOTAL** | **9** | **17** | **26** |

> [!IMPORTANT]
> O Prisma já tinha **9 das 12** características do Fugu implementadas antes desta rodada. Nós refinamos 3 delas (Access List XML, Isolated Relay, Context Break com files). O Fable 5 foi inteiramente novo — 14 características inéditas.
