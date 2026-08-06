# 🛡️ Snapshot & Backup Archive — Prisma V5.0

**Classification:** SECURITY ARCHIVE  
**Purpose:** Maintain timestamped snapshots and rollbacks of core configurations and project state.

---

## Regras de Operação de Backup
1. **Snapshot Pré-Modificação:** Antes de realizar refatorações em massa ou alterar os contratos canônicos (`schemas/` ou `agentes/`), o Orquestrador deve salvar um snapshot do estado em `.prisma/backups/`.
2. **Reversão Instantânea:** Caso o `Auditor_TRM` aplique um *Kill Switch* ou reprove o código, podemos reverter os arquivos para o último backup válido.
