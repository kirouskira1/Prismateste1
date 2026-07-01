# ⚡ Antigravity 2.0 & Prisma V4.5 — Workspace Governance

**Classification:** MASTER IDE GOVERNANCE  
**Architecture Target:** V4.5 (Loop Architecture + Fable Patterns)  
**Execution Mode:** SOLO / IDE  

---

## 1. Princípios de Operação no Antigravity 2.0
1. **Auto-Descoberta de Skills:** Todas as habilidades nucleares de desenvolvimento foram migradas e indexadas na pasta `.agents/skills/`. O Orquestrador e os Subagentes devem gatilhar essas regras automaticamente ao trabalhar em componentes React, Server Actions e Políticas RLS.
2. **Subagentes Nativos:** Não simule múltiplos papéis (roleplay) no mesmo prompt. Sempre utilize a primitiva `define_subagent` ou `invoke_subagent` para separar o Arquiteto, o Desenvolvedor (Worker) e o Auditor (com permissão READ_ONLY).
3. **Isolamento de Contexto (Anti-Collapse):** O `Auditor_TRM` NUNCA deve ler o `reasoning_trace` ou as instruções internas do Worker. Seu julgamento baseia-se estritamente no diff (`git diff`) e nas especificações de qualidade (`04_Audit_Framework.md`).
4. **Staging e Backups:** Qualquer novo experimento ou modificação estrutural em agentes/skills deve passar primeiro pela pasta `.prisma/staging/`. Antes de grandes refatorações, um snapshot deve ser salvo em `.prisma/backups/`.

---

## 2. Kernel Boot Diagnostic (Protocolo Inicial)
Em cada nova sessão de trabalho pesada, verifique:
- Conectividade dos servidores MCP (`supabase`, `insomnia`, `TestSprite`).
- Integridade de leitura dos arquivos de estado (`.prisma/state.json` e `.prisma/learnings.json`).
- Registro operacional dos subagentes nucleares.
