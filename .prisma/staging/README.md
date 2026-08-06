# 🚧 Staging & Experimentation Sandbox — Prisma V5.0

**Classification:** SAFE SANDBOX  
**Purpose:** Isolate new scripts, experimental skills, and agent modifications before canonical promotion.

---

## Regras de Operação no Staging
1. **Zero Risco:** Qualquer novo arquivo de habilidade (`SKILL.md`), script de teste ou prompt de subagente deve ser validado nesta pasta de staging antes de ser promovido para `.agents/` ou `agentes/`.
2. **Isolamento de Branch:** Recomenda-se que o subagente `worker_trm` utilize `Workspace: "branch"` ou trabalhe dentro desta pasta durante a fase de prototipagem.
3. **Limpeza:** Arquivos temporários gerados em `staging/tmp/` são ignorados pelo `.gitignore`.
