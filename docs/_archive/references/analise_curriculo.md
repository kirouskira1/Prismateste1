# Análise do Currículo — Sugestões Baseadas no Prisma V4.2

## Diagnóstico Geral

O currículo já é **muito bom** para um estudante de 5º período. Projetos em produção, deploy em AWS, PWA com offline-first — isso é raro. O problema não é o que falta, é o que **está sub-descrito**. O Prisma v4.2 demonstra competências de nível pleno/sênior que estão sendo mencionadas em **uma linha genérica** no currículo.

> [!IMPORTANT]
> A filosofia aqui é: **não inventar nada**. Apenas descrever com precisão técnica o que as pastas `docs/` e `agentes/` já provam que você sabe fazer.

---

## 1. Seção "Prisma AI" — A Maior Oportunidade Perdida

### Como está hoje:
```
Prisma AI | Projeto Pessoal — Em Desenvolvimento
Plataforma de orquestração de Inteligência Artificial com integração de 
múltiplos modelos de LLM e otimização de prompts.
Tecnologias: Python, PostgreSQL (Supabase).
```

### O que o Prisma v4.2 realmente demonstra (pelas pastas `docs/` e `agentes/`):

A documentação do Prisma contém:
- Um **protocolo de orquestração multi-agente** com 659 linhas ([00_Orchestrator_Protocol.md](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/agentes/00_Orchestrator_Protocol.md))
- Um **Message Protocol** com contratos TypeScript tipados ([17_Prisma_Message_Protocol.md](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/docs/17_Prisma_Message_Protocol.md))
- Uma especificação de grafo com **LangGraph** ([06_LangGraph_Orchestrator_Spec.md](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/docs/06_LangGraph_Orchestrator_Spec.md))
- Um **Audit Framework** com scoring formula e kill switches ([04_Audit_Framework.md](file:///c:/Users/pedro/Desktop/3.1%20prisma/Nova%20pasta/prismaingles/docs/04_Audit_Framework.md))
- 7 especificações de agentes especializados (Architect, Worker, Auditor, Design, Backend, Policy, Security)
- Protocolos anti-colapso, isolamento de contexto e "Fresh Eyes" para resolução de deadlocks

### ✅ Sugestão de reescrita:

```
Prisma AI — Plataforma de Engenharia de Software Autônoma | Projeto Pessoal — Em Desenvolvimento

Arquitetura multi-agente com 7 agentes especializados (Architect, Worker, 
Auditor, Design, Backend, Policy, Security) orquestrados via LangGraph (Python).

• Projetei protocolo de comunicação inter-agente com contratos TypeScript 
  tipados (PrismaMessage), validação de payloads e rastreabilidade de auditoria.
• Implementei ciclo de raciocínio recursivo (TRM Loop) com auditoria automatizada 
  por scoring formula ponderada e mecanismo de resolução de deadlocks (Fresh Eyes Protocol).
• Isolamento cognitivo entre agentes via Access Lists e Context Break Protocol 
  para prevenir "Orchestration Collapse" — viés de ancoragem entre agentes.

Tecnologias: Python, LangGraph, PostgreSQL (Supabase), pgvector, TypeScript, 
Docker, RAG (Gemma 2b embeddings locais).
```

> [!TIP]
> Essa descrição não inventa nada. Cada bullet point é verificável diretamente nos arquivos das pastas `docs/` e `agentes/`.

---

## 2. Seção "Habilidades Técnicas" — Ajuste Fino no Bloco de IA

### Como está hoje:
```
Inteligência Artificial: Integração com LLMs (OpenAI, Gemini), Agent Harness, 
MCP, Engenharia de Prompt, RAG.
```

### ✅ Sugestão de reescrita:

```
Inteligência Artificial e Sistemas Multi-Agente: Arquitetura multi-agente 
(LangGraph), Model Context Protocol (MCP), RAG com embeddings locais 
(pgvector), Engenharia de Prompt, Integração com LLMs (OpenAI, Gemini), 
protocolos de auditoria e isolamento cognitivo de agentes.
```

**Por que essa mudança importa:**
- "Agent Harness" é um termo acadêmico que um recrutador de estágio não vai reconhecer
- "Arquitetura multi-agente (LangGraph)" é concreto e pesquisável
- "protocolos de auditoria e isolamento cognitivo" mostra que você não apenas *usa* IA — você projeta *sistemas* de IA

---

## 3. Seção "Resumo Profissional" — Adição de Uma Frase

### Como está hoje (final):
```
...Busco estágio ou posição júnior em back-end, com interesse particular 
em arquitetura de software e integração de IA (LLMs, agentes).
```

### ✅ Sugestão de reescrita do trecho final:

```
...Busco estágio ou posição júnior em back-end, com interesse particular 
em arquitetura de software e sistemas multi-agente de IA (orquestração 
LangGraph, protocolos inter-agente e qualidade automatizada).
```

**Por que:** Trocar "integração de IA (LLMs, agentes)" por algo mais preciso faz o recrutador pensar *"esse candidato não é genérico"*. Mostra que você sabe o que está fazendo, não apenas que "usa IA".

---

## 4. O Que NÃO Mexer

> [!NOTE]
> O resto do currículo está bem calibrado. Os projetos JJCAC, Delivery OS e a Residência Deloitte são sólidos e bem descritos. Não precisa mexer neles.

Especificamente:
- ❌ **Não adicione mais projetos** — 5 é o máximo ideal para estágio
- ❌ **Não aumente o currículo** — 2 páginas é o limite, e você já está nele
- ❌ **Não cite o paper de Externalization** — isso é para documentação técnica, não currículo
- ❌ **Não use jargão excessivo** — "Cognitive Externalization" assusta; "isolamento cognitivo" é compreensível

---

## Resumo das Alterações

| Seção | Mudança | Impacto |
|:---|:---|:---|
| **Prisma AI** | Reescrita completa: de 2 linhas genéricas para 3 bullets técnicos + stack detalhado | 🔴 Alto |
| **Habilidades — IA** | Reformulação: termos pesquisáveis e concretos | 🟡 Médio |
| **Resumo Profissional** | Uma frase mais precisa no final | 🟢 Baixo |
| **Resto** | Sem alteração | — |

> [!IMPORTANT]
> A mudança mais impactante é a seção do Prisma AI. Hoje ela é a seção mais fraca do currículo, mas deveria ser a **mais forte** — porque é o projeto que demonstra a maior profundidade técnica e autonomia. Um recrutador que lê a versão atual pensa "mais um chatbot". Um recrutador que lê a versão sugerida pensa "esse cara projeta sistemas de IA".
