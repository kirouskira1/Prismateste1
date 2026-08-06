// ============================================================================
// 📜 sync_obsidian.js — Wiki Script Definitivo (Prisma V5.0)
// ============================================================================
// Lê a base de código, gera Markdown documentado, organiza em gavetas
// semânticas dentro do Vault do Obsidian e converte links internos
// para Wikilinks nativos ([[...]]).
// ============================================================================

const fs = require('fs');
const path = require('path');

// ==========================================
// ⚙️ CONFIGURAÇÕES PRINCIPAIS
// ==========================================

// Diretório raiz do projeto (de onde o script lê)
const SOURCE_DIR = path.resolve(__dirname);

// Diretório raiz do Vault do Obsidian (para onde o script escreve)
const OBSIDIAN_VAULT_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME,
  'Documents',
  'Obsidian Vault',
  'meucofre',
  'Projeto_Prisma' // Pasta-raiz dedicada a este projeto dentro do vault
);

// ==========================================
// 🛡️ FILTRO DE RUÍDO (Noise Filter)
// ==========================================
// Tudo que está aqui é IGNORADO — não vai para o Obsidian.

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.uploads',
  '.vscode',
  'coverage',
  '.prisma',        // Estado interno do runtime (state.json, learnings.json) — não é doc
]);

const IGNORED_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.DS_Store',
  '.gitignore',
  'CLAUDE.md',            // Arquivo stub sem conteúdo útil
  'sync_obsidian.js',     // Este próprio script
  'test_regex.js',        // Script de teste temporário
  '02_Initial_Schema_V4.md', // Duplicata da raiz (canônica está em schemas/)
  '03_OpenAPI_V4.md',     // Duplicata da raiz (canônica está em schemas/)
]);

const IGNORED_EXTENSIONS = new Set([
  '.log', '.exe', '.dll', '.so', '.dylib',
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
  '.mp4', '.webm', '.mov',
  '.zip', '.tar', '.gz',
  '.pdf',                 // PDFs não são notas navegáveis no grafo
]);

// ==========================================
// 📂 MAPEAMENTO SEMÂNTICO (Gavetas do Vault)
// ==========================================
// Cada gaveta é uma subpasta dentro de Projeto_Prisma/
// A ordem das regras importa: a PRIMEIRA correspondência vence.

const SEMANTIC_RULES = [
  // ── 01. Agentes (prompts, personas, protocolos de orquestração) ──
  {
    drawer: '01_Agentes',
    test: (relPath) => {
      const p = relPath.replace(/\\/g, '/').toLowerCase();
      return p.startsWith('agentes/') || p.startsWith('.agents/');
    },
  },
  // ── 02. Banco de Dados & Schemas (SQL, migrations, OpenAPI) ──
  {
    drawer: '02_Database_e_Schemas',
    test: (relPath) => {
      const p = relPath.replace(/\\/g, '/').toLowerCase();
      return (
        p.startsWith('schemas/') ||
        p.endsWith('.sql') ||
        p.endsWith('.yaml') ||
        p.endsWith('.yml')
      );
    },
  },
  // ── 03. Documentação & Arquitetura (docs/, whitepapers, specs) ──
  {
    drawer: '03_Documentacao_Arquitetura',
    test: (relPath) => {
      const p = relPath.replace(/\\/g, '/').toLowerCase();
      return p.startsWith('docs/');
    },
  },
  // ── 04. Skills do IDE (receitas de codegen) ──
  {
    drawer: '04_Skills_Codegen',
    test: (relPath) => {
      const p = relPath.replace(/\\/g, '/').toLowerCase();
      return p.includes('/skills/');
    },
  },
  // ── 05. Componentes UI (React, pages, layouts) ──
  {
    drawer: '05_UI_Components',
    test: (relPath) => {
      const p = relPath.replace(/\\/g, '/').toLowerCase();
      return (
        p.includes('/components/') ||
        p.includes('/ui/') ||
        p.includes('/pages/') ||
        p.includes('/app/')
      );
    },
  },
  // ── 06. Lógica de Negócio (lib, utils, services, hooks) ──
  {
    drawer: '06_Core_Logic',
    test: (relPath) => {
      const p = relPath.replace(/\\/g, '/').toLowerCase();
      return (
        p.includes('/lib/') ||
        p.includes('/utils/') ||
        p.includes('/services/') ||
        p.includes('/hooks/')
      );
    },
  },
  // ── 07. API & Server Actions ──
  {
    drawer: '07_API_ServerActions',
    test: (relPath) => {
      const p = relPath.replace(/\\/g, '/').toLowerCase();
      return p.includes('/api/') || p.includes('/actions/');
    },
  },
  // ── 08. Configuração do Projeto (arquivos-raiz de config) ──
  {
    drawer: '08_Configuracao',
    test: (relPath) => {
      const p = relPath.replace(/\\/g, '/').toLowerCase();
      const name = path.basename(p);
      return (
        name.endsWith('.config.json') ||
        name.endsWith('.config.md') ||
        name === 'agents.md' ||
        name === 'package.json' ||
        name === 'tsconfig.json' ||
        name === 'next.config.js' ||
        name === 'next.config.mjs' ||
        name === 'next.config.ts'
      );
    },
  },
];

// Fallback: qualquer arquivo que não bata em nenhuma regra
const DEFAULT_DRAWER = '09_Outros';

function getSemanticDrawer(relPath) {
  for (const rule of SEMANTIC_RULES) {
    if (rule.test(relPath)) return rule.drawer;
  }
  return DEFAULT_DRAWER;
}

// ==========================================
// 🏷️ TAGS SEMÂNTICAS (Para Color Groups no Grafo)
// ==========================================
// Cada arquivo recebe uma tag baseada no seu papel no sistema.
// O Obsidian usa essas tags para colorir nós no Graph View.

function getSemanticTag(relPath, fileName) {
  const p = relPath.replace(/\\/g, '/').toLowerCase();
  const name = fileName.toLowerCase();

  // Agentes Core (TRM Loop)
  if (name.includes('orchestrator') || name.includes('architect') ||
      name.includes('worker_trm') || name.includes('auditor')) {
    return 'prisma/agent-core';
  }
  // Factory 1 — Design & UI
  if (name.includes('design_agent')) return 'prisma/agent-factory1';
  // Factory 2 — Engineering & Data
  if (name.includes('backend_agent') || name.includes('policy_agent')) {
    return 'prisma/agent-factory2';
  }
  // Cross-cut agents
  if (name.includes('security_agent') || name.includes('watcher_agent') ||
      name.includes('scout_agent')) {
    return 'prisma/agent-crosscut';
  }
  // Sprint Zero & Protocols
  if (name.includes('sprint_zero') || name.includes('boot_kernel') ||
      name.includes('execution_playbook') || name.includes('kernel_system')) {
    return 'prisma/protocol';
  }
  // Skills
  if (p.includes('/skills/') || name === 'skill.md') return 'prisma/skill';
  // Database & Schemas
  if (p.startsWith('schemas/') || name.endsWith('.sql') ||
      name.endsWith('.yaml') || name.endsWith('.yml')) {
    return 'prisma/schema';
  }
  // Docs de Arquitetura
  if (p.startsWith('docs/')) return 'prisma/doc';
  // Config
  if (name.endsWith('.config.json') || name.endsWith('.config.md') ||
      name === 'agents.md' || name === 'package.json') {
    return 'prisma/config';
  }
  return 'prisma/other';
}

// ==========================================
// 🔧 UTILITÁRIOS
// ==========================================

/** Cria toda a árvore de diretórios recursivamente */
function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/** Percorre a árvore de arquivos de forma recursiva, respeitando os filtros */
function walkSync(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue; // Pula arquivos inacessíveis (symlinks quebrados, etc.)
    }

    if (stat.isDirectory()) {
      if (!IGNORED_DIRS.has(entry)) {
        walkSync(fullPath, fileList);
      }
    } else {
      const ext = path.extname(entry).toLowerCase();
      if (
        !IGNORED_FILES.has(entry) &&
        !IGNORED_EXTENSIONS.has(ext) &&
        !entry.startsWith('.env') // Nunca enviar secrets
      ) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

/** Detecta a linguagem para o codeblock com base na extensão */
function extToLang(ext) {
  const map = {
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.json': 'json',
    '.sql': 'sql',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.sh': 'bash',
    '.ps1': 'powershell',
    '.css': 'css',
    '.html': 'html',
    '.py': 'python',
  };
  return map[ext.toLowerCase()] || 'text';
}

// ==========================================
// 🚀 PIPELINE PRINCIPAL
// ==========================================

console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║   📜 Prisma Wiki Sync → Obsidian                   ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');

// ── Passo 1: Coletar arquivos ──
console.log('🔍 [1/4] Escaneando projeto e filtrando ruído...');
const allFiles = walkSync(SOURCE_DIR);
console.log(`   ✅ ${allFiles.length} arquivos válidos encontrados.`);

// ── Passo 2: Limpar pasta anterior no vault (para evitar fantasmas) ──
console.log('🧹 [2/4] Limpando documentação anterior no Vault...');
if (fs.existsSync(OBSIDIAN_VAULT_DIR)) {
  fs.rmSync(OBSIDIAN_VAULT_DIR, { recursive: true, force: true });
}
ensureDirSync(OBSIDIAN_VAULT_DIR);
console.log(`   ✅ Pasta limpa: ${OBSIDIAN_VAULT_DIR}`);

// Registro global: mapeia nome original → nome wiki (para wikilinks)
const fileRegistry = new Map(); // chave: basename original, valor: nome sem .md
const generatedPaths = [];      // caminhos absolutos dos .md gerados
const drawerCounts = {};        // contagem por gaveta (para relatório)

// ── Passo 3: Gerar documentação Markdown ──
console.log('📝 [3/4] Gerando arquivos Markdown documentados...');

// Rastrear colisões de nomes para desambiguar (ex: 4 arquivos SKILL.md)
const nameCollisionMap = new Map(); // chave: mdFileName, valor: count
for (const filePath of allFiles) {
  const fn = path.basename(filePath);
  const ext = path.extname(fn).toLowerCase();
  const mdFn = ext === '.md' ? fn : `${fn}.md`;
  nameCollisionMap.set(mdFn, (nameCollisionMap.get(mdFn) || 0) + 1);
}

for (const filePath of allFiles) {
  const relativePath = path.relative(SOURCE_DIR, filePath);
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  const drawer = getSemanticDrawer(relativePath);

  // Contagem por gaveta
  drawerCounts[drawer] = (drawerCounts[drawer] || 0) + 1;

  // Nome do arquivo destino no Obsidian
  // Se já for .md, mantém. Caso contrário, adiciona extensão .md.
  let mdFileName = ext === '.md' ? fileName : `${fileName}.md`;

  // Desambiguação: Se há colisão de nomes (ex: 4x SKILL.md de skills/),
  // usa o nome da pasta pai como prefixo para tornar único.
  if (nameCollisionMap.get(mdFileName) > 1) {
    const parentDir = path.basename(path.dirname(filePath));
    const baseName = mdFileName.replace(/\.md$/i, '');
    mdFileName = `${baseName}_${parentDir}.md`;
  }

  // Caminho destino completo
  const destPath = path.join(OBSIDIAN_VAULT_DIR, drawer, mdFileName);

  // Ler conteúdo original
  let rawContent;
  try {
    rawContent = fs.readFileSync(filePath, 'utf8');
  } catch {
    console.warn(`   ⚠️  Não foi possível ler: ${relativePath} (pulando)`);
    continue;
  }

  // Determinar a tag semântica para color groups no grafo
  const semanticTag = getSemanticTag(relativePath, fileName);

  // Montar conteúdo final
  let finalContent;

  if (ext === '.md') {
    // Markdown puro: preserva conteúdo e adiciona frontmatter com tag
    if (rawContent.startsWith('---')) {
      // Já tem frontmatter — injeta tag após o primeiro '---'
      finalContent = rawContent.replace(
        /^---\n/,
        `---\ntags:\n  - ${semanticTag}\n`
      );
    } else {
      finalContent =
        `---\n` +
        `source: "${relativePath.replace(/\\/g, '/')}"\n` +
        `category: "${drawer}"\n` +
        `tags:\n` +
        `  - ${semanticTag}\n` +
        `synced_at: "${new Date().toISOString()}"\n` +
        `---\n\n` +
        rawContent;
    }
  } else {
    // Código-fonte: envolve em codeblock com metadados e tag
    const lang = extToLang(ext);
    finalContent =
      `---\n` +
      `source: "${relativePath.replace(/\\/g, '/')}"\n` +
      `category: "${drawer}"\n` +
      `language: "${lang}"\n` +
      `tags:\n` +
      `  - ${semanticTag}\n` +
      `synced_at: "${new Date().toISOString()}"\n` +
      `---\n\n` +
      `# 📄 \`${fileName}\`\n\n` +
      `> **Caminho original:** \`${relativePath.replace(/\\/g, '/')}\`\n\n` +
      `\`\`\`${lang}\n` +
      rawContent +
      (rawContent.endsWith('\n') ? '' : '\n') +
      `\`\`\`\n`;
  }

  // Registrar no mapa para links
  const wikiName = mdFileName.replace(/\.md$/i, '');
  fileRegistry.set(fileName, wikiName);

  // Escrever no disco
  ensureDirSync(path.dirname(destPath));
  fs.writeFileSync(destPath, finalContent, 'utf8');
  generatedPaths.push(destPath);
}

console.log(`   ✅ ${generatedPaths.length} arquivos .md gerados.`);

// ── Passo 4: Converter links internos → Wikilinks do Obsidian ──
console.log('🔗 [4/4] Convertendo links internos para Wikilinks [[...]]...');
let linksConverted = 0;

for (const mdPath of generatedPaths) {
  let content = fs.readFileSync(mdPath, 'utf8');
  let changed = false;

  // Passo 4.5: Converter referências backtick para arquivos do Prisma em wikilinks
  const backtickRefRegex = /`(\d{2,3}_[A-Za-z0-9_\-\.]+\.(md|sql|yaml|yml|json))`|`([A-Za-z0-9_\-\.]+\.(md|sql|yaml|yml|json))`/g;
  content = content.replace(backtickRefRegex, (match, p1, p2, p3, p4) => {
    const filename = p1 || p3;
    if (fileRegistry.has(filename)) {
      const wikiTarget = fileRegistry.get(filename);
      changed = true;
      linksConverted++;
      return `[[${wikiTarget}|${filename}]]`;
    }
    return match;
  });

  // Regex para links Markdown tradicionais: [texto](caminho)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  content = content.replace(markdownLinkRegex, (match, text, linkTarget) => {
    // Ignora links web (http/https)
    if (linkTarget.startsWith('http://') || linkTarget.startsWith('https://')) {
      return match;
    }
    // Ignora âncoras puras (#...)
    if (linkTarget.startsWith('#')) {
      return match;
    }

    const linkedBasename = path.basename(linkTarget);

    // Verifica se o arquivo linkado existe no nosso registro
    if (fileRegistry.has(linkedBasename)) {
      const wikiTarget = fileRegistry.get(linkedBasename);
      changed = true;
      linksConverted++;
      return `[[${wikiTarget}|${text}]]`;
    }

    // Tenta sem extensão (ex: link para "arquivo" mas o registro tem "arquivo.md")
    const withMd = linkedBasename.endsWith('.md') ? linkedBasename : linkedBasename + '.md';
    const nameNoExt = withMd.replace(/\.md$/i, '');
    for (const [origName, wikiName] of fileRegistry.entries()) {
      if (wikiName === nameNoExt || origName === linkedBasename) {
        changed = true;
        linksConverted++;
        return `[[${wikiName}|${text}]]`;
      }
    }

    return match; // Não encontrou correspondência, mantém original
  });

  if (changed) {
    fs.writeFileSync(mdPath, content, 'utf8');
  }
}

console.log(`   ✅ ${linksConverted} links convertidos para formato Wikilink.`);

// ── Passo 5: Gerar Índice Mestre (MOC — Map of Content) ──
console.log('');
console.log('📋 Gerando Índice Mestre (MOC)...');

let mocContent =
  `---\n` +
  `title: "Prisma V5.0 — Map of Content"\n` +
  `tags:\n` +
  `  - prisma/protocol\n` +
  `synced_at: "${new Date().toISOString()}"\n` +
  `---\n\n` +
  `# Prisma V5.0 — Map of Content\n\n` +
  `> Indice gerado automaticamente pelo Wiki Script.\n` +
  `> Ultima sincronizacao: **${new Date().toLocaleString('pt-BR')}**\n\n` +
  `---\n\n`;

// Agrupa os caminhos gerados por gaveta
const byDrawer = {};
for (const p of generatedPaths) {
  const rel = path.relative(OBSIDIAN_VAULT_DIR, p);
  const parts = rel.split(path.sep);
  const drawer = parts[0];
  if (!byDrawer[drawer]) byDrawer[drawer] = [];
  byDrawer[drawer].push(parts.slice(1).join('/'));
}

const drawerEmojis = {
  '01_Agentes': '🤖',
  '02_Database_e_Schemas': '🗄️',
  '03_Documentacao_Arquitetura': '📚',
  '04_Skills_Codegen': '⚡',
  '05_UI_Components': '🎨',
  '06_Core_Logic': '⚙️',
  '07_API_ServerActions': '🌐',
  '08_Configuracao': '🔧',
  '09_Outros': '📦',
};

for (const drawer of Object.keys(byDrawer).sort()) {
  const emoji = drawerEmojis[drawer] || '📁';
  const files = byDrawer[drawer].sort();
  mocContent += `## ${emoji} ${drawer.replace(/_/g, ' ')}\n\n`;
  for (const f of files) {
    const name = f.replace(/\.md$/i, '');
    mocContent += `- [[${name}]]\n`;
  }
  mocContent += '\n';
}

const mocPath = path.join(OBSIDIAN_VAULT_DIR, '00_MOC_Prisma.md');
fs.writeFileSync(mocPath, mocContent, 'utf8');
console.log(`   ✅ MOC salvo em: ${mocPath}`);

// ── Passo 6: Gerar Notas-Hub de Cluster (Centros de Gravidade) ──
console.log('');
console.log('🧠 Gerando Notas-Hub para clusters visuais...');

const clusterHubs = [
  {
    fileName: 'HUB_Core_TRM_Loop.md',
    content: `---
tags:
  - prisma/agent-core
---

# Core TRM Loop

> O **coração** do sistema Prisma. Este cluster contém os 4 agentes nucleares que formam o loop de geração-e-auditoria.

## Agentes do Loop
- [[01_Architect_Agent]] — 🏛️ Pensa e planeja
- [[02_Worker_TRM_Agent]] — 🔨 Constrói
- [[03_Auditor_Agent]] — 🔍 Inspeciona
- [[00_Orchestrator_Protocol]] — 🎯 Orquestra

## Docs Fundamentais
- [[000_Kernel_System_Override]] — Lei suprema
- [[00_Execution_Playbook]] — Ordem das fases
- [[04_Audit_Framework]] — Critérios de qualidade
- [[00_Sprint_Zero_Protocol]] — Inicialização de projeto

## Fluxo
\`\`\`
Architect → Worker → [código] → Auditor → [veredicto]
    ↑                                         │
    └─── Remediation Loop (se rejeitado) ─────┘
\`\`\`
`,
  },
  {
    fileName: 'HUB_Factory_1_Design_UI.md',
    content: `---
tags:
  - prisma/agent-factory1
---

# Factory 1 — Design and UI

> A fábrica visual. Transforma protótipos HTML em componentes React premium.

## Agente
- [[04_Design_Agent]] — 🎨 Tradutor visual de alta fidelidade

## Fontes de Verdade
- [[03_MCP_Component_Registry]] — Catálogo de componentes premium
- [[08_Stitch_Prompting_Protocol]] — Como interpretar protótipos Stitch
- [[13_Agent_Dashboard_Wireframe_Spec]] — Wireframe do painel de agentes
- [[11_Golden_Sample_FitPro]] — Exemplo de interface final
- [[09_External_Knowledge_References]] — Referências de design

## Isolamento
> ⚠️ **Factory 1 nunca acessa:** Schema SQL, Backend Actions, código de servidor.
> A separação de contexto é proposital.
`,
  },
  {
    fileName: 'HUB_Factory_2_Engineering_Data.md',
    content: `---
tags:
  - prisma/agent-factory2
---

# Factory 2 — Engineering and Data

> A fábrica de dados e lógica. Constrói a fundação invisível que sustenta tudo.

## Agentes
- [[05_Backend_Agent]] — 🔧 Engenheiro de dados e Server Actions
- [[06_Policy_Agent]] — 📜 Juiz de regras de negócio (V4)
- [[07_Security_Agent]] — 🛡️ Sentinela e interceptor

## Fontes de Verdade
- [[02_Initial_Schema_V4]] — Esquema SQL (source of truth)
- [[03_OpenAPI_V4]] — Contrato de API
- [[05_Security_Governance_Policy]] — 5 Regras de Ouro
- [[07_Prompt_Engineering_Library]] — Templates de prompt
- [[10_Implementation_Plan]] — Prompts de raciocínio

## Monitoramento
- [[08_Watcher_Agent]] — 👁️ Vigilante autônomo
- [[14_Factory_KPIs]] — Métricas de eficiência
- [[17_Prisma_Message_Protocol]] — Protocolo de mensagens

## Isolamento
> ⚠️ **Factory 2 nunca acessa:** MCP Registry, Stitch HTML, arquivos de design.
`,
  },
];

for (const hub of clusterHubs) {
  const hubPath = path.join(OBSIDIAN_VAULT_DIR, '01_Agentes', hub.fileName);
  fs.writeFileSync(hubPath, hub.content, 'utf8');
}
console.log(`   ✅ ${clusterHubs.length} notas-hub geradas.`);

// ── Passo 7: Gerar CSS Snippet para visual Neural/Neon ──
console.log('🎨 Gerando CSS Snippet para visual neural...');

const VAULT_ROOT = path.join(
  process.env.USERPROFILE || process.env.HOME,
  'Documents',
  'Obsidian Vault'
);
const snippetsDir = path.join(VAULT_ROOT, '.obsidian', 'snippets');
ensureDirSync(snippetsDir);

const cssSnippet = `/* ============================================
 * Prisma Neural Graph — Premium CSS Snippet
 * ============================================
 * Ativa em: Settings > Appearance > CSS Snippets
 * ============================================ */

/* ── Animacao: Pulso neural nos nos ── */
@keyframes neuralPulse {
  0%, 100% { filter: drop-shadow(0 0 4px rgba(99, 102, 241, 0.5)) drop-shadow(0 0 8px rgba(99, 102, 241, 0.2)); }
  50% { filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.8)) drop-shadow(0 0 16px rgba(99, 102, 241, 0.4)); }
}

@keyframes synapseFire {
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.5; }
}

/* ── Graph View: Fundo profundo com gradiente ── */
.graph-view.mod-root .graph-view-container {
  background: radial-gradient(ellipse at center, #0f172a 0%, #020617 70%, #000000 100%) !important;
}

/* ── Nos: Glow neon com pulso animado ── */
.graph-view.color-fill circle,
.graph-view.color-fill-unresolved circle {
  animation: neuralPulse 4s ease-in-out infinite;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.graph-view.color-fill circle:hover,
.graph-view.color-fill-unresolved circle:hover {
  animation: none;
  filter: drop-shadow(0 0 12px rgba(99, 102, 241, 1))
          drop-shadow(0 0 24px rgba(99, 102, 241, 0.6))
          drop-shadow(0 0 48px rgba(99, 102, 241, 0.3)) !important;
  transform: scale(1.3);
}

/* ── Linhas de conexao: Sinapse neural ── */
.graph-view.color-line line {
  opacity: 0.3;
  stroke-width: 1px;
  animation: synapseFire 6s ease-in-out infinite;
}

.graph-view.color-line line:hover {
  opacity: 1;
  stroke-width: 2px;
  animation: none;
  filter: drop-shadow(0 0 3px currentColor);
}

/* ── Setas: Direcionais luminosas ── */
.graph-view marker path {
  fill: rgba(129, 140, 248, 0.7) !important;
}

/* ── Labels: Tipografia clean com halo ── */
.graph-view .graph-view-container text {
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif !important;
  font-size: 11px !important;
  font-weight: 600;
  letter-spacing: 0.02em;
  fill: rgba(226, 232, 240, 0.9) !important;
  text-shadow: 0 0 12px rgba(0, 0, 0, 0.9), 0 0 4px rgba(0, 0, 0, 0.7);
}

/* ── Foco no no ativo: Destaque extra ── */
.graph-view .is-focused circle {
  animation: none;
  filter: drop-shadow(0 0 16px rgba(250, 204, 21, 0.9))
          drop-shadow(0 0 32px rgba(250, 204, 21, 0.4)) !important;
}
`;

fs.writeFileSync(path.join(snippetsDir, 'prisma-neural.css'), cssSnippet, 'utf8');
console.log(`   ✅ CSS Snippet salvo em: ${snippetsDir}/prisma-neural.css`);

// ── Passo 8: Gerar Graph.json otimizado com Color Groups ──
console.log('⚙️  Configurando Graph View com Color Groups...');

const graphConfig = {
  "collapse-filter": false,
  "search": "",
  "showTags": true,
  "showAttachments": false,
  "hideUnresolved": true,
  "showOrphans": false,
  "collapse-color-groups": false,
  "colorGroups": [
    { "query": "tag:#prisma/agent-core",      "color": { "a": 1, "rgb": 3381759 }  },
    { "query": "tag:#prisma/agent-factory1",   "color": { "a": 1, "rgb": 5046016 }  },
    { "query": "tag:#prisma/agent-factory2",   "color": { "a": 1, "rgb": 16744448 } },
    { "query": "tag:#prisma/agent-crosscut",   "color": { "a": 1, "rgb": 16729156 } },
    { "query": "tag:#prisma/protocol",         "color": { "a": 1, "rgb": 10092543 } },
    { "query": "tag:#prisma/doc",              "color": { "a": 1, "rgb": 6737151 }  },
    { "query": "tag:#prisma/schema",           "color": { "a": 1, "rgb": 65408 }    },
    { "query": "tag:#prisma/skill",            "color": { "a": 1, "rgb": 16776960 } },
    { "query": "tag:#prisma/config",           "color": { "a": 1, "rgb": 8421504 }  }
  ],
  "collapse-display": false,
  "showArrow": true,
  "textFadeMultiplier": 0,
  "nodeSizeMultiplier": 1.4,
  "lineSizeMultiplier": 0.8,
  "collapse-forces": false,
  "centerStrength": 0.3,
  "repelStrength": 12,
  "linkStrength": 1,
  "linkDistance": 120,
  "scale": 0.6,
  "close": false
};

const graphJsonPath = path.join(VAULT_ROOT, '.obsidian', 'graph.json');
fs.writeFileSync(graphJsonPath, JSON.stringify(graphConfig, null, 2), 'utf8');
console.log(`   ✅ Graph.json otimizado salvo.`);

// Ativar o CSS snippet automaticamente se possível
const appearancePath = path.join(VAULT_ROOT, '.obsidian', 'appearance.json');
let appearanceConfig = {};
try {
  appearanceConfig = JSON.parse(fs.readFileSync(appearancePath, 'utf8'));
} catch { /* arquivo vazio ou inexistente */ }
if (!appearanceConfig.enabledCssSnippets) {
  appearanceConfig.enabledCssSnippets = [];
}
if (!appearanceConfig.enabledCssSnippets.includes('prisma-neural')) {
  appearanceConfig.enabledCssSnippets.push('prisma-neural');
}
// Forçar tema escuro para máximo impacto
appearanceConfig.theme = 'obsidian';
fs.writeFileSync(appearancePath, JSON.stringify(appearanceConfig, null, 2), 'utf8');
console.log(`   ✅ CSS Snippet ativado automaticamente no appearance.json`);

// ── Relatório Final ──
console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║   ✅ SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!           ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');
console.log('📊 Relatório por gaveta:');
for (const [drawer, count] of Object.entries(drawerCounts).sort()) {
  const emoji = drawerEmojis[drawer] || '📁';
  console.log(`   ${emoji} ${drawer}: ${count} arquivo(s)`);
}
console.log('');
console.log(`📁 Destino: ${OBSIDIAN_VAULT_DIR}`);
console.log(`📄 Total de arquivos: ${generatedPaths.length}`);
console.log(`🔗 Links convertidos: ${linksConverted}`);
console.log(`🗺️  MOC gerado: 00_MOC_Prisma.md`);
console.log(`🧠 Notas-Hub: ${clusterHubs.length}`);
console.log(`🎨 CSS Snippet: prisma-neural.css`);
console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║   🧠 VISUAL NEURAL ATIVADO!                        ║');
console.log('║                                                      ║');
console.log('║   → Feche e reabra o Obsidian para aplicar          ║');
console.log('║   → O CSS snippet já foi ativado automaticamente    ║');
console.log('║   → Os Color Groups já estão configurados           ║');
console.log('║   → Vá em Graph View e veja a mágica!               ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');
