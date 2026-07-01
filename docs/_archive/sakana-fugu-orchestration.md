# Sakana Fugu — Lógica de Orquestração Multi-Agente

> Documento de referência técnica, escrito para ser consumido por outra LLM/engenheiro(a) que precise entender **como o Fugu decide, executa e governa** seu pool de agentes — não um resumo de marketing. Baseado no Sakana Fugu Technical Report (arXiv:2606.21228v2, 23 jun 2026) e na página de produto sakana.ai/fugu.

---

## 0. TL;DR (uma frase por conceito)

- **O que é**: uma família de *orquestradores* (Fugu, Fugu-Ultra) — modelos que não respondem a tarefas diretamente, mas decidem **quais LLMs de fronteira invocar, com que instruções, em que topologia e como sintetizar a saída**.
- **Diferencial central**: orquestração é **aprendida**, não codificada à mão (sem if/else de roteamento, sem grafo fixo de agentes). O sistema generaliza a decisão de "quem faz o quê" em tempo de inferência, por query.
- **Dois regimes**: `Fugu` = seleção de 1 worker por turno (latência ~igual a uma chamada direta); `Fugu-Ultra` = composição de workflows multi-agente (~5 passos, múltiplos workers, tool calling distribuído).
- **Não há merge de pesos.** É composição **comportamental/black-box** sobre APIs heterogêneas (Claude, GPT, Gemini) — uma forma de "model merging" no nível de comportamento, não de parâmetros.

---

## 1. Duas arquiteturas, dois problemas de RL diferentes

Fugu não é um sistema único — são duas soluções distintas para dois pontos diferentes da fronteira latência/qualidade.

### 1.1 `Fugu` — seletor rápido (builds on **Trinity**)

**Problema que resolve**: decidir, em tempo de logit (não de geração), qual worker invocar — sem custo de decodificação autoregressiva extra.

**Parametrização** (ponto-chave de engenharia):
- Backbone = LLM pré-treinado congelado (quase todo).
- Acoplado em paralelo ao LM head: uma **lightweight prediction head** que recebe o hidden state `h ∈ ℝ^d` de uma posição fixa (`<Head Input>`, próxima ao penúltimo token de saída) e produz `L` logits — um por worker no pool.
- Adaptação adicional: **singular-value fine-tuning** em matrizes selecionadas do backbone (decompõe a matriz, treina só os *scales* dos valores singulares, mantém componentes ortogonais fixos). Isso dá um espaço de parâmetros treináveis extremamente pequeno.
- **Consequência de design**: o orquestrador nunca decodifica texto para decidir — ele lê apenas o **estado interno (hidden state)**, calcula softmax sobre os `L` workers, e despacha. Isso é o que torna `Fugu` competitivo em latência com uma chamada direta a um modelo único.
- Diferença vs. Trinity: Trinity atribuía também um **papel** (Thinker/Worker/Verifier) ao modelo selecionado; Fugu remove essa dimensão — só seleciona o worker, sempre despachado como "worker" puro. Isso reduz o espaço de coordenação e a latência de decisão.

**Treinamento em 2 estágios**:

1. **SFT em tarefas single-step** (seção 3.1.2):
   - Para cada questão `qᵢ` (com solução verificável `sᵢ`), roda-se **cada** worker `M_j` por `n` repetições, mede-se reward médio `r̄_{i,j}`.
   - Converte-se o vetor de scores por worker em uma **distribuição soft via softmax com temperatura τ**:
     `p_i(j) = exp(r̄_{i,j}/τ) / Σ_j' exp(r̄_{i,j'}/τ)`
   - Loss = KL divergence entre essa distribuição-alvo e a distribuição do orquestrador `π_θ(·|q_i)`.
   - **Por que soft e não hard-label (arg-max)**: preserva a magnitude do reward, não só o ranking. Isso ajuda quando vários workers são quase igualmente competentes — o sinal de treino não colapsa numa escolha binária artificial.

2. **Evolutionary Strategies em tarefas end-to-end** (seção 3.1.3):
   - Motivação: SFT em tarefas estáticas não captura como os workers se comportam dentro de um **harness real** (Claude Code, Codex, OpenCode) — com múltiplos turnos, tool calls, feedback de execução.
   - Formalização: trajetória `τ = (s₀, a₀, s₁, a₁, ..., s_T)`, `s_t` = task + transcript completo até o turno `t`; `a_t ~ π_θ(·|s_t) ∝ exp(f_θ(h(s_t)))`; reward terminal `R(τ) ∈ {0,1}`.
   - Otimização via **sep-CMA-ES** (mesmo método do Trinity): mantém `(θ_t, σ_t, D_t)` (parent, step size, covariância diagonal), amostra `λ` candidatos `θ^(k) = θ_t + σ_t D_t z^(k)`, avalia fitness `J(θ^(k))` por rollouts end-to-end replicados, recombina top-`μ` por média ponderada por fitness.
   - **Por que ES e não RL gradiente-based aqui**: o sinal é terminal, esparso e ruidoso (sucesso binário em tarefa multi-turno longa); não é trivial construir rótulos de ranking confiáveis para trajetórias complexas. ES não precisa de gradiente através da trajetória inteira — só precisa avaliar fitness. Além disso, o SFT prévio já coloca `θ` numa região boa do espaço de busca, então ES refina localmente em vez de buscar a partir do zero.

### 1.2 `Fugu-Ultra` — orquestrador generativo (builds on **Conductor**)

**Problema que resolve**: compor *workflows* arbitrários (não só "qual modelo" mas "que subtarefas, que topologia de comunicação, quem agrega") quando o custo de latência é aceitável em troca de qualidade máxima.

**Mecanismo**: o Conductor é ele mesmo um LLM que, dado `q_i`, gera uma sequência de **workflow steps** em linguagem natural. Cada step contém:
- uma subtask em linguagem natural;
- um `worker_id` (qual agente do pool executa essa subtask);
- uma **access list** — índices de quais outputs de steps anteriores entram no contexto desse worker.

Isso permite expressar, só com esses 3 campos por step, topologias arbitrárias: best-of-N, cadeia sequencial, árvore paralela com agregador no topo, debate multi-rodada, etc. — tudo decidido **por query**, sem template fixo.

**Reward / treinamento** — GRPO (Shao et al., 2024) com duas condições progressivas:
1. **Format condition**: `r_i = 0` se a lista de subtasks/workers/access-lists não for parseável.
2. **Correctness condition**: dado um workflow bem formatado, executa-se de fato (cada worker é prompted com sua subtask + contexto da access list), e `r_i = 1` se a saída final bate com `s_i`, senão `r_i = 0.5`.

Vantagem da segunda condição ser `0.5` em vez de `0`: separa "não seguiu o formato" de "seguiu o formato mas errou" — o segundo caso ainda recebe sinal positivo parcial, o que estabiliza o treino de geração de workflows válidos antes de otimizar correção.

GRPO advantage: `A_i = (r_i - mean({r_1..r_G})) / std({r_1..r_G})` sobre `G` completions agrupadas — **sem penalidade KL** (treino de Fugu-Ultra é sem `β·KL(π_θ‖π_ref)`, diferente da formulação genérica do paper).

**Detalhe importante de generalização do framework**: o Conductor permite que o **próprio orquestrador** seja listado como um worker — ele pode se auto-invocar dentro do workflow, estendendo ainda mais o espaço de topologias possíveis.

**Pool de workers no treino**: Gemini-3.1-Pro, Claude-Opus-4.8, GPT-5.5 — até 5 steps por workflow.

---

## 2. Agent Harness: State, Tool Execution, Feedback Loops, Guardrails

Esta é a parte mais relevante para quem está desenhando um harness próprio. O paper (seção 3.2.2) é explícito sobre o problema que aparece **só** em sistemas multi-agente com function calling, e que não existe em harnesses single-agent (tipo Claude Code puro):

> "For a generic, single-agent system, the function call loop requires no additional persistent memory... since the message transcript carries the full context and there is only one possible recipient."

Em Fugu-Ultra, **qualquer agente pode chamar uma tool em qualquer momento**, então o orquestrador precisa manter um **workflow state** persistente contendo: quais modelos foram selecionados, a topologia de comunicação, e as subtasks atribuídas — para que cada function-call loop seja roteado de volta ao agente correto, e a topologia de comunicação inter-agente seja preservada.

### 2.1 State

- O estado de um workflow não é só "histórico de mensagens" (como em single-agent) — é uma estrutura que amarra **agente ↔ subtask ↔ posição na topologia ↔ access list**.
- Para `Fugu` (seletor simples, sem papéis), o estado por turno `s_t` em treino end-to-end é definido como: task + transcript completo de turnos anteriores + tool calls + feedback de execução. Ou seja, o estado que alimenta a decisão de roteamento é **cumulativo e textual/transcrito**, não um resumo comprimido.
- Para `Fugu-Ultra`, o estado tem uma dimensão extra: **isolamento por agente dentro do workflow** (ver 2.3) + **memória compartilhada entre workflows** (ver 2.4). São dois escopos de estado coexistindo.

### 2.2 Tool Execution

- A execução de tools acontece **dentro** do contexto de cada agente individual, não no nível do orquestrador. O orquestrador decide *quem* recebe a subtask; o worker selecionado é quem efetivamente chama as tools/funções e recebe o function-call loop de volta.
- Isso implica que o orquestrador precisa de um roteamento robusto de *callback*: se o Worker-B emite uma function call, a resposta da tool precisa retornar para o Worker-B (e não para o orquestrador ou para outro worker), preservando seu lugar na topologia.

### 2.3 Isolamento intra-workflow (mecanismo de guardrail #1)

**Problema que esse guardrail resolve — "orchestration collapse"**: se todos os agentes compartilhassem a mesma trajetória de tool-calls/observações dentro de um workflow, o **primeiro agente a agir** ancoraria o caminho de solução para todos os agentes seguintes, que tenderiam a apenas replicar/seguir esse caminho em vez de explorar suas próprias abordagens — destruindo o ganho de ter múltiplos agentes especializados.

**Solução**: cada agente, dentro de um workflow, só observa:
- o transcript de **suas próprias** ações; e
- o que está explicitamente listado na **access list** que o Conductor atribuiu a ele (outputs de steps anteriores específicos).

Ele **não** vê a trajetória de tool-calls de outros agentes do mesmo workflow, a menos que isso esteja na access list. Isso preserva a "liberdade total" de cada agente para encontrar sua própria solução, condicionado apenas ao que o orquestrador decidiu que ele deveria ver.

> Para quem está implementando isso: pense na access list como uma **ACL de contexto por step**, não como um histórico global compartilhado. É o oposto de "todo agente vê tudo".

### 2.4 Memória persistente entre workflows (mecanismo complementar)

**Tensão que resolve**: isolamento total impediria agentes de lembrar interações anteriores com o ambiente — levando a tool-calls redundantes para redescobrir os mesmos artefatos/contexto em conversas multi-turno.

**Solução**: memória **compartilhada entre workflows** (não dentro do mesmo workflow) — agentes podem observar tool-calls de workflows anteriores na mesma conversa multi-turno. Ou seja:

- **Isolamento** = eixo intra-workflow (entre agentes do mesmo passo de orquestração).
- **Memória compartilhada** = eixo inter-workflow (ao longo do tempo, na mesma sessão de usuário).

Isso é desenhado deliberadamente como dois escopos ortogonais: você isola para evitar colapso de exploração, mas mantém continuidade temporal para evitar redundância de trabalho.

### 2.5 Feedback Loops

Aparecem em pelo menos três camadas distintas no sistema:

1. **Feedback de treino (ES, seção 3.1.3)**: reward terminal esparso `R(τ) ∈ {0,1}` sobre trajetórias reais de coding-assistant (Claude Code, Codex, OpenCode), usado para refinar o roteamento via sep-CMA-ES.
2. **Feedback de treino (GRPO, seção 3.2.1)**: reward em duas camadas (formato → correção), usado para moldar a geração de workflows válidos e corretos.
3. **Feedback de execução em tempo real (inferência)**: dentro de um workflow, um agente recebe o output de outro via access list e pode revisar sua posição. Exemplo documentado no paper (seção 4.4, "Build and debug"): GPT constrói um servidor PyPI; Opus é então trazido para auditar riscos concretos na implementação (detecta 3 problemas específicos); essas descobertas são **relayed back to GPT**, que então corrige e conclui o build com sucesso. Esse é um loop de feedback agente-a-agente, mediado pela topologia decidida pelo orquestrador — não um loop fixo de "critique-then-revise" genérico, mas um roteamento de feedback específico para o agente certo.
4. Outro padrão documentado: em SWE-Bench Pro, Opus investiga um bug, chega a um beco sem saída (acha ser bug client-side de concorrência); GPT é chamado para reexaminar do zero, identifica a causa raiz real; a informação é **relayed back to Opus**, que então corrige o curso e aplica o fix correto (`ContextReader` compartilhado). Esse é um exemplo de feedback **bidirecional** entre dois agentes especializados, coordenado pelo orquestrador, não um pipeline unidirecional.

### 2.6 Guardrails (lista consolidada)

| Guardrail | O que evita | Mecanismo |
|---|---|---|
| Isolamento intra-workflow | Orchestration collapse (1º agente ancora todos os outros) | Cada agente só vê seu próprio transcript + access list explícita |
| Access list explícita | Contexto não controlado / leakage de informação entre agentes | Lista de índices de steps anteriores, definida pelo Conductor por step |
| Reward em 2 condições (formato → correção) | Treinar sobre workflows mal-formados / não parseáveis | `r=0` se não parseável; `r∈{0.5,1}` só se bem formatado |
| Function-call routing por estado de workflow | Function call de um agente ser atribuída/respondida pelo agente errado | Workflow state rastreia qual agente emitiu cada call e onde ele está na topologia |
| Pool de workers configurável (produto) | Dependência involuntária de provedor não permitido / compliance | Usuário pode excluir modelos/provedores específicos do pool do `Fugu` (não do `Fugu-Ultra`, cujo pool é fixo) |
| Avaliação com harness mínimo (benchmarks) | Inflar resultados via scaffolding elaborado do avaliador | Usa harnesses minimalistas (Mini-SWE-Agent, Terminus 2) para expor a capacidade real do modelo, não do harness |

> Nota: o relatório não detalha guardrails de segurança content-level (ex.: filtragem de outputs maliciosos) — o foco documentado é **guardrails estruturais de coordenação multi-agente** (evitar colapso de exploração e preservar topologia de comunicação), não moderação de conteúdo.

---

## 3. Por que isso é diferente de "roteamento" comum (RouterDC, Smoothie, mixture-of-agents, etc.)

O paper posiciona Fugu explicitamente contra a literatura prévia de "LLM collective intelligence" (seção 2):

- **Routers de single-step** (ex. Chen et al. 2024 / RouterDC): aprendem a mapear query → 1 melhor agente, decisão única, sem coordenação subsequente. Fugu (`Fugu`, não Ultra) é parecido em espírito mas estende isso a **decisões por turno** em tarefas multi-turno (re-roteia a cada passo, não só na entrada).
- **Topologias aprendidas mas fixas no formato** (Zhuge et al. 2024 — GPTSwarm como grafo treinável; Dang et al. 2025 — orquestração evolutiva): aprendem estrutura, mas tipicamente a estrutura é otimizada *offline* como um grafo reutilizável, não gerada *por query* em linguagem natural a cada chamada.
- **Mixture-of-Agents (Wang et al. 2025)**: usa rodadas fixas de discussão com um **agregador fixo**. Esse é exatamente o ponto que o paper ataca na seção 4.4 ("Debate and aggregation"): um agregador fixo é um *bottleneck* — se a tarefa exige conhecimento de nicho (trivia de jogo), você quer Gemini como agregador; se exige matemática, quer GPT como agregador. Sistemas com agregador fixo não conseguem essa adaptação e ficam limitados ao teto de competência do agregador escolhido a priori, independentemente da tarefa.
- **Model merging em nível de parâmetro** (Akiba et al. 2025 — evolutionary merging; TIES-merging; etc.): exige acesso a pesos/arquitetura, então só funciona em checkpoints open-source compatíveis. Fugu opera **behavioral-level**, tratando cada modelo como caixa-preta via API — funciona com modelos closed-source heterogêneos (arquitetura, provedor, latência, custo diferentes), o que é a contribuição conceitual central do paper: orquestração como um **"macro-level analogue" de model merging**, sem precisar de acesso a parâmetros.

**O diferencial real, resumido em uma frase**: o espaço de decisão (quem, com que prompt, em que topologia, quem agrega) é **gerado dinamicamente em linguagem natural por query**, não escolhido de um conjunto fixo pré-definido de padrões de coordenação — e isso é treinado via RL/ES sobre execução real, não hand-designed.

---

## 4. Comportamento observado em produção (evidência qualitativa, seção 4.4)

Três padrões de coordenação emergentes documentados (não programados explicitamente):

1. **Aggregator dinâmico em árvore** — o nó-raiz/agregador da topologia é escolhido pela especialidade exigida pela tarefa (Gemini para trivia factual de nicho, GPT para matemática), com 2 agentes-folha tentando a tarefa independentemente e o agregador resolvendo divergências entre eles.
2. **Build-then-debug alternado** — GPT como "builder" (forte em coding agentic) seguido por Opus como "debugger" (forte em segurança/debugging), em pontos críticos da trajetória — não round-robin fixo, mas troca **condicionada a momentos críticos** (ex.: depois que o build termina, antes de confiar no resultado).
3. **Especialista trazido pontualmente** — ex.: Opus constrói um ataque de criptoanálise diferencial (FEAL), depois GPT é trazido especificamente como "math specialist" para re-derivar o ataque do zero e achar a constante diferencial exata — combinando expertise de cibersegurança + matemática dentro da mesma tarefa.

Esses três padrões reforçam o argumento central: a topologia + alocação de papéis não é um template fixo, é decidida pelo Conductor por instância de problema, usando os priors de capacidade aprendidos durante o treino RL.

---

## 5. O que NÃO está no paper / limitações a ter em mente

- **Roteamento não é exposto ao usuário** (confirmado na página de produto, FAQ Q9): por design, não é possível ver quais modelos subjacentes foram usados em uma query específica — informação proprietária.
- **Pool de `Fugu-Ultra` é fixo** (FAQ Q3); só o pool de `Fugu` é configurável (pode excluir provedores/modelos por settings).
- O relatório não detalha **custo computacional** do treino (quantidade de runs ES, tamanho de `λ`/`μ`, horas de GPU) nem hiperparâmetros completos de GRPO (ex. valor de `ε` de clipping).
- Benchmarks qualitativos (CAD, xadrez às cegas, trading, leitura de kana) são **exemplos ilustrativos, não win-rates agregados** — o próprio paper avisa isso explicitamente ("These are selected, illustrative games, not an aggregate or a win rate"; "intended to compare sequential, no-look-ahead decision-making rather than to establish generalizable trading performance").
- Mythos Preview / Fable 5 (Anthropic) **não estão no pool de workers** — são usados só como referência de benchmark porque não são publicamente acessíveis.

---

## 6. Glossário rápido de termos usados no paper

| Termo | Significado no contexto Fugu |
|---|---|
| **Worker / Agent** | Um LLM de fronteira (Claude, GPT, Gemini) invocado pelo orquestrador para executar uma subtask |
| **Orchestrator / Conductor** | O modelo Fugu/Fugu-Ultra que decide roteamento e topologia |
| **Workflow step** | Unidade atômica de um plano gerado por Fugu-Ultra: (subtask, worker_id, access_list) |
| **Access list** | Lista de índices de outputs de steps anteriores visíveis a um worker específico |
| **Selection head** | Cabeça leve de classificação sobre hidden states, usada por `Fugu` para escolher worker sem decodificar texto |
| **sep-CMA-ES** | Variante separável de CMA-ES (evolution strategy com covariância diagonal), usada para otimizar `Fugu` em tarefas end-to-end |
| **GRPO** | Group Relative Policy Optimization (Shao et al. 2024) — usado para treinar `Fugu-Ultra` |
| **Orchestration collapse** | Falha em que o primeiro agente a agir ancora a trajetória de todos os outros, eliminando diversidade de exploração |
| **Decision-only parametrization** | Característica de `Fugu`: decide a partir de logits/hidden states, nunca gera texto para decidir |

---

## 7. Fonte

- Sakana AI. *Sakana Fugu Technical Report*. arXiv:2606.21228v2 [cs.LG], 23 jun. 2026.
- Página de produto: https://sakana.ai/fugu/
- Papers-base citados no relatório: Xu et al., *Trinity: An Evolved LLM Coordinator*, arXiv:2512.04695; Nielsen et al., *Learning to Orchestrate Agents in Natural Language with the Conductor*, arXiv:2512.04388.
