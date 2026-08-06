# Plano de Implementação — Fechando os Gaps do doc 28 (Metodologia Prisma Aplicada a Si Mesma)

**Classification:** IMPLEMENTATION PLAN (usa o vocabulário de `agentes/00_Sprint_Zero_Protocol.md` e `agentes/01_Architect_Agent.md` §3.4 deliberadamente — ver §0)
**Codename:** `Methodology_Gaps_Plan`
**Version:** V5.0
**Context Layer:** Tático (execução dos achados de `docs/28_LangGraph_Feasibility_Analysis.md` §5-§8)
**Status:** 🟢 A2 e C1-C4 implementadas nesta sessão (A2 via loop TRM real, ver §4; C1-C4 implementadas diretamente). A1 (reorg de pastas) e B1 (rename V3.1/V4) deliberadamente adiadas — ver §5, são as duas maiores e a ordem recomendada as deixa por último.

---

## 0. Por que este plano está estruturado assim

Você pediu pra usar "a lógica do Prisma atualmente, e também a metodologia mesmo que não implementada" — então este plano não é uma lista de tarefas genérica. Cada item abaixo passa pelo **Task Type Router** (`00_Orchestrator_Protocol.md` §4) antes de virar tarefa, cada tarefa `CREATION`/`HYBRID` ganha um **Dynamic Rubric** de 3-5 critérios (`01_Architect_Agent.md` §3.4) escrito ANTES da execução e escondido do Worker, e o próprio plano usa uma versão nova de protocolo — **Coordinated Sprint Group** — desenhada especificamente para resolver o gap que `docs/28` §8.3 encontrou (Single-Artifact Cadence não tem protocolo pra mudança atômica multi-arquivo). Não dava pra planejar a correção desse gap sem primeiro *ter* o protocolo que ele está pedindo — então ele nasce aqui, no §1, antes das tarefas que precisam dele.

---

## 1. Protocolo novo: Coordinated Sprint Group (resolve doc 28 §8.3)

**Problema que resolve:** `03_Auditor_Agent.md` §2 só carrega o(s) arquivo(s)-alvo da tarefa atual — estruturalmente incapaz de checar consistência entre arquivos, mesmo entre Sprints sequenciais do mesmo grupo lógico.

**Proposta:**

```
Quando uma mudança exige N arquivos mutuamente consistentes (ex.: renomear um enum
usado em schema + Zod + specs de agente):

1. O Architect declara um COORDINATED_SPRINT_GROUP com:
   - group_id
   - member_files: string[]           (os N arquivos)
   - shared_invariant: string          (o que precisa ser verdade em TODOS ao final,
                                         ex.: "nenhum arquivo usa mais 'V4' como valor
                                         de compilation_target")
   - one Dynamic Rubric criterion comum a todas as tarefas do grupo, mais os critérios
     específicos de cada arquivo individual

2. Cada arquivo do grupo ainda é gerado/editado UM DE CADA VEZ (Single-Artifact
   Cadence continua valendo POR ARQUIVO — não é uma licença pra voltar a gerar
   multi-arquivo de uma vez).

3. Depois que o ÚLTIMO arquivo do grupo é entregue, o Auditor recebe uma dispensa
   TEMPORÁRIA e EXPLÍCITA da regra de acesso: pode carregar os outros N-1 arquivos do
   grupo (só esses, não a base de código inteira) para verificar o shared_invariant.
   Isso é logado como GATEWAY_CHECK (`17_Prisma_Message_Protocol.md` §3.4 GATEWAY_RESULT),
   não como um AUDIT_REQUEST normal — é uma auditoria de COSTURA, não de arquivo.

4. Se o shared_invariant falhar, o grupo inteiro fica REJECTED, com
   remediation_guidance apontando exatamente qual arquivo quebrou o invariante —
   mesmo que aquele arquivo individualmente tivesse passado no seu próprio audit.
```

Isso preserva o motivo de existir do Single-Artifact Cadence (Worker focado, diffs revisáveis) e fecha o buraco (ninguém nunca checava se as peças se encaixavam). A Tarefa B1 abaixo é o primeiro uso real desse protocolo.

---

## 2. Sprints (Fases independentes onde possível — dependências marcadas)

### Fase A — Fundação (baixo risco)

#### Sprint A1 — Reorganizar `docs/` em pastas por modo (resolve doc 28 §5)
- **Task Type:** `HYBRID` (leitura de todas as referências cruzadas existentes + movimentação + correção de referência — não é só mover arquivo)
- **Ordem escolhida:** por último dentro da Fase A, depois do conteúdo estabilizar (mover pastas ANTES criaria conflito de caminho com as tarefas B/C que ainardam editando conteúdo nesses mesmos docs)
- **Dynamic Rubric:**
  - R1 (FUNCTIONAL): `docs/kernel/`, `docs/solo/`, `docs/langgraph/` existem; `docs/skills/` permanece; todo doc de `docs/MANIFEST.md` tem seu novo caminho refletido
  - R2 (CONSISTENCY): nenhuma referência cruzada (`ref: docs/XX_...`) quebrada — checagem via grep de `docs/XX_` em todo o repo pós-move
  - R3 (SCOPE): não editar conteúdo dos arquivos nesta tarefa — só caminho. Conteúdo é responsabilidade das tarefas B/C.
- **Depende de:** nenhuma tarefa de conteúdo pendente (rodar por último)

#### Sprint A2 — Terceiro nível no Rule Detector + `business_config` (resolve doc 28 §7)
- **Task Type:** `CREATION`
- **Arquivos:** `agentes/05_Backend_Agent.md` §3.3, `schemas/02_Initial_Schema_V4.sql` (nova tabela)
- **Dynamic Rubric:** ver §4 — esta foi a tarefa escolhida pro teste real do loop TRM, o rubric completo e o resultado estão lá, não duplicado aqui.
- **Depende de:** nenhuma
- **Status:** ✅ Executada nesta sessão via subagentes reais (Worker + Auditor isolado) — ver §4.

### Fase B — Migração de nomenclatura (médio risco, multi-arquivo)

#### Sprint B1 — Renomear `compilation_target`: `V3.1`→`DIRECT`, `V4`→`GOVERNED` (resolve doc 28 §6)
- **Task Type:** `HYBRID`, executado como **Coordinated Sprint Group** (§1) — este é exatamente o tipo de mudança que motivou o protocolo
- **member_files (grupo):** todo union type TypeScript `"V3.1" | "V4" | "HYBRID"` (≥6 specs de agente + PMP + KPIs), `schemas/02_Initial_Schema_V4.sql` (default de coluna), títulos de `11_Golden_Sample_FitPro.md` e `12_Golden_Sample_Ecommerce.md`, `05_Security_Governance_Policy.md` §6.1, `15_Architectural_Decision_Framework.md` (a taxonomia inteira)
- **shared_invariant:** "nenhum arquivo no repositório usa `'V3.1'`/`'V4'` como valor de `compilation_target` — todos usam `'DIRECT'`/`'GOVERNED'`; `scripts/version-consistency-check.ts` não pode confundir isso com a versão do Kernel (já não confunde, mas o novo valor precisa continuar fora do allowlist de padrões de versão)"
- **Dynamic Rubric (nível de grupo, além dos critérios por arquivo):**
  - R1 (FUNCTIONAL): todo union type compila (nenhum arquivo `.ts` com o valor antigo)
  - R2 (CONSISTENCY — o shared_invariant): grep de `'V3\.1'|"V4"` como valor de enum retorna zero fora de contexto histórico explicitamente marcado
  - R3 (DATA_CONTRACT): coluna SQL migrada com um comentário de migração (não é so trocar o `default`, é documentar a mudança de nome pra quem já tem dados com o valor antigo)
  - R4 (CLARITY): os dois Golden Samples continuam claros sobre qual arquitetura demonstram, com os novos nomes
- **Depende de:** Sprint A2 concluído (não estritamente necessário, mas evita dois Coordinated-Sprint-Groups simultâneos editando arquivos sobrepostos)
- **Esforço:** alto — maior tarefa do plano, deliberadamente não executada nesta sessão (ver §5, Recomendação)

### Fase C — Protocolos de metodologia novos (resolve doc 28 §8, exceto §8.3 já resolvido em §1)

#### Sprint C1 — Protocolo de retroalimentação de produção → método (resolve doc 28 §8.1)
- **Status:** ✅ Implementado nesta sessão — tabelas `production_incidents`+`policy_decision_feedback`, MessageType `PRODUCTION_INCIDENT_LINKED`, campo `source` em `common_violations`.
- **Task Type:** `CREATION`
- **Proposta concreta a implementar:**
  - Nova tabela `production_incidents` (`id`, `related_audit_log_id` FK nullable, `related_generated_artifact_id` FK, `severity`, `description`, `reported_at`, `resolved_at`)
  - Novo tipo de entrada em `learnings.json.common_violations`: campo `source: "audit_time" | "production"` — hoje só existe a fonte "descoberta durante auditoria"; a fonte "descoberta depois, em produção" é o dado que faltava
  - Novo `MessageType` no PMP: `PRODUCTION_INCIDENT_LINKED` (Watcher → Orchestrator), que soma ao domínio `QUALITY` que o Watcher já monitora
- **Dynamic Rubric:**
  - R1 (FUNCTIONAL): schema da tabela + payload do MessageType definidos com FKs corretas pro schema existente
  - R2 (CONSISTENCY): `common_violations.source` é aditivo (não quebra entradas existentes, que ficam implicitamente `"audit_time"`)
  - R3 (BUSINESS_LOGIC): o protocolo descreve explicitamente QUEM/O QUE cria a ligação entre um incidente real e o audit_log original (isso não pode ficar implícito — é o coração do gap)
- **Depende de:** nenhuma

#### Sprint C2 — Documentar origem/recalibração dos limiares numéricos (resolve doc 28 §8.2)
- **Status:** ✅ Implementado nesta sessão — nota de calibração adicionada aos 4 limiares (score 9.5, delta 0.3, circuit breaker 5, regressão 5%).
- **Task Type:** `DEEP_READ` seguido de `CREATION` curta (é mais levantamento do que geração)
- **Escopo:** `score ≥ 9.5`, delta de estagnação `< 0.3`, circuit breaker `5` falhas, regressão `> 5%` — para cada um, adicionar uma nota `**Calibração:**` no documento onde vive, indicando explicitamente "valor inicial não calibrado empiricamente — recalibrar após N execuções reais" quando for o caso (é o caso de todos, hoje)
- **Dynamic Rubric:**
  - R1 (FUNCTIONAL): os 4 limiares citados têm a nota adicionada
  - R2 (SCOPE): não mudar o VALOR dos limiares — só documentar a falta de calibração. Mudar o valor sem dado é o mesmo erro de novo com um número diferente.
- **Depende de:** nenhuma

#### Sprint C3 — Pipeline de feedback humano (👍/👎) → Evolutionary Optimizer (resolve doc 28 §8.4)
- **Status:** ✅ Implementado nesta sessão — tabela `policy_decision_feedback`, MessageType `POLICY_FEEDBACK_VOTE`, regra de threshold em `docs/16` §6 (nova).
- **Task Type:** `CREATION`
- **Proposta concreta:** nova tabela `policy_decision_feedback` (`audit_log_id` FK, `user_id`, `vote: "up" | "down"`, `created_at`); regra no Evolutionary Optimizer (`docs/16`): decisões com `vote: "down"` acima de um threshold viram candidatas automáticas a novo Golden Sample de contraexemplo (`must_not_contain` no Evals — doc 22)
- **Dynamic Rubric:**
  - R1 (FUNCTIONAL): tabela definida, ligada ao Optimizer com uma regra explícita de quando um voto vira sinal de treinamento
  - R2 (CONSISTENCY): não contradiz o formato de `ExperimentRecord` já definido em `docs/16` §5
- **Depende de:** nenhuma

#### Sprint C4 — Circuit breaker de custo por TAREFA, não só por sessão (resolve doc 28 §8.5)
- **Status:** ✅ Implementado nesta sessão — `max_cost_per_task_usd` em `prisma.config.json`/`.md`, gatilho documentado em `00_Orchestrator_Protocol.md` §8.2, campo `current_task_cost_usd` em `OrchestratorState` §9.1.
- **Task Type:** `CREATION`
- **Proposta concreta:** novo campo em `prisma.config.json.orchestration`: `max_cost_per_task_usd` (paralelo ao `max_audit_attempts` que já existe); o Orchestrator soma `tokens_used × preço-do-modelo` a cada iteração da mesma tarefa e força Fresh Eyes imediato (não espera a estagnação por score) se o teto for cruzado, independente de quantas iterações já rodaram
- **Dynamic Rubric:**
  - R1 (FUNCTIONAL): campo de config definido com um valor default razoável e documentado
  - R2 (CONSISTENCY): a nova checagem de custo é uma condição adicional pra disparar Fresh Eyes (`00_Orchestrator_Protocol.md` §8.2), não substitui a de estagnação — as duas convivem
- **Depende de:** nenhuma

---

## 3. Ordem de execução recomendada

```
Fase A (paralelo entre si, exceto A1 por último)
  A2 (teste TRM real) ──▶ [já rodou, ver §4]
  A1 (reorg de pastas) ──▶ por último, depois de B e C estabilizarem conteúdo
       │
Fase C (paralela entre si, todas independentes)
  C1, C2, C3, C4 ──▶ podem rodar em qualquer ordem / paralelo
       │
Fase B (a mais arriscada — deixa por último de propósito)
  B1 (rename V3.1/V4, Coordinated Sprint Group) ──▶ depois de C1-C4,
       para não competir por atenção de revisão com 4 protocolos novos
       sendo introduzidos ao mesmo tempo
```

---

## 4. Sprint A2 como teste real do loop TRM

Esta seção documenta o que **de fato aconteceu** ao rodar Sprint A2 através de dois subagentes reais do Claude Code (ferramenta `Agent`) — um no papel de Worker, isolado, sem ver este plano nem o rubric; outro no papel de Auditor, isolado do primeiro, sem ver o `reasoning_trace` do Worker. Nada abaixo foi simulado ou previsto de antemão — é o log real da execução desta sessão.

### 4.1 Rodada 1 — Worker

Dispatch via `Agent` (subagent_type `general-purpose`), instruído a ler `05_Backend_Agent.md` §3, `docs/11_Golden_Sample_FitPro.md`, e editar exatamente dois arquivos. Não recebeu o Dynamic Rubric nem o Audit Framework — só a tarefa e os arquivos de contexto, seguindo `agentes/02_Worker_TRM_Agent.md` §2 ("Worker MUST NOT load `04_Audit_Framework.md`").

**Resultado:** editou `agentes/05_Backend_Agent.md` §3.3 (novo terceiro tier `business_config` na árvore de decisão, com exemplo contrastante) e adicionou a tabela `business_config` em `schemas/02_Initial_Schema_V4.sql` (RLS, índices, trigger, constraints). Verifiquei os dois arquivos linha a linha antes de prosseguir — o resumo do Worker bateu com o diff real.

### 4.2 Rodada 1 — Auditor (isolado)

Dispatch via `Agent` novo (contexto zerado — não é o mesmo processo do Worker, não recebeu o `reasoning_trace` nem este documento), com ferramentas restritas a Read/Grep e instrução explícita de não editar nada. Recebeu só: onde olhar (os dois arquivos + `docs/11`) e o Dynamic Rubric R1-R4 definido no §2 deste plano — sem saber que um "Worker" tinha escrito aquilo, seguindo `03_Auditor_Agent.md` §4.3 (Anti-Attribution).

**Veredito real: REJECTED.** R1/R2/R4 = PASS (com achados MINOR/MAJOR pontuais); **R3 = FAIL**, com evidência de linha para 4 fontes que eu não tinha pedido pra ele checar especificamente — ele foi buscar sozinho:

| Severidade | Achado | Local |
|:---|:---|:---|
| 🔴 CRITICAL | `01_Architect_Agent.md` (Gateway V4), `docs/15` (heurística ADR) e `docs/04_Audit_Framework.md` (Kill Switch, "Supreme Law") continuavam afirmando a regra binária antiga como absoluta, sem saber que `business_config` existe — e o `<access_list>` do próprio Auditor (`03_Auditor_Agent.md`) não alcança `05_Backend_Agent.md`, então nem teria como aprender sozinho | 4 arquivos, citados com número de linha |
| 🟠 MAJOR | Exemplo de código canônico usa `.single()` sem checar erro/null — quebra na primeira vez que o projeto não tem a chave configurada ainda | `05_Backend_Agent.md:120-125` |
| 🟡 MINOR | Índice redundante (`idx_business_config_project`) já coberto pela constraint `unique(project_config_id, key)` — comparado com o padrão real de `document_embeddings`/`semantic_cache` no mesmo arquivo | `schemas/02_Initial_Schema_V4.sql:247` |
| 🟡 MINOR | Citação da regra do FitPro no exemplo omite a condição "Intermediate-level students" que o documento original tem | `05_Backend_Agent.md:134` vs `docs/11:60` |

Conferi as 4 citações do CRITICAL manualmente (grep direto) — todas batem exatamente com o que o Auditor citou.

### 4.3 Refine — aplicado

Todos os 7 itens de `remediation_guidance` foram aplicados nesta sessão: os 4 arquivos do achado CRITICAL agora citam `business_config` explicitamente (incluindo o `<access_list>` do Auditor, que ganhou `05_Backend_Agent.md §3.3` em `load_if_needed`), o bug MAJOR do `.single()` virou `.maybeSingle()` com default, e os dois MINOR foram corrigidos. Não rodei uma segunda rodada de Auditor pra reconfirmar score — isso fica registrado como próximo passo natural, não como "aprovado" sem verificação.

### 4.4 O que isso prova, honestamente

- **A isolação de contexto funcionou de verdade, não só na teoria.** O Auditor achou um problema estrutural (o próprio mecanismo de acesso do Auditor não alcançava o novo conteúdo) que eu, projetando o rubric com o contexto inteiro desta conversa na cabeça, não tinha antecipado. Isso é exatamente o efeito que `03_Auditor_Agent.md` promete e que uma auto-revisão (mesmo contexto, mesmo modelo) provavelmente não pegaria — eu sabia que os dois arquivos editados estavam corretos *isoladamente* e não tinha o gatilho pra ir caçar contradição em três outros documentos que eu mesmo escrevi/editei sessões atrás.
- **Isso não prova que o loop completo (múltiplas iterações, Fresh Eyes, providers diferentes) funciona** — foi uma rodada só, aprovação não confirmada após o refine, um único par de papéis. É evidência real a favor da isolação de contexto especificamente, não uma validação do sistema inteiro.
- **Custo real:** ~301k tokens de subagente somados (154k Worker + 146k Auditor) e ~23 minutos de wall-clock pelas durações reportadas, para uma tarefa de dois arquivos. Isso é dado concreto para a discussão de custo/benefício de `docs/28` §2.2 — não é barato, e essa é uma tarefa pequena.

