# ⚡ Antigravity 2.0 & Prisma V5.0 — Workspace Governance

**Classification:** MASTER IDE GOVERNANCE  
**Architecture Target:** V5.0 (Loop Architecture + Fable Patterns)  
**Execution Mode:** SOLO / IDE  

---

## 0. Compatibilidade de Ambiente (leia antes do resto)

Este arquivo foi escrito originalmente para o **Antigravity 2.0**. Se você está rodando como
**Claude Code**, as primitivas `define_subagent`/`invoke_subagent`/`write_to_file`/etc. citadas
abaixo **não existem** neste ambiente — não tente chamá-las literalmente. Resolva cada uma via
`docs/27_Tool_Compatibility_Matrix.md` antes de agir. Regra prática: se uma instrução deste
arquivo nomeia uma ferramenta e essa ferramenta não está na sua lista de ferramentas disponíveis,
consulte a matriz de compatibilidade — não pule a instrução, apenas traduza a ferramenta.

## 1. Princípios de Operação
1. **Auto-Descoberta de Skills:** Todas as habilidades nucleares de desenvolvimento foram migradas e indexadas na pasta `.agents/skills/` (e espelhadas em `docs/skills/`, que é a fonte que `02_Worker_TRM_Agent.md` §2.1 realmente lê — ver `docs/26_Version_Unification_Plan.md` T3.3 para a consolidação pendente). O Orquestrador e os Subagentes devem gatilhar essas regras automaticamente ao trabalhar em componentes React, Server Actions e Políticas RLS.
2. **Subagentes:** Não simule múltiplos papéis (roleplay) livremente sem marcação. Em Antigravity, use `define_subagent`/`invoke_subagent`. Em Claude Code, não há registro persistente — use hat-switching sequencial com Context Break textual para a maioria dos papéis, e a ferramenta `Agent` real para os papéis críticos de isolamento (`Auditor_TRM`, `Security_Agent`, `Watcher_Agent`, `Scout_Agent`, Fresh Eyes). Ver `docs/27_Tool_Compatibility_Matrix.md` §4.
3. **Isolamento de Contexto (Anti-Collapse):** O `Auditor_TRM` NUNCA deve ler o `reasoning_trace` ou as instruções internas do Worker. Seu julgamento baseia-se estritamente no diff (`git diff`) e nas especificações de qualidade (`04_Audit_Framework.md`). Em Claude Code, isso é garantido fisicamente quando o Auditor é despachado via `Agent`-tool spawn (não recebe o histórico da conversa).
4. **Staging e Backups:** Qualquer novo experimento ou modificação estrutural em agentes/skills deve passar primeiro pela pasta `.prisma/staging/`. Antes de grandes refatorações, um snapshot deve ser salvo em `.prisma/backups/`.

---

## 2. Kernel Boot Diagnostic (Protocolo Inicial)
Em cada nova sessão de trabalho pesada, verifique:
- Conectividade dos servidores MCP (`supabase`, `insomnia`, `TestSprite`).
- Integridade de leitura dos arquivos de estado (`.prisma/state.json` e `.prisma/learnings.json`).
- Registro operacional dos subagentes nucleares.

---

## 3. Gatilho Canônico de Execução ("iniciar modo prisma")
**REGRA DE EXECUÇÃO IMEDIATA E OBRIGATÓRIA (ZERO-WAIT BOOT):**
Sempre que o usuário digitar `iniciar modo prisma`, `ativar modo prisma`, `modo prisma` ou similar:

1. **PROIBIDO ADIAR A ATIVAÇÃO:** É ESTRITAMENTE PROIBIDO responder em texto dizendo que "os agentes serão ativados automaticamente mais tarde ao criar arquivos" ou prometer ativação futura. Isso constitui falha grave de execução — em qualquer ambiente.
2. **DETECTE O AMBIENTE PRIMEIRO** (`docs/000_Kernel_System_Override.md` §1 / `agentes/00_Orchestrator_Protocol.md` §3):
   - **Se `invoke_subagent` está disponível (Antigravity 2.0):** chame IMEDIATAMENTE `define_subagent` para registrar os **9 subagentes canônicos** catalogados em `.agents/BOOT_KERNEL.md`.
   - **Se `Agent`/`Task` está disponível e `invoke_subagent` não (Claude Code):** NÃO tente chamar `define_subagent` — essa ferramenta não existe aqui e fingir que a chamou seria uma alucinação. Em vez disso, execute o **Claude Code Boot Adapter** (`docs/27_Tool_Compatibility_Matrix.md` §4): carregue os 9 arquivos de `agentes/` como contexto conhecido, sem registro persistente.
   - **Se nenhuma das duas:** modo `sequential_hats` puro — mesma leitura de contexto, sem nenhum spawn físico disponível.
3. **ATUALIZAÇÃO DE ESTADO:** Grave no arquivo `.prisma/state.json` o `execution_mode` realmente detectado (`"subagents"` | `"claude_code_hybrid"` | `"sequential_hats"` — nunca `"subagents"` por padrão sem checar) e o timestamp da sessão atual.
4. **CONFIRMAÇÃO AO USUÁRIO:** Entregue a resposta ao usuário SOMENTE DEPOIS que a ativação (registro real ou carregamento de contexto, conforme o ambiente) estiver concluída, e descreva com precisão o que de fato aconteceu — "9 subagentes registrados na memória operacional" é uma frase válida apenas em Antigravity; em Claude Code, diga "9 especificações de agente carregadas como contexto; despacho isolado disponível via Agent tool para os papéis críticos."
