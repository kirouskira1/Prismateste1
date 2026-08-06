# 📚 Prisma V5.0 (Loop Architecture + Fable Patterns + Harness Engineering) — Official MANIFEST

**Classification:** MASTER INDEX  
**Version:** V5.0  
**Total Canonical Documents:** 46 files (11 `agentes/` + 32 `docs/` + 3 `docs/skills/`) — recounted directly against disk, see `docs/26_Version_Unification_Plan.md`  
**Language:** EN-US  
**Status:** All canonical, Adaptive-informed, Access-List enforced, Fable-hardened, Harness-enhanced  

---

## 🔖 Version Policy

- **Fonte única da verdade:** o arquivo `/VERSION` na raiz do repositório (atualmente `5.0.0`). Qualquer menção de versão em prosa deve ser consistente com ele.
- **`V4.1`–`V4.5` em qualquer documento são históricos/depreciados.** Nunca devem ser lidos como um "modo" alternativo que a IA possa escolher — são apenas marcações de quando uma feature foi introduzida, preservadas por rastreabilidade.
- **`compilation_target` (`"V3.1"` | `"V4"` | `"HYBRID"`) é um eixo diferente e não relacionado:** é o nome fixo do perfil arquitetural do projeto *gerado pelos agentes* (SaaS direto vs. Governança/Policy Agents vs. híbrido), definido em `docs/15_Architectural_Decision_Framework.md`. **Não é a versão do Kernel Prisma** e nunca deve ser "atualizado" para acompanhar a versão do framework — não existe um target `"V5"`.
- Detalhes completos da migração V4.x → V5.0: ver `docs/26_Version_Unification_Plan.md`.

---

## Agent Specifications (`agentes/`)

| # | File | Codename | Description |
|:---:|:---|:---|:---|
| 00 | `00_Orchestrator_Protocol.md` | `Orchestrator` | Session lifecycle, execution mode detection, task routing, dual-mode dispatch, Fresh Eyes, anti-collapse, access lists, isolated feedback relay, model asymmetry protocol |
| 00 | `00_Sprint_Zero_Protocol.md` | `Sprint_Zero` | Document generation protocol (8 artifacts) |
| 01 | `01_Architect_Agent.md` | `Architect_TRM` | Architecture decisions, task decomposition, dual-mode orchestration, dynamic rubric generation |
| 02 | `02_Worker_TRM_Agent.md` | `TRM_Worker` | Code generation, self-check, context-isolated from Auditor |
| 03 | `03_Auditor_Agent.md` | `Auditor_TRM` | Code judgment, scoring, anti-collapse hardened, re-grounding, progress grounding, dual-dimension audit (static + dynamic rubric) |
| 04 | `04_Design_Agent.md` | `Design_Agent` | Stitch → React translation, MCP mapping, Factory 1 isolated |
| 05 | `05_Backend_Agent.md` | `Backend_Agent` | Server Actions, SQL, Policy delegation, Factory 2 isolated |
| 06 | `06_Policy_Agent.md` | `Policy_Agent` | Zero Hard-Code, RAG, regras de negócio. |
| 07 | `07_Security_Agent.md` | `Security_Agent` | Interceptor contra prompt injection e RLS bypass. |
| 08 | `08_Watcher_Agent.md` | `Watcher_Agent` | Monitoramento autônomo e detecção de looping. |
| 09 | `09_Scout_Agent.md` | `Scout_Agent` | Batedor de inteligência web (anti-alucinação). |

---

## Reference Documents (`docs/`)

| # | File | Codename | Description |
|:---:|:---|:---|:---|
| 000 | `000_Kernel_System_Override.md` | `Kernel` | O "Sistema Operacional". Regras absolutas sobrepostas a todos os agentes. |
| 00 | `00_Execution_Playbook.md` | `Execution_Playbook` | Ordem cronológica de execução por Fase/Sprint. Referenciado como fonte 🔴 por Architect, Orchestrator e Kernel §6 — estava ausente deste índice até esta correção. |
| 00 | `00_Orchestrator_Protocol.md` | `Orchestrator` | O Maestro. Tabela de roteamento, controle de chapéus e Anti-Collapse. |
| 00 | `00_Sprint_Zero_Protocol.md` | `Sprint_Zero` | O playbook de inicialização. Criação de artefatos essenciais. |
| - | `.prisma/agent_registry.json` | `Registry` | Catálogo de Auto-Discovery de Agentes. |
| 00 | `00_Prisma_Concepts_DeepDive.md` | `Concepts` | TRM theory, SAP logic, 5 Golden Rules |
| 01 | `01_Whitepaper_Architecture.md` | `Whitepaper` | Hybrid architecture (Build vs Run-Time) |
| 02 | `02_Infrastructure_Stack_Spec.md` | `Infra` | Docker services, dev tools, product stack |
| 03 | `03_MCP_Component_Registry.md` | `MCP_Registry` | Tremor + Magic UI + shadcn/ui catalog |
| 04 | `04_Audit_Framework.md` | `Audit_Framework` | Quality checklist, scoring formula, kill switches, dynamic rubric integration |
| 05 | `05_Security_Governance_Policy.md` | `Security_Policy` | 5 Golden Rules, data sovereignty, RLS |
| 06 | `06_LangGraph_Orchestrator_Spec.md` | `LangGraph` | Python orchestrator, AgentState, task-type routing, Fresh Eyes node, model routing, rubric state |
| 07 | `07_Prompt_Engineering_Library.md` | `Prompt_Library` | RAG enrichment, system prompts, access list pattern, isolated feedback relay pattern, anti-collapse patterns |
| 08 | `08_Stitch_Prompting_Protocol.md` | `Stitch` | Visual prompt engineering for Stitch |
| 09 | `09_Deployment_Pipeline.md` | `Deployment_Pipeline` | CI/CD architecture, GitHub Actions stages, environment bootstrap |
| 09 | `09_External_Knowledge_References.md` | `References` | Bibliography and tool references |
| 10 | `10_Implementation_Plan.md` | `Impl_Plan` | Reasoning prompts per task type |
| 11 | `11_Golden_Sample_FitPro.md` | `Golden_Sample` | Wrong vs Right code (V2 vs V4) |
| 12 | `12_Golden_Sample_Ecommerce.md` | `Golden_Sample_Ecom` | Delegação de aprovação financeira e e-commerce |
| 13 | `13_Agent_Dashboard_Wireframe_Spec.md` | `Dashboard` | Agent Control Center wireframe |
| 14 | `14_Factory_KPIs.md` | `KPIs` | Efficiency, quality, evolution metrics |
| 15 | `15_Architectural_Decision_Framework.md` | `ADR` | Compilation target triage heuristics |
| 16 | `16_Evolutionary_Optimizer_Spec.md` | `Optimizer` | A/B testing, auto-promotion |
| 17 | `17_Prisma_Message_Protocol.md` | `Messages` | Inter-agent communication standard, Fresh Eyes + Task Routing + SPRINT_ZERO + Watcher types |
| 18 | `18_Design_First_PRD_Protocol.md` | `Design_First` | Visual PRD generation from mockups/images |
| 19 | `19_Resilience_Protocol.md` | `Resilience` | (V5.0) Retry with exponential backoff + Circuit Breaker per LLM provider, Watcher integration, Model Asymmetry fallback |
| 20 | `20_Prompt_Versioning_Protocol.md` | `Prompt_Versioning` | (V5.0) SHA-256 hashing, semver, append-only JSONL, auto-rollback on regression, Optimizer integration |
| 21 | `21_RAG_Pipeline_Spec.md` | `Vector_Intelligence` | (V5.0) pgvector, chunking strategy, RLS on embeddings, Semantic Cache |
| 22 | `22_Evals_Pipeline_Spec.md` | `Evals_Pipeline` | (V5.0) Offline eval suite, regression metrics, deterministic golden test cases |
| 23 | `23_12_Factors_Agents.md` | `12_Factors` | (V5.0) Agent maturity framework, system prompt as code, stateless orchestration |
| 24 | `24_Dataset_Engineering_Spec.md` | `Dataset_Engineering` | (V5.0) DPO trace collection, JSONL schema, Golden filter criteria |
| 25 | `25_Headless_CI_Spec.md` | `Headless_CI` | Bootstrap script, headless runner, Version Consistency Gate, GitHub Actions workflow |
| 26 | `26_Version_Unification_Plan.md` | `Version_Unification` | Changelog completo da migração de versionamento V4.x → V5.0 |
| 27 | `27_Tool_Compatibility_Matrix.md` | `Tool_Compatibility` | Mapa canônico de ferramentas Antigravity ↔ Claude Code, detecção de ambiente de 3 vias, Claude Code Boot Adapter |

---

## Skills (`docs/skills/`)

| File | Artifact Type | Description |
|:---|:---|:---|
| `server_action.md` | Server Action | Sacred Contract, Zod patterns, delegation rule, common mistakes |
| `react_component.md` | React Component | Server vs Client Island, data flow, Factory 1 visual standards |
| `rls_policy.md` | RLS Policy | Policy patterns (user-owned, org-scoped, role-based), security checklist |

---

## Schemas (`schemas/`)

| File | Description |
|:---|:---|
| `02_Initial_Schema_V4.sql` | Master SQL schema (tables, RLS, enums) |
| `03_OpenAPI_V4.yaml` | API contract for external integrations |

---

## Infrastructure

| File | Description |
|:---|:---|
| `prisma.config.json` | Framework configuration (execution mode, orchestration thresholds, thinking mode, agent config, resilience, model_routing) |
| `.env.example` | Environment variable template (no secrets) — copy to `.env.local` |
| `.prisma/state.json` | Session state persistence |
| `.prisma/learnings.json` | Evolutionary optimizer data (root_cause_shifts, agent_stats) |

---

## IDE Configuration

| File | Description |
|:---|:---|
| `AGENTS.md` | Next.js instructions specific for IDE agents |
| `CLAUDE.md` | IDE pointer to AGENTS.md |

---

## Archive (`docs/_archive/references/`)

| File | Size | Description |
|:---|:---:|:---|
| `claude-fable-5.md` | 187 KB | Claude Fable 5 system prompt — reverse engineering reference |
| `full_features_list.md` | 9 KB | Lista de 26 features Sakana Fugu + Fable 5 implementadas no Prisma |
| `sakana-fugu-orchestration.md` | 20 KB | Moved into `references/` for consistency (was directly under `_archive/`) |
| `2606.21228v2.pdf` | 6.4 MB | Sakana Fugu paper — multi-agent orchestration research |
| `Externalization_in_LLM_Agents.pdf` | 23.2 MB | LLM Externalization paper — cognitive architecture research |
| `2510.04871v1 (1).pdf` | 427 KB | Additional research paper |

*`analise_curriculo.md` and `curriculo_final.md` (personal, non-Prisma content) were removed from
this table — their deletion was already staged in git when this pass started.*

---

## Advanced Practices

| Concept | Where Applied |
|:---|:---|
| Anti-Collapse / Orchestration Collapse | `00_Orchestrator_Protocol.md` §6, `03_Auditor_Agent.md` §4 |
| Fresh Eyes / Deadlock Resolution | `00_Orchestrator_Protocol.md` §8, `03_Auditor_Agent.md` §6 |
| Task-Type Routing (incl. SPRINT_ZERO) | `00_Orchestrator_Protocol.md` §4, `01_Architect_Agent.md` §4 |
| Formal XML Access Lists | `00_Orchestrator_Protocol.md` §6.4, all agent specs §2 |
| Physical Tool Sandboxing | `00_Orchestrator_Protocol.md` §5, `03_Auditor_Agent.md` §5 |
| Isolated Feedback Relay | `00_Orchestrator_Protocol.md` §9.5, `07_Prompt_Engineering_Library.md` §7 |
| Adaptive Thinking (effort levels) | `000_Kernel_System_Override.md` §7 |
| Context Awareness (no premature stop) | All agents, Kernel §4 |
| Progress Grounding (evidence-based) | Kernel §5, `03_Auditor_Agent.md` §3.4 |
| Re-Grounding Protocol | `03_Auditor_Agent.md` §3.4 |
| Anti-Gaming Filter | `06_LangGraph`, `02_Worker` |
| Model Asymmetry | `00_Orchestrator` §13 |
| Autonomous Watcher | `08_Watcher` |
| Session Isolation | `00_Orchestrator`, `000_Kernel` |
| Agent Auto-Discovery | `00_Orchestrator`, `registry` |
| Data-Driven Execution | `09_Scout_Agent` |
| **Forbidden Phrases** | `03_Auditor_Agent.md` §4.4 |
| **Staleness Check** | `00_Orchestrator_Protocol.md` §9.4 |
| **Tool Call Budget** | `000_Kernel_System_Override.md` §7 |
| **Sequential Exclusion Router** | `00_Orchestrator_Protocol.md` §4 |
| **Skills Protocol** | `02_Worker_TRM_Agent.md` §2.1, `docs/skills/` |

---

*Manifest generated under Prisma V5.0 Kernel directives — Lead Architect Pedro Lucas Santos de Araújo*
