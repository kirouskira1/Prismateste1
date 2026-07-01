# Design-First PRD Protocol (Vision-to-PRD)

**Classification:** System Protocol  
**Codename:** `Design_First_PRD`  
**Effort Level:** `xhigh`  
**Version:** V4.5 (Loop Architecture + Fable Patterns)  

---

## 1. O Problema (Por que não codificar direto?)

Historicamente, modelos multimodais que recebem uma imagem de referência ou HTML (via Stitch) e são instruídos a "codificar isso" sofrem de **Alucinação Visual** e **Hiper-Engenharia**. Eles tentam adivinhar fluxos que não estão na tela, inventam estados ocultos e escrevem milhares de linhas de código que o usuário não pediu.

O **Design-First PRD Protocol** resolve isso forçando o modelo a escrever um contrato visual restritivo ANTES de gerar qualquer código.

---

## 2. O Fluxo "Vision-to-PRD"

Quando o sistema recebe uma tarefa que envolve geração de interface a partir de uma referência visual (imagem, mockup, wireframe ou HTML do Stitch), o fluxo obrigatório é:

1. **Recepção e Análise (Não Codificar):** Receber a referência. **É estritamente proibido iniciar a geração de código React/TSX nesta fase.**
2. **Geração do PRD Visual Restritivo:** O agente deve redigir um documento (PRD - Product Requirements Document) detalhando exatamente o que ele vê e como isso se traduz na arquitetura Prisma.
3. **Mapeamento Negativo (Anti-Alucinação):** O agente deve listar explicitamente o que **NÃO ESTÁ** na imagem e declarar que não irá construir essas partes.
4. **Codificação:** Apenas após a geração desse documento mental (ou físico, se subagente), o código pode ser gerado, seguindo ESTRITAMENTE as restrições do PRD.

---

## 3. Template do PRD Visual (Obrigatório)

Ao criar o PRD Visual, a seguinte estrutura deve ser preenchida:

### 3.1 Identificação Visual e Estrutura
- **Layout Grid:** (Ex: "Sidebar à esquerda (250px fixo), Topbar (60px), Content Area em Flexbox grid de 3 colunas").
- **Paleta Detectada:** (Cruzar as cores da referência com a paleta canônica `Blue Midnight`. Ex: "A imagem usa fundo escuro. Mapeado para `bg-slate-950`").
- **Hierarquia Tipográfica:** (Títulos principais, rótulos, dados textuais).

### 3.2 Mapeamento de Componentes (MCP Registry)
Para cada seção da tela, declare qual componente MCP será usado.
- *Header/Hero:* Magic UI (Shiny Button, Text Reveal)
- *Gráficos/Métricas:* Tremor UI (Card, Metric, AreaChart)
- *Formulários/Listas:* shadcn/ui (Table, Input, Button)

### 3.3 Interações Identificadas
Apenas interações **visualmente óbvias** na referência (ex: um botão de toggle ativo, um menu expansível).

### 3.4 Restrições Negativas (O Mais Importante)
Liste 3 a 5 coisas que não estão na imagem e que você **NÃO VAI** implementar.
- *Exemplo 1:* "A imagem mostra apenas a tela de listagem. Eu NÃO vou implementar o modal de edição ou a tela de detalhes."
- *Exemplo 2:* "Não há indicação de paginação. Eu NÃO vou implementar lógica de cursor ou páginas."
- *Exemplo 3:* "Não há botão de exportação. Eu NÃO vou criar uma action de download CSV."

---

## 4. Integração com o Workflow (Orchestrator)

O Orchestrator reconhecerá o tipo de tarefa `DESIGN_FIRST` (Message Type no PMP).
Para essas tarefas, o esforço exigido é **`xhigh`** porque o agente precisa raciocinar profundamente sobre restrições antes de agir.

A validação de que o código final implementou **APENAS** o que o PRD Visual permitiu será a responsabilidade primária do Auditor (Domain: Frontend/Design e Anti-Hallucination Checklist).
