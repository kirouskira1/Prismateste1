# Análise de Viabilidade: Prisma em LangGraph — Funcionaria? Teria Valor? É Portável?

**Classification:** DECISION SUPPORT (não é spec normativa — é uma análise crítica para decisão humana)
**Codename:** `LangGraph_Feasibility`
**Version:** V5.0
**Context Layer:** Estratégico (antes de investir em implementação)
**Idioma:** Português (documento de análise/decisão, não system prompt de agente — não segue a regra de "camada interna 100% inglês" de `boot_prisma_agents/SKILL.md`)

**Escopo deste documento:** começou como uma análise só do orquestrador LangGraph (Seções 1-4).
As Seções 5-8 são um adendo em resposta a perguntas de acompanhamento sobre organização de
documentação, nomenclatura, o padrão Policy Agent, e gaps de metodologia — mantidas no mesmo
arquivo porque são todas, no fundo, a mesma pergunta: *o que precisa mudar antes de confiar mais
peso a este framework.*

---

## Por que este documento existe

`docs/06_LangGraph_Orchestrator_Spec.md` descreve um orquestrador Python/LangGraph completo — mas é **100% especificação, zero implementação**. Nenhum arquivo `.py` existe no repositório. Este documento responde a três perguntas antes de alguém investir semanas construindo isso de verdade:

1. Se implementado literalmente como especificado, **funcionaria como deveria**?
2. Além de "documentação bonita", **teria valor real mensurável**?
3. O framework é **genérico** (qualquer linguagem/stack) ou **nichado** (Next.js + Supabase)?

Cada seção termina com uma recomendação concreta, não só diagnóstico.

---

## 1. Funcionaria como deveria?

### 1.1 O formato do grafo está certo — isso é o ponto forte real

O shape descrito (`Task_Router` → `Worker` → *edge que filtra `reasoning_trace` do state* → `Auditor` → aresta condicional: `score ≥ 9.5` → fim, senão volta pro `Worker` com contador de iteração, com `Fresh_Eyes_Tiebreaker` entrando quando estagna ou estoura o limite) é **exatamente** o tipo de grafo cíclico com roteamento condicional que LangGraph foi desenhado pra fazer bem. Isso não é forçar uma ferramenta a fazer algo que ela não faz — é o caso de uso canônico.

Mais importante: em LangGraph, o isolamento de contexto do Auditor (`00_Orchestrator_Protocol.md` §6.2 — "NEVER include `reasoning_trace`") deixa de ser uma **instrução que o modelo pode ignorar** e vira **um filtro de state programático, imposto pelo código do grafo**, não pela boa vontade do LLM. Isso é uma melhoria estrutural real sobre o que dá pra garantir hoje numa IDE — no Claude Code, mesmo usando a ferramenta `Agent` (que dá isolamento físico de verdade, ver `docs/27_Tool_Compatibility_Matrix.md` §4), ainda é você quem decide manualmente o que entra no prompt do spawn. Em LangGraph, o node simplesmente não recebe a chave do state que não deveria receber — é impossível vazar por acidente.

O Model Asymmetry Protocol (`00_Orchestrator_Protocol.md` §13.2) também só é **realmente** viável em LangGraph: trocar de provedor por papel (`TRM_WORKER: claude-3.5-sonnet`, `AUDITOR_TRM: gpt-4o`, `FRESH_EYES: gemini-1.5-pro`) via clientes de API reais é trivial em Python; numa IDE isso vira o ritual manual "troque de modelo e digite continue" (§13.1 Strategy A) — funciona, mas depende do humano lembrar de fazer isso toda vez.

### 1.2 Onde a spec, se implementada ao pé da letra, desperdiçaria dinheiro

Aqui está o problema real: boa parte do que os **Kill Switches** (`03_Auditor_Agent.md` §3.2, K1-K6) verificam é **mecanicamente checável sem LLM nenhum**:

| Kill Switch |检查 é... | Custo de fazer via LLM Auditor | Custo de fazer via lint/regex |
|:---|:---|:---:|:---:|
| K1 — `"use client"` em página inteira | Busca de string/AST | 1 chamada LLM completa | ~0ms, determinístico |
| K2 — `import PrismaClient` | Busca de string | 1 chamada LLM completa | ~0ms, determinístico |
| K3 — `/pages/api/`, `getServerSideProps` | Busca de padrão de path | 1 chamada LLM completa | ~0ms, determinístico |
| K4 — API key exposta | Já existe como regex em `07_Security_Agent.md` §4.2 (`SENSITIVE_PATTERNS`) | 1 chamada LLM completa | ~0ms, determinístico |
| K6 — tabela sem RLS | Busca de `ENABLE ROW LEVEL SECURITY` | 1 chamada LLM completa | ~0ms, determinístico |
| K5 — valor de negócio hard-coded | Requer entender *intenção* (`if (x > 500)` pode ser um limite de negócio ou não) | Faz sentido ser LLM | — |

Uma implementação literal da spec manda o Auditor (uma chamada LLM cara) verificar as 6 coisas de uma vez. Isso reproduz com um modelo de linguagem algo que um `grep`/AST-check faz instantaneamente e sem ambiguidade — pior ainda, um LLM pode errar essa checagem (falso negativo em K2 se o import estiver ofuscado, falso positivo se `PrismaClient` aparecer num comentário). O único Kill Switch que genuinamente precisa de julgamento é o K5.

**Recomendação concreta:** ao implementar, separar em duas camadas antes do node `Auditor` do LangGraph:
1. **Gate determinístico** (código Python/TS puro, sem LLM) — roda os 5 Kill Switches mecânicos. Reprova instantaneamente, sem gastar tokens, se qualquer um disparar.
2. **Node Auditor (LLM)** — só roda se o gate determinístico passar, e só precisa avaliar K5 + os domínios subjetivos (arquitetura, qualidade, fidelidade visual).

Isso não é uma crítica cosmética — é a diferença entre um pipeline que custa 1 chamada LLM extra por Kill Switch mecânico (5 chamadas desperdiçadas por iteração, em cada uma das até 4 iterações possíveis) e um que custa zero nisso. **Se implementado ao pé da letra da spec atual, funcionaria, mas seria estruturalmente mais caro e mais lento do que precisa.**

### 1.3 Veredito da pergunta 1

Sim, a arquitetura do grafo funcionaria e é o encaixe certo pra LangGraph — o isolamento de contexto fica mais forte, não mais fraco, e o Model Asymmetry vira realmente executável. Mas a spec como está *não distingue* verificação determinística de verificação por julgamento, e uma implementação ingênua herdaria esse desperdício. Vale corrigir isso na spec **antes** de implementar, não depois.

---

## 2. Teria valor real além de documentação?

Depende inteiramente de **onde** e **como** for usado. Não é uma resposta binária.

### 2.1 Onde o valor é defensável

- **Geração em lote/headless de artefatos repetitivos e de alto risco** (Server Actions, políticas RLS) — exatamente o caso de uso que `docs/25_Headless_CI_Spec.md` e `scripts/headless-runner.ts` já apontam pra essa direção. Rodar isso como um pipeline noturno/disparado por PR, não como chat interativo, é onde o custo de múltiplas chamadas LLM (Worker + Auditor + possível Fresh Eyes) compensa: ninguém está esperando na frente da tela.
- **Suite de evals rodando de verdade, continuamente** (`docs/22_Evals_Pipeline_Spec.md`) — isso é a prática real de LLM-ops madura (gate de regressão antes de promover um prompt novo). Hoje existe como spec + um `EvalRunner` parcialmente real (eu liguei o `headless-runner.ts` a ele nesta sessão, mas a etapa de *geração* ainda é um placeholder estático — ver `docs/26_Version_Unification_Plan.md` Rodada 2). Se essa suite rodar de verdade contra prompts que mudam ao longo do tempo, o valor é real e mensurável (taxa de aprovação cai → sabe que o prompt regrediu).
- **Padrão Policy Agent (Zero Hard-Code)** — ver §3 abaixo. Esse é o pedaço com valor mais genuíno e mais portável de todo o framework, independente de virar LangGraph ou não.

### 2.2 Onde o valor é duvidoso

- **Usar o loop completo pra qualquer tarefa, incluindo trocas triviais.** O próprio Task Type Router (`00_Orchestrator_Protocol.md` §4) existe pra evitar isso — mas se a intenção é rodar tudo dentro de LangGraph, alguém decide isso ANTES de entrar no grafo, o que significa manter lógica de classificação fora do grafo também.
- **A auditoria independente com o mesmo provedor de modelo.** O Model Asymmetry Protocol admite isso abertamente (§13, "residual biases persist... using a fundamentally different model eliminates shared blind spots"). Se a implementação real usar Claude pra tudo (Worker e Auditor) por custo/simplicidade, a "auditoria independente" perde justamente a propriedade que a torna valiosa — vira um segundo prompt do mesmo modelo, com viés compartilhado. **Valor real aqui exige realmente pagar por 2+ provedores diferentes**, não é opcional.
- **Nenhuma medição hoje prova que o loop reduz defeito.** Não existe (ainda) um baseline comparando "código gerado com TRM loop completo" vs. "código gerado sem". Sem isso, o valor do processo é *assumido*, não *demonstrado*. Antes de generalizar o uso, valeria rodar os 20 Golden Cases (`docs/22`) nos dois modos e comparar taxa de aprovação/retrabalho.

### 2.3 Veredito da pergunta 2

Sim, tem valor real — mas só nos casos de geração repetitiva/alto-risco, rodando headless, com providers de verdade diferentes pro Worker e pro Auditor, e com a suite de evals realmente ligada e monitorada ao longo do tempo. Fora disso (uso interativo geral, mesmo provedor pros dois papéis, evals nunca rodados de verdade), é cerimônia cara sem uma forma de provar que compensa.

---

## 3. É genérico ou nichado em Next.js/Supabase?

**Está escrito como se fosse nichado — mas a arquitetura de fato já separa as duas coisas, só não formaliza isso.** Esse é o achado principal desta seção.

### 3.1 O que está hard-coded em Next.js + Supabase (não portaria sem reescrever)

| Peça | Onde vive | Por que é específico da stack |
|:---|:---|:---|
| Sacred Contract (`"use server"`, `ActionResponse<T>`) | `02_Worker_TRM_Agent.md` §3 | Server Actions é conceito do Next.js App Router — não existe em Django, Rails, Express |
| Anti-Legacy Filter (proibir Pages Router, `/api/`) | `000_Kernel_System_Override.md` §3 | Vocabulário 100% Next.js |
| RLS como mecanismo de isolamento | `05_Security_Governance_Policy.md` §2, Kill Switch K6 | RLS é feature do Postgres/Supabase especificamente |
| `@supabase/ssr`, proibição de Prisma ORM | Kill Switch K2, várias specs | Amarrado ao Supabase como backend |
| MCP Component Registry (Tremor, shadcn, Magic UI) | `03_MCP_Component_Registry.md` | React/Next.js especificamente |
| Schema (`users`, `project_configurations`, `policy_agents`...) | `schemas/02_Initial_Schema_V4.sql` | Modelo de dados do produto Prisma em si, não genérico |

### 3.2 O que já é genérico, independente de stack (a IP real e portável)

| Peça | Onde vive | Por que é portável |
|:---|:---|:---|
| Formato do loop TRM (gerar → auditar isolado → refinar → Fresh Eyes) | `00_Orchestrator_Protocol.md` §8 | Padrão de orquestração de agentes puro — funcionaria idêntico gerando Go, Rails ou Rust |
| Anti-Collapse / Context Break | `00_Orchestrator_Protocol.md` §6 | Princípio de isolamento de contexto, sem nenhuma referência a stack |
| Conceito de Kill Switch (não os switches específicos) | `03_Auditor_Agent.md` §3.2 | O *mecanismo* (regra determinística que reprova instantaneamente) é genérico; só o conteúdo de K1-K6 é Next.js |
| Dynamic Rubric | `01_Architect_Agent.md` §3.4 | Gerar critérios de aceite por tarefa não depende de linguagem |
| Golden Sample / Evals pipeline | `docs/22_Evals_Pipeline_Spec.md` | Padrão de ML-ops, universal |
| **Policy Agent / Zero Hard-Code** | `00_Prisma_Concepts_DeepDive.md` §2, `06_Policy_Agent.md` | **O mais portável de todos** — "delegar regra de negócio pra um agente que lê um documento" não tem nenhuma dependência de stack. Funcionaria idêntico num backend Rails consultando o mesmo Client RAG. |
| Prisma Message Protocol (envelope tipado entre papéis) | `17_Prisma_Message_Protocol.md` | Formato de mensagem entre agentes, agnóstico de linguagem de destino |
| Resilience Protocol (retry, circuit breaker) | `19_Resilience_Protocol.md` | Infra genérica de chamada a LLM, nada específico do produto gerado |

### 3.3 A fronteira já existe — só não está formalizada

Repare que a coluna "genérico" acima é essencialmente **tudo que vive em `agentes/00_Orchestrator_Protocol.md`, `03_Auditor_Agent.md` (mecanismo), `17_Prisma_Message_Protocol.md`, `19_Resilience_Protocol.md`, `22_Evals_Pipeline_Spec.md`** — o *kernel de orquestração*. E a coluna "nichada" é essencialmente **o que vive em `02_Worker_TRM_Agent.md` §3, `03_MCP_Component_Registry.md`, `05_Security_Governance_Policy.md`, o schema** — o *pacote de skills Next.js+Supabase*.

Isso é literalmente a mesma divisão que a pasta `docs/skills/` já modela (consolidada nesta sessão — ver `docs/26_Version_Unification_Plan.md` T3.3): um conjunto de arquivos de "como fazer X nesta stack" que o Worker lê sob demanda, separado do kernel que não muda.

### 3.4 Veredito da pergunta 3

Não precisaria de uma reescrita pra virar genérico — precisaria de uma **formalização de fronteira** que já existe em estado latente:

1. O *kernel* (Orchestrator, Auditor mechanism, PMP, Resilience, Evals) fica como está — zero menção a Next.js/Supabase, então zero trabalho de portabilidade aqui.
2. O que hoje está espalhado dentro de `02_Worker_TRM_Agent.md`, `05_Security_Governance_Policy.md` e do schema como se fosse universal vira um **skill pack nomeado** (`skills/nextjs_supabase/`), com seus próprios Kill Switches, Sacred Contract e schema.
3. Portar pra outra stack = escrever um novo skill pack (`skills/rails_postgres/`, `skills/django_postgres/`) — o Worker, o Auditor, o loop, os evals não mudam uma linha.

Sem esse passo, hoje, a resposta honesta é: **nichado em Next.js+Supabase por acidente de organização, não por limitação arquitetural.** A IP genuinamente valiosa (loop TRM, Policy Agent, evals) já não depende da stack — só está fisicamente misturada nos mesmos arquivos que a parte que depende.

---

## 4. Recomendação consolidada

Não implementar a spec do LangGraph literalmente como está hoje. Antes:

1. **Separar Kill Switches determinísticos (K1-K4, K6) de julgamento subjetivo (K5)** — vira um lint/AST-check que roda antes do node do Auditor, não dentro dele. (Seção 1.2)
2. **Decidir de verdade o Model Asymmetry** — se a implementação real vai usar 2+ provedores pagos diferentes pro Worker e pro Auditor, ou se vai aceitar que a "auditoria independente" é mais fraca com um provedor só. Não deixar essa decisão implícita. (Seção 2.2)
3. **Rodar os 20 Golden Cases com e sem o loop primeiro**, num ambiente mais barato de iterar (Claude Code, não LangGraph), pra ter *evidência* — não só a expectativa — de que o Auditor isolado reduz defeito antes de construir a infraestrutura Python inteira em cima dessa suposição. (Seção 2.3)
4. **Extrair o skill pack Next.js+Supabase pra sua própria pasta nomeada**, deixando o kernel de orquestração livre de menção a stack — isso é barato de fazer agora e é o que separa "framework nichado" de "framework genérico com um skill pack padrão". (Seção 3.3)

Nessa ordem. Os itens 1 e 4 são reorganização de documento (barato, sem risco). O item 3 é o teste real que decide se vale gastar tempo no item 2 e na implementação Python de fato.

---

## 5. Vale separar a documentação Solo vs. LangGraph — e separar os projetos?

**Separar em pastas dentro do mesmo repositório: sim, vale.** **Separar em projetos/repositórios diferentes: ainda não.**

### 5.1 O problema é real, e é maior do que só o doc 06

A intuição está certa, mas o problema não é só "existe um arquivo sobre LangGraph misturado com o resto" — `06_LangGraph_Orchestrator_Spec.md` já ganhou um banner de "modo não ativo" nesta sessão, o que resolve a superfície. O problema mais fundo é que **a mistura acontece dentro de arquivos individuais, não só entre arquivos**: quase todo agente em `agentes/` tem uma seção "Dual-Mode Behavior" com "5.1 Sequential Hats Mode" + "5.2 Subagent Mode (Antigravity 2.0)" no mesmo arquivo — ou seja, mesmo lendo só `02_Worker_TRM_Agent.md` inteiro, uma fração do que está ali só é relevante se você estiver rodando Antigravity com `invoke_subagent`, nunca em Claude Code. Separar arquivos por pasta reduz *quantos arquivos* precisam ser lidos; não reduz o que sobra misturado *dentro* de cada arquivo que sobrou.

### 5.2 Recomendação: 3 pastas dentro do mesmo repo, não 2 repos

```
docs/
  kernel/        <- agnóstico de modo: 04_Audit_Framework, 17_PMP (formato), 19_Resilience,
                     20_Prompt_Versioning, 22_Evals_Pipeline, 23_12_Factors, MANIFEST
  solo/          <- 27_Tool_Compatibility_Matrix, e um novo doc extraindo só as seções
                     "Sequential Hats" / "claude_code_hybrid" de cada agente
  langgraph/     <- 06_LangGraph_Orchestrator_Spec (já isolado, só falta a pasta física)
  skills/        <- já existe (docs/skills/) — é o pacote Next.js+Supabase da Seção 3
```

Um agente rodando "modo prisma" em Claude Code leria `kernel/` + `solo/` + `skills/` (sob demanda)
e **nunca tocaria em `langgraph/`** — é isso que evita gastar janela de contexto e reduz a chance
de um agente "aprender" um comportamento (ex.: assumir que `invoke_subagent` existe) de um doc que
nunca deveria ter influenciado a sessão.

### 5.3 Por que não separar em projetos/repositórios ainda

- O LangGraph não tem uma linha de implementação real (Seção 1) — criar um repositório novo,
  com seu próprio README, CI, versionamento, é investimento de infraestrutura para um modo cuja
  viabilidade ainda não foi validada (Seção 2.3 já recomendava rodar os Golden Cases antes de
  qualquer coisa). Separar o repo *antes* disso é otimizar prematuramente a organização de algo
  que pode nem valer a pena construir.
- O "kernel" (Audit Framework, Message Protocol, Resilience, Evals) precisa ser **compartilhado**
  pelos dois modos — se virarem dois repositórios, esse kernel precisa ser extraído para um
  terceiro pacote (submódulo git, ou pacote npm/pip publicado) só para os dois conseguirem
  referenciá-lo sem duplicar. Isso é overhead de tooling real, não é só "criar uma pasta nova".
- Pastas dentro do mesmo repo já resolvem o problema concreto que motivou a pergunta (menos
  arquivo para a IA ler, menos risco de contaminação de contexto) sem pagar esse custo.

**Quando reconsiderar projetos separados:** se o teste da Seção 2.3 (Golden Cases com/sem loop)
mostrar valor real no modo LangGraph E a decisão for realmente implementá-lo em Python como
serviço headless de produção — nesse ponto, sim, faz sentido um repositório próprio (é código
Python de produção, com seu próprio ciclo de deploy, não documentação). Até lá, é prematuro.

---

## 6. Renomear a "fábrica V3.1" (`compilation_target`) — vale a pena?

**Sim, e é uma correção que eu recomendaria mesmo sem a pergunta ter sido feita** — foi a fonte de mais confusão real que encontrei durante toda a auditoria (`docs/26_Version_Unification_Plan.md`, seção "Descoberta crítica"). O nome atual não é arbitrário — `V3.1` e `V4` são nomeados por herança histórica real (o produto Prisma literalmente teve uma geração V3 SaaS-generator e uma geração V4 que introduziu governança via Policy Agent, `01_Whitepaper_Architecture.md` §1) — mas herdar o nome do produto histórico para um **enum técnico que convive no mesmo repositório com um número de versão de Kernel que também sobe** é a receita exata da ambiguidade que já causou retrabalho nesta sessão.

### 6.1 Nome proposto

| Valor atual | Problema | Proposta |
|:---|:---|:---|
| `"V3.1"` | Parece uma versão de kernel desatualizada | `"DIRECT"` — código direto, sem camada de agente |
| `"V4"` | Idem, e é o mais confuso porque coincide com a era do Kernel V4.x | `"GOVERNED"` — lógica de negócio governada por Policy Agent |
| `"HYBRID"` | Já é descritivo, não parece versão | Mantém `"HYBRID"` |

Nomes autodescritivos, sem formato de versão, não precisam de nota de desambiguação para serem lidos corretamente — o problema desaparece por construção em vez de precisar de documentação extra pra explicar.

### 6.2 Por que isso é uma migração maior do que a unificação de versão que já fiz

Vale ser honesto sobre o tamanho do trabalho antes de recomendar fazer: `V4`/`V3.1` como `compilation_target` aparece em **muito mais lugares e formatos** do que `V4.5` aparecia como versão de Kernel:

- Union types TypeScript: `compilation_target: "V3.1" | "V4" | "HYBRID"` — repetido em pelo menos 6 specs de agente, no PMP, no KPIs doc
- Default de coluna SQL: `target_architecture text default 'V3.1'` em `schemas/02_Initial_Schema_V4.sql`
- Título inteiro de dois documentos: `11_Golden_Sample_FitPro.md` ("Golden Sample: V4 Architecture...") e `12_Golden_Sample_Ecommerce.md` — nesses dois, **"V4" é o assunto do documento**, não um detalhe incidental
- Linguagem natural espalhada: "V4 Audit", "V4 Approach", "Zero Hard-Code (V4 only)", "(if V4 target)" no Kill Switch K5

Isso não é motivo para não fazer — é motivo para tratar como um projeto à parte do porte da unificação de versão (provavelmente maior), não como um ajuste de uma tarde. Recomendo: mesmo padrão usado em `docs/26` (grep completo, classificar cada ocorrência, migrar com script + revisão manual nos títulos/schema), mas como sua própria entrada de plano, não misturado em outra tarefa.

---

## 7. O padrão "agente decide via arquivo" (Policy Agent, exemplo da academia) — vale a pena?

Esse é o [FitPro Manager](../docs/11_Golden_Sample_FitPro.md) — o personal trainer edita um `.txt`/PDF com a metodologia de progressão de carga, e o Policy Agent lê esse documento pra decidir se aumenta o peso do aluno, em vez de um `if (feedback === 'Easy') { peso += 2 }` fixo no código. Já elogiei esse padrão na Seção 3.2 como "a IP mais portável do framework" — aqui vai a visão mais cética sobre quando ele realmente compensa.

### 7.1 Onde compensa de verdade

Compensa quando a regra é **volátil E qualitativa/contextual** — o exemplo da academia é bom justamente porque a regra real ("aumentar 5% se relatou fácil por 2 sessões consecutivas E não relatou dor articular") é um julgamento composto sobre texto, não um número isolado. Um `if` não expressa isso com elegância; um documento em linguagem natural, sim. E o ganho de negócio é real: o personal trainer muda a metodologia sem precisar de um desenvolvedor.

### 7.2 Onde NÃO compensa — o gap que a árvore de decisão atual não cobre

O `05_Backend_Agent.md` §3.3 ("Rule Detector") manda delegar pro Policy Agent **qualquer** valor numérico de negócio:

> "Contains business numeric values? (limits, rates, percentages, deadlines) → YES → DELEGATE to Policy Agent"

Isso trata "aprovar pedido acima de $1000 precisa de aprovação" (um número simples, estático na prática, raramente muda) exatamente igual a "decidir se aumenta a carga do aluno" (julgamento textual composto). São coisas muito diferentes:

| | Limite numérico simples (ex: $1000) | Regra textual composta (ex: progressão de carga) |
|:---|:---|:---|
| Muda com que frequência? | Raramente | Pode mudar por aluno/contexto |
| Precisa de julgamento? | Não — é uma comparação | Sim — múltiplas condições em linguagem natural |
| Custo de decidir via Policy Agent | Embedding + busca vetorial + chamada LLM + parse de JSON, ~500ms-2s, custo real por chamada | Mesmo custo, mas aqui se justifica |
| Alternativa mais barata | Uma tabela `business_config` (`key`, `value`), sem LLM nenhum | Não existe alternativa mais barata que preserve a nuance |

**O framework hoje não tem esse meio-termo.** A árvore de decisão é binária: hard-code (não editável sem deploy) ou Policy Agent completo (editável, mas caro e com risco de variância em toda consulta, mesmo quando a "regra" é só um número). Isso empurra até os casos mais simples pro caminho mais caro, e o Semantic Cache (`docs/21_RAG_Pipeline_Spec.md` §3, `src/lib/cache/semantic-cache.ts` — este já tem implementação real, não só spec) ajuda a reduzir custo repetido mas não resolve a latência da primeira consulta nem a variância.

**Recomendação:** adicionar um terceiro nível ao Rule Detector — uma tabela de config simples (chave/valor, editável via dashboard, sem LLM) para limiares e valores estáticos, reservando o Policy Agent/RAG só para regras genuinamente textuais/contextuais como o exemplo da academia. O padrão em si vale a pena — a heurística de *quando* usá-lo é que está incompleta.

---

## 8. Maiores gaps da metodologia (além dos já levantados na auditoria e nas seções acima)

Estes não são bugs de consistência de arquivo (isso já foi coberto no DEEP_READ) — são lacunas na **lógica do método em si**, mesmo assumindo que todo arquivo estivesse perfeito.

### 8.1 Não existe malha de retroalimentação da produção de volta pro método

Todo o sistema de qualidade (Audit Framework, Kill Switches, score ≥ 9.5) mede se o código **parece certo pros próprios critérios do Auditor**. Nada no framework conecta um bug real, encontrado em produção por um usuário de verdade, de volta para "qual prompt/versão gerou essa linha, e isso deveria mudar como o Worker ou o Auditor se comportam da próxima vez". `usage_metrics` e `audit_logs` medem o comportamento do agente (tokens, latência, score); nenhuma tabela ou protocolo conecta um incidente de produção a uma revisão de prompt. Um Server Action pode passar com 9.7 e ainda ter um bug de lógica de negócio que o checklist não foi desenhado pra pegar — e o sistema nunca fica sabendo.

### 8.2 Limiares numéricos apresentados com precisão que não foi demonstrada

`score ≥ 9.5`, delta de estagnação `< 0.3`, circuit breaker em `5` falhas consecutivas, regressão em `> 5%` de queda no eval — nenhum desses números tem, em nenhum documento, uma origem explicada (por que 9.5 e não 9.0? por que 0.3?). Não é necessariamente errado, mas é apresentado com uma confiança que a ausência de dados não sustenta. Vale documentar como cada limiar foi escolhido (ou marcar explicitamente como "palpite inicial, recalibrar após N execuções reais").

### 8.3 "Single-Artifact Cadence" não tem protocolo para mudanças que cruzam vários arquivos

A regra "um arquivo por Sprint" (repetida como regra absoluta em vários agentes) funciona bem para scaffolding aditivo. Não existe protocolo descrito para uma mudança que precisa ser atômica entre arquivos — por exemplo, renomear um campo usado no schema Zod, no Server Action e no componente ao mesmo tempo. Isso viraria N sprints sequenciais, cada um auditado isoladamente — e a lista de acesso do próprio Auditor (`03_Auditor_Agent.md` §2, "carrega só o(s) arquivo(s)-alvo") significa que ele estruturalmente não consegue verificar consistência entre arquivos, mesmo que quisesse.

### 8.4 Feedback humano (👍/👎) não tem pipeline descrito

O dashboard (`docs/13_Agent_Dashboard_Wireframe_Spec.md` §3) menciona botões de like/dislike "for RLHF (Refinement)" em cada decisão do Policy Agent. Não existe, em nenhum outro documento, uma descrição de o que acontece depois do clique — não conecta ao Evolutionary Optimizer (`docs/16`), não atualiza Golden Samples, não aparece no schema como uma tabela de feedback. É um elemento de UI sem sistema por trás.

### 8.5 Circuit breaker de custo é por sessão, não por tarefa

O Watcher alerta em `token_budget > 95%` — isso é um limite de **sessão inteira**. Não existe um teto de custo por **tarefa individual**. Uma tarefa presa (o Worker erra o mesmo tipo de coisa repetidamente, mas de um jeito que não dispara a detecção de estagnação por categoria de violação) pode consumir as 3 iterações + Fresh Eyes inteiras, cada uma com custo real de Worker+Auditor, com o único freio sendo um alerta de orçamento em nível de sessão — não um corte automático por tarefa.

---

*Adendo às Seções 5-8 gerado na mesma sessão da análise original — Lead Architect Pedro Lucas Santos de Araújo.*
