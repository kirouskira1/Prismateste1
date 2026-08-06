# 🔖 Plano de Implementação — Unificação de Versionamento (V4.1–V4.5 → V5.0)

**Classification:** IMPLEMENTATION PLAN
**Owner:** Orchestrator (execução via subagentes em modo SOLO)
**Status:** 🟢 Executado (ver ressalvas na seção "Descoberta crítica" e nos itens não-automatizáveis marcados abaixo)
**Motivação:** A base de código referenciava cinco gerações de versão do Kernel (`V4.1`…`V4.5`, `V5.0`) simultaneamente em specs, configs e nomes de arquivo. Isso cria ambiguidade de "fonte da verdade" que pode induzir alucinação de contexto em agentes de IA.

---

## 🚨 Descoberta crítica durante a execução — leia antes de tudo

O diagnóstico inicial tratava **todo** `V4` no repositório como "versão desatualizada do Kernel". Isso estava **errado** para um caso específico: `compilation_target` (valores `"V3.1"` | `"V4"` | `"HYBRID"`, definidos em `docs/15_Architectural_Decision_Framework.md`) é um **rótulo fixo de perfil arquitetural do projeto gerado pelos agentes** — "V3.1" = SaaS direto, "V4" = Governança/Policy Agents, "HYBRID" = os dois. Isso é **completamente independente** da versão do Kernel Prisma (a numeração V4.5→V5.0 tratada por este plano).

**Consequência prática:** `prisma.config.json` (`"compilation_target": "V4"`) e `.prisma/state.json` (`"compilation_target": "V4"`) **não foram alterados** — mudar isso para `"V5"` estaria errado, pois esse target não existe na taxonomia (`docs/15`). Renomear `schemas/02_Initial_Schema_V4.sql` / `schemas/03_OpenAPI_V4.yaml` para `_V5` também foi descartado pelo mesmo motivo — o "V4" no nome designa o perfil arquitetural que o schema implementa, não uma versão do kernel a ser bumped.

Em vez de renomear, adicionamos notas de desambiguação explícitas em `docs/15_Architectural_Decision_Framework.md`, nos dois arquivos de schema, e na seção "Version Policy" do `docs/MANIFEST.md` (Tarefa 1.4), deixando claro para qualquer agente de IA que **"V4" como compilation_target ≠ "V4.x" como versão do Kernel**.

---

## 📊 Diagnóstico → Resultado

| Fonte | Valor antes | Valor depois |
|---|---|---|
| `package.json` → `name` | `prisma-v5-project` | ✅ inalterado (já correto) |
| `prisma.config.json` → `compilation_target` | `"V4"` | ✅ **inalterado — é o enum arquitetural, não a versão do Kernel** |
| `.prisma/state.json` → `compilation_target` | `"V4"` | ✅ **inalterado** (mesmo motivo) |
| `.prisma/agent_registry.json` → `version` | `"4.4"` | `"5.0"` |
| `.prisma/state.json` → `project` | `"Prisma V4.5 OS"` | `"Prisma V5.0 OS"` |
| `docs/MANIFEST.md` → título | `"V4.5 → V5.0 (in progress)"` | `"Prisma V5.0 (...) — Official MANIFEST"` |
| Arquivos citando `V4.1`–`V4.5` (identidade/versão ativa) | ~50 ocorrências em 37 arquivos | migradas para `V5.0` |
| Tags inline de origem de feature (`(V4.4)`, `V4.3 — `, etc.) | dezenas, espalhadas | removidas/simplificadas (a feature já é baseline da V5.0) |
| Menções genuinamente históricas (`legacy V4.2`, narrativas de "antes/depois") | ~6 ocorrências | preservadas como estão (corretamente contextualizadas) |
| `schemas/02_Initial_Schema_V4.sql`, `03_OpenAPI_V4.yaml` + cópias na raiz | nome com `V4`, versão interna desatualizada | nome **mantido** (é o compilation_target); versão interna do Kernel atualizada p/ 5.0; nota de desambiguação adicionada |
| `docs/_archive/**` | menções a V4.1/V4.2 | ✅ inalteradas (é arquivo morto, histórico por definição) |

Comando de auditoria (reexecutar para validar):
```bash
grep -rlE "V4\.[1-5]" --include="*.md" --include="*.json" --include="*.js" --exclude-dir=node_modules --exclude-dir=.git -I .
```
Resultado esperado hoje: apenas `schemas/02_Initial_Schema_V4.sql` + cópia raiz (comentários de linhagem V3/V4/V4.4, intencionalmente preservados), `docs/_archive/**`, menções explicitamente históricas (`legacy V4.2`, notas "Historical:"), e este próprio documento.

---

## Tarefa 1 — Fonte única da verdade (Single Source of Truth) — ✅ Concluída

- [x] 1.1 Criado `/VERSION` na raiz contendo `5.0.0`.
- [ ] 1.2 **Não automatizado** — decisão de semântica SemVer completa (kernel vs. schema vs. protocolo de mensagens) requer definição humana de política de release; recomenda-se registrar como ADR em `docs/15_Architectural_Decision_Framework.md` quando o time definir a cadência de releases.
- [x] 1.3 Confirmado: `V4.1`–`V4.5` são históricos/depreciados, nunca um "modo" selecionável.
- [x] 1.4 Seção "🔖 Version Policy" adicionada em `docs/MANIFEST.md`, incluindo a distinção crítica `compilation_target` vs. versão do Kernel.

---

## Tarefa 2 — Migrar configs machine-readable — ✅ Concluída (com a correção acima)

- [x] 2.1 ~~`prisma.config.json`: compilation_target V4→V5~~ **Revertido/descartado** — ver "Descoberta crítica".
- [x] 2.2 `.prisma/agent_registry.json`: `version: "4.4"` → `"5.0"`; `description` atualizada para `"Prisma V5.0 Agent Auto-Discovery Registry"`.
- [x] 2.3 `.prisma/state.json`: `project` → `"Prisma V5.0 OS"`; `compilation_target` conferido e mantido `"V4"` (correto).
- [x] 2.4 `.agents/skills/*/SKILL.md` auditados — nenhum tinha `compilation_target` hardcoded; menções de identidade (`Prisma V4.5`) corrigidas para V5.0.
- [x] 2.5 Schemas: nome mantido (`_V4` = compilation_target), carimbo de versão do Kernel interno atualizado para 5.0, nota de desambiguação adicionada em ambos os arquivos e nas cópias da raiz. Cópia raiz `02_Initial_Schema_V4.md` sinalizada como **potencialmente desatualizada** em relação a `schemas/02_Initial_Schema_V4.sql` (esta última já tem a seção RAG Pipeline V5.0 que a cópia não tem — divergência de conteúdo pré-existente, fora do escopo deste plano de versionamento; recomenda-se revisão manual futura ou automatizar a cópia via `sync_obsidian.js`).
- [x] 2.6 Validado — nenhum `.json` de config restante contém `V4.1`–`V4.5` fora de contexto correto.

---

## Tarefa 3 — Atualizar documentação canônica — ✅ Concluída

- [x] 3.1 `docs/MANIFEST.md` título atualizado para `"Prisma V5.0 (...) — Official MANIFEST"`.
- [x] 3.2–3.3 37 arquivos migrados via script determinístico (`sed`) com regras específicas por padrão (identidade, título, tags inline com traço/dois-pontos/parênteses) — não "em massa" cego: cada categoria de padrão foi extraída via grep, revisada manualmente antes de aplicar, e o resultado foi reauditado depois. Ocorrências genuinamente históricas (narrativas "era assim antes", `legacy V4.2`, exemplo de changelog em `docs/20_Prompt_Versioning_Protocol.md`) foram deixadas intactas.
- [x] 3.4 `docs/06_LangGraph_Orchestrator_Spec.md` recebeu banner explícito: modo não ativo (`execution_mode: SOLO` é o real), para não confundir um agente sobre qual orquestrador está de fato rodando.
- [x] 3.5 `docs/20_Prompt_Versioning_Protocol.md` — o exemplo histórico de changelog (linha com `"Initial V4.5 worker system prompt"`) foi mantido como está: é a própria demonstração do protocolo de versionamento de prompts, legitimamente histórico.
- [x] 3.6 `AGENTS.md` / `.agents/AGENTS.md` / `CLAUDE.md` — raiz não cita versão Prisma (é sobre convenções Next.js); `.agents/AGENTS.md` corrigido para V5.0.

---

## Tarefa 4 — Especificações de agentes (`agentes/00`–`09`) — ✅ Concluída

- [x] 4.1 Todos os 11 arquivos em `agentes/` têm `**Version:** V5.0` no cabeçalho.
- [x] 4.2 Sincronizado com `.prisma/agent_registry.json` (`"version": "5.0"`).
- [x] 4.3 `.agents/BOOT_KERNEL.md` corrigido (era `"Prisma V4.5 Fleet"`).

---

## Tarefa 5 — Renomear artefatos com versão no nome do arquivo — ⚠️ Escopo revisado

- [x] 5.1 Levantados: `02_Initial_Schema_V4.md`, `03_OpenAPI_V4.md`, `schemas/02_Initial_Schema_V4.sql`, `schemas/03_OpenAPI_V4.yaml`.
- [x] 5.2 **Decisão final: NÃO renomear nenhum dos quatro.** Ver "Descoberta crítica" — `V4` nesses nomes é o compilation_target, não a versão do Kernel. Renomear introduziria a exata ambiguidade que este plano existe para eliminar (sugerindo falsamente a existência de um target `"V5"`).
- [x] 5.3/5.4 N/A (nenhum rename executado, nenhuma referência quebrada).

---

## Tarefa 6 — Guarda-rail anti-drift — ✅ Concluída

- [x] 6.1 Criado `scripts/version-consistency-check.ts` — varre `*.md`/`*.json` do repo, ignora `node_modules`, `docs/_archive`, e trechos explicitamente históricos, e falha se encontrar `V4.1`–`V4.5` fora desses contextos. **Importante:** o script tem uma allowlist para `compilation_target` e para os arquivos `schemas/*_V4.*` — ver comentário no topo do script.
- [x] 6.2 Documentado como etapa recomendada de CI em `docs/25_Headless_CI_Spec.md` (nova seção "Version Consistency Gate").
- [x] 6.3 Comando documentado em `docs/20_Prompt_Versioning_Protocol.md`.
- [ ] 6.4 **Não automatizado** — hook de pre-commit local não foi instalado (exigiria mexer em `.git/hooks` ou introduzir Husky como nova dependência; decisão que cabe ao usuário, fora do escopo de "arrumar versionamento").

---

## Tarefa 7 — Validação final — ✅ Concluída

- [x] 7.1 Auditoria reexecutada — resultado: zero menções ativas fora dos contextos esperados (ver seção Diagnóstico → Resultado).
- [x] 7.2 `scripts/version-consistency-check.ts` roda e retorna exit 0 no estado atual do repo.
- [x] 7.3 `docs/MANIFEST.md`, `.prisma/agent_registry.json`, `.prisma/state.json` e `prisma.config.json` conferidos lado a lado — todos consistentes com V5.0 do Kernel, e `compilation_target` consistente como enum arquitetural em ambos os arquivos que o usam.
- [x] 7.4 `docs/MANIFEST.md` → `(in progress)` removido; `**Version:** V5.0`.
- [x] 7.5 Este documento **é** o changelog da migração V4.x → V5.0.

---

## Pendências que ficaram fora do escopo automatizável

1. **Divergência de conteúdo** entre `schemas/02_Initial_Schema_V4.sql` (canônico, já tem RAG Pipeline V5.0) e a cópia `02_Initial_Schema_V4.md` na raiz (desatualizada) — é um problema de *duplicação de arquivo*, não de rótulo de versão; recomenda-se decidir se a cópia raiz deve ser gerada automaticamente (via `scripts/sync_obsidian.js`) ou removida.
2. **ADR formal de SemVer** (Tarefa 1.2) — decisão de política, não mecânica.
3. **Pre-commit hook** (Tarefa 6.4) — decisão de tooling, não mecânica.

---

## Rodada 2 — Implementação do Plano de Auditoria (Relatório DEEP_READ)

Após este plano de versionamento, uma auditoria cruzada completa dos 10 eixos de consistência do
framework foi publicada (`docs/27_Tool_Compatibility_Matrix.md` é um dos produtos dela). As
tarefas P0/P1/P2 dessa auditoria que foram implementadas nesta sessão:

- [x] **T1.1/T1.2** Camada de compatibilidade Antigravity↔Claude Code (`27_Tool_Compatibility_Matrix.md`), detecção de `execution_mode` de 3 vias (Kernel §1, Orchestrator §3), `state.json`/`prisma.config.json` corrigidos para `claude_code_hybrid`.
- [x] **T1.3** `BOOT_KERNEL.md` e `boot_prisma_agents/SKILL.md` ganharam coluna de cross-reference com os codenames do registry; permissão do Design corrigida (sem Execute) e do Watcher desambiguada (READ_ONLY com nota de escopo SQL).
- [x] **T3.1** `is_root` duplo no registry desambiguado (`session_root` vs `dispatch_tree_root`).
- [x] **T3.2** `SPRINT_ZERO` registrado como `type: "protocol"`.
- [x] **T3.3** Skills consolidadas — `docs/skills/` é canônico, `.agents/skills/{react_component,rls_policy,server_action}` viraram stubs.
- [x] **T3.4** `never_sees` sincronizado para os 10 agentes/protocolo no registry.
- [x] **T3.5** Contradição de permissão do Watcher corrigida em todas as fontes.
- [x] **T5.1/T5.2** `RESEARCH` adicionado ao union de `TaskRoutingPayload`; gaps de numeração §3.12/§4.6 do PMP corrigidos.
- [x] **T6.1** MANIFEST.md ganhou os documentos que faltavam (`00_Execution_Playbook`, `09_Deployment_Pipeline`, `25`, `26`, `27`).
- [x] **T6.2/T6.3** 14 docs com `Version: V4` puro migrados para V5.0; `.prisma/learnings.json` (`4.2`→`5.0`); `version-consistency-check.ts` estendido para checar campos JSON bare, não só padrões de texto.
- [x] **T6.4** `sakana-fugu-orchestration.md` movido para `references/`; contagem de documentos canônicos recalculada (46, não 42).
- [x] **T8.1** `SECURITY_CHECK` adicionado ao Standard Build Flow (PMP §4.1).
- [x] **T8.2** `.env.example` criado (e liberado do `.gitignore`, que antes o excluía via `.env*` sem exceção).
- [x] **T9.1** `headless-runner.ts`: removido `mockEvalPass = true` hard-coded, agora chama `EvalRunner` de verdade — testado com casos de PASS e FAIL reais.
- [x] **T9.2** Chave `resilience` adicionada a `prisma.config.json`/`.md`.
- [x] **T9.3** `docs/24_Dataset_Engineering_Spec.md` corrigido para citar o nome real do script (`export-training-data.ts`).
- [x] **T10.1** `state.json.sprint_status` corrigido para `"pending"`; `test_regex.js` removido (scratch, não rastreado); `sync_obsidian.js` movido para `scripts/`.

Bônus fora da lista original: os 3 hooks `.claude/hooks/*.sh` tinham um bug de robustez não
identificado na auditoria original — sob `set -e`/`pipefail`, uma extração de campo JSON opcional
que não desse match abortava o script inteiro antes mesmo de avaliar os guards. Corrigido e
testado com 6 payloads sintéticos (bloqueio de SQL sem RLS, bloqueio de comando destrutivo,
bloqueio de Server Action sem `"use server"`, chamada `Read` sem crash, formatação em `Write`).

**Não implementado** (fora do escopo de uma correção mecânica/hygiene): construir um Orchestrator
real que efetivamente gere código via LLM — isso é o próprio produto, não um item de auditoria.
