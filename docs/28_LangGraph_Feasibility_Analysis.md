# Análise de Viabilidade: Prisma em LangGraph — Funcionaria? Teria Valor? É Portável?

**Classification:** DECISION SUPPORT (não é spec normativa — é uma análise crítica para decisão humana)
**Codename:** `LangGraph_Feasibility`
**Version:** V5.0
**Context Layer:** Estratégico (antes de investir em implementação)
**Idioma:** Português (documento de análise/decisão, não system prompt de agente — não segue a regra de "camada interna 100% inglês" de `boot_prisma_agents/SKILL.md`)

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
