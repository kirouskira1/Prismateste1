---
name: boot_prisma_agents
description: Molde padrão automático e canônico para inicialização (boot) dos 9 subagentes operacionais do Prisma V5.0 em inglês nativo (Zero-Loss Injection). Gatilhar sempre que o usuário acionar comandos como "iniciar modo prisma" ou "ativar modo prisma".
---

# 🚀 Prisma V5.0 — Molde Padrão Automático de Boot Native-English

**Classificação:** Skill Canônica de Kernel / Loader de Subagentes  
**Objetivo:** Garantir que todos os 9 subagentes do ecossistema Prisma V5.0 sejam injetados no IDE na íntegra (*Pixel-by-Pixel*), preservando 100% dos marcadores XML, contratos TypeScript e regras de segurança no idioma nativo (Inglês), enquanto mantém a interface com o usuário em Português do Brasil.

---

## 1. Protocolo de Injeção Zero-Loss (Cópia Pixel a Pixel)

Sempre que o comando de inicialização for acionado, o Orquestrador DEVE registrar os 9 subagentes chamando a ferramenta `define_subagent` — **isto só se aplica em Antigravity 2.0**. Se `define_subagent` não estiver disponível na lista de ferramentas (ex.: Claude Code), esta skill não se aplica literalmente: siga em vez disso `docs/27_Tool_Compatibility_Matrix.md` §4 (Claude Code Boot Adapter), que substitui o registro persistente por carregamento de contexto + spawn seletivo via `Agent`.

> [!CAUTION]
> **PROIBIDO RESUMIR OU TRADUZIR OS PROMPTS DE SISTEMA!**  
> Para evitar o desperdício de tokens e prevenir alucinações (*Orchestration Collapse*), o texto passado no campo `system_prompt` de `define_subagent` (Antigravity) — ou no prompt passado a uma chamada da ferramenta `Agent` (Claude Code) — DEVE SER EXACTAMENTE O CONTEÚDO INTEGRAL EM INGLÊS dos respectivos arquivos na pasta `agentes/`.

---

## 2. Tabela Canônica de Mapeamento dos 9 Subagentes

Ao executar o boot, os subagentes devem ser registrados com as seguintes especificações obrigatórias:

| Codename Native | Registry Codename (`agent_registry.json`) | Arquivo Específico (`agentes/`) | Permissão de Ferramentas | Escopo / Regras Nucleares |
|:---|:---|:---|:---|:---|
| `architect_trm_en` | `ARCHITECT_TRM` | `01_Architect_Agent.md` | `enable_write_tools: true`, `enable_mcp_tools: true` | TRM Loop, Triage, 4 Gateways, Rubric Generation |
| `worker_trm_en` | `TRM_WORKER` | `02_Worker_TRM_Agent.md` | `enable_write_tools: true`, `enable_mcp_tools: true` | Sacred Contract (`"use server"`), Zod, Anti-Legacy |
| `auditor_trm_en` | `AUDITOR_TRM` | `03_Auditor_Agent.md` | `enable_write_tools: false`, **READ-ONLY** | Zero Empathy, Kill Switches K1-K6, Anti-Collapse |
| `design_agent_en` | `DESIGN_AGENT` | `04_Design_Agent.md` | `enable_write_tools: true`, `enable_mcp_tools: true` | Tokens *Blue Midnight*, MCP Registry, RSC Islands |
| `backend_agent_en` | `BACKEND_AGENT` | `05_Backend_Agent.md` | `enable_write_tools: true`, `enable_mcp_tools: true` | ActionResponse<T>, Zod validation, Supabase SSR RLS |
| `policy_agent_en` | `POLICY_AGENT` | `06_Policy_Agent.md` | `enable_write_tools: false`, **READ-ONLY** | Zero Hard-Code, RAG heuristic lookups |
| `security_agent_en`| `SECURITY_AGENT` | `07_Security_Agent.md` | `enable_write_tools: false`, **READ-ONLY** | 5 Golden Laws, Prompt Injection XML defense |
| `watcher_agent_en` | `WATCHER_AGENT` | `08_Watcher_Agent.md` | `enable_write_tools: false`, **READ-ONLY** (SQL SELECT-only queries permitted — never file writes) | Convergence monitor, 3-Loop Ceiling, Token Alert |
| `scout_agent_en`   | `SCOUT_AGENT` | `09_Scout_Agent.md`   | `enable_write_tools: false`, **READ-ONLY** | Next.js 15+ breaking changes, Web Docs Recon |

> **Nota:** o sufixo `_en` marca a variante "native English" do prompt injetado (ver §3) — não é
> um nome alternativo arbitrário. Use a coluna "Registry Codename" para cruzar com
> `.prisma/agent_registry.json`, que é a fonte machine-readable de `tools`/`tool_mode`/`never_sees`.
> O Watcher foi corrigido nesta revisão: `run_command`/`Bash` continua disponível para ele, mas
> escopado a leitura (`SELECT`), nunca escrita — por isso `enable_write_tools: false`, alinhado
> com `tool_mode: "READ_ONLY"` no registry (antes desta correção, esta linha dizia
> `enable_write_tools: true`, contradizendo o resto do documento).

---

## 3. Sandboxing Cognitivo e Governança de Idioma

```
┌────────────────────────────────────────────────────────┐
│             DUAL-LAYER LANGUAGE GOVERNANCE             │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ CAMADA INTERNA (Subagentes, Traces & Prompts)    │  │
│  │ 100% INGLÊS NATIVO                               │  │
│  │ • Economiza 20-30% de tokens BPE                 │  │
│  │ • Garante adesão estrita aos contratos e XML     │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                            │
│                           ▼                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ CAMADA EXTERNA (Interface do Chat com Usuário)   │  │
│  │ 100% PORTUGUÊS DO BRASIL                         │  │
│  │ • Respostas, relatórios e resumos de entrega     │  │
│  │ • Cumprimento da regra global <user_global>       │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 4. Checklist de Execução do Boot Automático

Quando esta skill for acionada, execute sequencialmente:
1. Detectar o ambiente (`docs/000_Kernel_System_Override.md` §1). Se `define_subagent` existir: chamar para cada um dos 9 agentes com seus textos ingleses completos. Se não existir (Claude Code): aplicar o Claude Code Boot Adapter (`docs/27_Tool_Compatibility_Matrix.md` §4) no lugar deste passo.
2. Atualizar o arquivo `.prisma/state.json` sinalizando o `execution_mode` realmente detectado (`"subagents"` | `"claude_code_hybrid"` | `"sequential_hats"`) e `"language_mode": "native_english"`.
3. Responder ao usuário em Português do Brasil confirmando, com precisão para o ambiente detectado, que o esquadrão está pronto para receber ordens do Playbook.
