# The 12-Factor Agent Framework

**Classification:** REFERENCE  
**Codename:** `12_Factors`  
**Version:** V5.0 (Harness Engineering Layer)  
**Context Layer:** Core Methodology  
**Est. Tokens:** ~1100 tokens  

---

## 1. Purpose

Inspired by the original 12-Factor App methodology for SaaS, the **12-Factor Agent** framework defines the architectural standards for building resilient, scalable, and autonomous LLM agents in Prisma V5.0. 

Agents that fail these factors are considered "slop" and will eventually collapse under production workloads.

---

## 2. A Adaptação para o Prisma V5.0

Cada um dos 12 fatores foi estritamente adaptado para a realidade do desenvolvimento de agentes no Prisma.

| Factor | Adaptação para Agents | Violação no Prisma | Padrão Canônico |
|:---:|:---|:---|:---|
| **I. Codebase** | Um agente = um spec file | Duplicar specs entre `agentes/` e `docs/skills/` | `agent_registry.json` como single source |
| **II. Dependencies** | Declarar tools explicitamente | Agent usando tool não declarada no registry | `tools[]` no `agent_registry.json` |
| **III. Config** | Config via env/JSON, nunca hard-coded | `max_attempts: 3` hard-coded no prompt | `prisma.config.json` |
| **IV. Backing Services**| LLM APIs como serviços anexáveis | Assumir que "o modelo é sempre GPT-4" | Model Asymmetry Protocol |
| **V. Build, Release, Run**| Spec → Validate → Deploy como fases | Escrever código sem spec aprovada | Filtro Spec-Driven (Sprint Zero) |
| **VI. Processes** | Agents são stateless por execução | Worker guardando estado entre tarefas | Session isolation (`.prisma/sessions/`) |
| **VII. Port Binding** | Agent expõe contrato tipado | Retornar texto livre em vez de `ActionResponse<T>` | `17_Prisma_Message_Protocol.md` |
| **VIII. Concurrency** | Escalar via mais instâncias de agente | Um único Worker fazendo tudo | `parallel_dispatch_enabled`, Factory 1 ∥ Factory 2 |
| **IX. Disposability** | Agent pode ser descartado rapidamente | Watcher acumulando estado infinito | `invoke_subagent` descarta contexto ao finalizar |
| **X. Dev/Prod Parity**| Prompts iguais em dev e prod | Testar com prompt simplificado localmente | Eval suite verifica paridade |
| **XI. Logs** | Tratar logs como event streams | `console.log` solto no meio do código | `TELEMETRY_EVENT` via Message Protocol |
| **XII. Admin Processes**| Tarefas admin como processos isolados | Rodar eval suite manualmente sem script | `scripts/eval-runner.ts` como processo admin |

---

## 3. Detalhamento dos Fatores

### I. System Prompt as Code (SPaC)
Agent System Prompts MUST be versioned in Git (`.md` ou `.json`) alongside application code.
- ❌ **Violação:** Copiar e colar prompts diretamente no playground da OpenAI/Anthropic para testar e perder o histórico.
- ✅ **Conformidade:** Editar `02_Worker_TRM_Agent.md`, comitar no Git, e deixar o sistema auto-carregar o prompt via `agent_registry.json`.

### II. Explicit Tool Contracts
Agents must use strictly typed tool schemas (e.g., Zod). A tool should do exactly one thing.
- ❌ **Violação:** Um agente "God Mode" que possui uma tool genérica `execute_code(any_string)`.
- ✅ **Conformidade:** O `Architect_TRM` possui apenas as tools descritas no `agent_registry.json` (view_file, grep_search, write_to_file), com contratos JSON Schema validados.

### III. Environment Configuration
Model parameters (temperature, max tokens) and behavioral flags must be injected.
- ❌ **Violação:** Escrever no prompt: "Tente no máximo 3 vezes se falhar".
- ✅ **Conformidade:** O prompt instrui a obedecer o loop, mas o número `3` vem de `prisma.config.json` (`max_attempts`).

### IV. Backing Services as Context
Agents must query external knowledge dynamically (RAG, Policy APIs) rather than hardcoding business rules.
- ❌ **Violação:** O prompt do `Policy_Agent` diz: "Compras acima de $500 precisam de aprovação".
- ✅ **Conformidade:** O agente invoca `consultPolicyAgent()` que faz uma busca no pgvector (`semantic_cache`) para ler a regra vigente da base de dados.

### V. Build, Release, Run, Evaluate
Before a new agent prompt goes to production, it MUST pass the Offline Evals Pipeline.
- ❌ **Violação:** Editar o prompt do Worker para forçar o uso de um componente novo e mandar direto para master.
- ✅ **Conformidade:** Alterar o prompt, rodar `npm run eval`, verificar que a taxa de acerto nos 20 Golden Cases não caiu mais de 5%, e então comitar.

### VI. Stateless Orchestration
Conversation history and reasoning traces must be stored externally.
- ❌ **Violação:** Tentar manter o histórico de 50 turnos do Worker na mesma janela de contexto, causando Orchestration Collapse.
- ✅ **Conformidade:** O Orchestrator salva o diff e a conclusão no `state.json` e encerra a thread, invocando um novo agente limpo na próxima fase (Session Isolation).

### VII. Portability (Model Asymmetry)
The orchestration layer must support multiple LLM providers.
- ❌ **Violação:** Usar tags `<anthropic_only>` no código fonte do agente.
- ✅ **Conformidade:** O Orchestrator implementa a §13 (Model Asymmetry Protocol), degradando de Claude Opus para Claude Sonnet automaticamente se o `budget_remaining < 20%`.

### VIII. Concurrency via Routing
Scale out via semantic routing rather than monolithic agents.
- ❌ **Violação:** Pedir ao Worker para desenhar o CSS e ao mesmo tempo escrever a action de banco de dados no mesmo loop.
- ✅ **Conformidade:** O Orchestrator usa o Sequential Exclusion Router para mandar o UI para a Factory 1 (Design Agent) e o DB para a Factory 2 (Backend Agent) em paralelo.

### IX. Disposability & Stagnation Detection
Maximize robustness with fast startup and graceful shutdown.
- ❌ **Violação:** Deixar um agente em loop infinito tentando consertar um erro de tipagem que ele não entende.
- ✅ **Conformidade:** O Orchestrator detecta Estagnação (delta de score < 0.3) e aciona o protocolo Fresh Eyes, matando a thread instantaneamente.

### X. Dev/Prod Parity in Context
Context size asymmetry is the #1 cause of hallucination.
- ❌ **Violação:** Testar o agente localmente passando apenas 1 arquivo de contexto, mas em produção o RAG injeta 15 arquivos.
- ✅ **Conformidade:** O ambiente de Evals (`eval-runner.ts`) simula exatamente os mesmos `context_files` que a produção injetará.

### XI. Telemetry as Event Streams
Every tool call and logic step must be observable.
- ❌ **Violação:** O agente usar `console.log("deu erro")` no meio de uma Server Action.
- ✅ **Conformidade:** O agente emite um tipo estruturado `TELEMETRY_EVENT` que o `Watcher_Agent` consome de forma assíncrona.

### XII. Human in the Loop (Admin Processes)
High-risk decisions require escalation.
- ❌ **Violação:** O Worker gera um arquivo SQL com `DROP TABLE` e aplica direto via tool.
- ✅ **Conformidade:** O hook `pre-tool-use.sh` barra o comando e força o Orchestrator a disparar um `IncidentBriefingPayload` para o usuário, exigindo confirmação explícita.

---

*Specification generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*
