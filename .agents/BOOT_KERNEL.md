# 🚀 Antigravity 2.0 — Kernel Boot Manifesto (Prisma V4.5 Fleet)

**Classification:** IDE BOOT MANIFESTO  
**Purpose:** Ensure all 9 specialized subagents are native-indexed and ready at session start without starting from zero.

---

## 🤖 Catálogo Canônico de Subagentes Nativos

| # | Codename / Nome | Fábrica | Tipo / Modo | Ferramentas Ativas |
|:---:|:---|:---:|:---:|:---|
| 01 | `architect_trm` | Root / Cross-cut | Read / Write | Leitura, escrita, criação de subagentes, pesquisa |
| 02 | `worker_trm` | Factory 1 & 2 | Read / Write | Leitura, escrita, edição, terminal, pré-leitura de skills |
| 03 | `auditor_trm` | Cross-cut | **READ_ONLY** | Leitura, verificação de diff, aplicação de Kill Switches |
| 04 | `design_agent` | Factory 1 (UI) | Read / Write | Next.js Server Components, Tailwind, shadcn/ui, Tremor |
| 05 | `backend_agent` | Factory 2 (Server) | Read / Write / **MCP** | Server Actions, Supabase, RLS, validação Zod |
| 06 | `policy_agent` | Business Rules | Read / Write | Zero Hard-Code, RAG, consulta de regras dinâmicas |
| 07 | `security_agent` | Governance | **READ_ONLY / MCP** | Fiscalização de 5 Regras de Ouro, auditoria de RLS no Supabase |
| 08 | `watcher_agent` | Monitoring | **READ_ONLY** | Detecção de loops no TRM, anti-alucinação de features |
| 09 | `scout_agent` | Intelligence | **READ_ONLY / MCP** | Pesquisa web, validação de APIs via Insomnia / TestSprite |

---

## ⚙️ Protocolo de Reinicialização Rápida (Zero-to-One Boot)
**GATILHO DE ATIVAÇÃO IMEDIATA (ZERO-WAIT EXECUTION):**
Sempre que uma nova sessão do Antigravity 2.0 for iniciada e o usuário digitar `iniciar modo prisma`, `ativar modo prisma` ou similar:
1. **É PROIBIDO APENAS RESPONDER EM TEXTO:** Não prometa que os agentes serão ativados no futuro ou ao criar arquivos. Isso é falha de execução.
2. **EXECUTE `define_subagent` IMEDIATAMENTE:** O Orquestrador DEVE chamar a ferramenta `define_subagent` para registrar cada um dos 9 agentes da tabela acima ANTES de concluir a resposta ao usuário.
3. **ATUALIZE O ESTADO:** O auto-diagnóstico checa a disponibilidade das ferramentas MCP (`supabase`, `insomnia`, `TestSprite`) e grava `"execution_mode": "subagents"` no arquivo `.prisma/state.json`.
4. **CONFIRME A ATIVAÇÃO REAL:** Apresente o relatório ao usuário confirmando que os 9 subagentes foram efetivamente registrados na memória operacional do IDE.
