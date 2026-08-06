/**
 * Version Consistency Check (Prisma V5.0)
 * Fails the build if any doc/config makes an ACTIVE claim of running an
 * older Kernel version (V4.1-V4.5) instead of the canonical version in /VERSION.
 *
 * Two things this script deliberately does NOT flag (see docs/26_Version_Unification_Plan.md):
 *   1. `compilation_target` values ("V3.1" | "V4" | "HYBRID") - a fixed architecture-profile
 *      enum defined in docs/15_Architectural_Decision_Framework.md, unrelated to Kernel version.
 *   2. Lines explicitly marked as historical ("legacy", "Historical", "histórico",
 *      "backward compat*", "Nota histórica") - intentional changelog/lineage notes.
 */

import * as fs from 'fs';
import * as path from 'path';

const ALLOWLISTED_PATHS = [
  'docs/_archive',
  'docs/26_Version_Unification_Plan.md',
  'docs/20_Prompt_Versioning_Protocol.md',
  'schemas/02_Initial_Schema_V4.sql',
  '02_Initial_Schema_V4.md',
  'package-lock.json',
];

/**
 * Known JSON files whose bare `"version"` field is a Kernel-version drift risk —
 * text patterns can't see these (no "V" prefix, e.g. .prisma/learnings.json used to
 * say "4.2"), so they're checked structurally by JSON path instead of regex.
 * Add an entry here whenever a new state file grows its own bare version field.
 */
const KNOWN_VERSION_FIELDS: Array<{ file: string; jsonPath: string[] }> = [
  { file: '.prisma/agent_registry.json', jsonPath: ['version'] },
  { file: '.prisma/learnings.json', jsonPath: ['evolutionary_memory', 'version'] },
];

const ALLOWLIST_LINE_MARKERS = [
  'legacy',
  'Legacy',
  'Historical',
  'historic',
  'histórico',
  'histórica',
  'backward compat',
  'Nota histórica',
  '(V4 Hybrid Architecture)',
  'compilation_target',
];

const SCAN_EXTENSIONS = new Set(['.md', '.json', '.js', '.ts', '.yaml', '.yml']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist']);

const ACTIVE_VERSION_PATTERNS: RegExp[] = [
  /Prisma\s+(AI\s+)?V4\.[1-5]\b/,
  /PRISMA\s+V4\.[1-5]\b/,
  /Technical Specification V4\.[1-5]\b/,
  /Master Agent V4\.[1-5]\b/,
  /\*\*Version:\*\*\s*V4\.[1-5]\b/,
];

interface Violation {
  file: string;
  line: number;
  text: string;
}

class VersionConsistencyChecker {
  private root: string;
  private canonicalVersion: string;
  private violations: Violation[] = [];

  constructor(root: string = process.cwd()) {
    this.root = root;
    this.canonicalVersion = this.readCanonicalVersion();
  }

  private readCanonicalVersion(): string {
    const versionFile = path.join(this.root, 'VERSION');
    if (!fs.existsSync(versionFile)) {
      throw new Error('VERSION file not found at repo root — cannot determine canonical version.');
    }
    return fs.readFileSync(versionFile, 'utf-8').trim();
  }

  private isAllowlisted(relPath: string): boolean {
    const normalized = relPath.replace(/\\/g, '/');
    return ALLOWLISTED_PATHS.some((allowed) => normalized === allowed || normalized.startsWith(`${allowed}/`));
  }

  private hasAllowlistMarker(line: string): boolean {
    return ALLOWLIST_LINE_MARKERS.some((marker) => line.includes(marker));
  }

  private checkKnownVersionFields(): void {
    const canonicalMajorMinor = this.canonicalVersion.split('.').slice(0, 2).join('.');

    for (const { file, jsonPath } of KNOWN_VERSION_FIELDS) {
      const fullPath = path.join(this.root, file);
      if (!fs.existsSync(fullPath)) continue;

      let data: unknown;
      try {
        data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      } catch {
        continue; // malformed JSON is a different check's problem
      }

      let cursor: unknown = data;
      for (const key of jsonPath) {
        if (cursor === null || typeof cursor !== 'object') {
          cursor = undefined;
          break;
        }
        cursor = (cursor as Record<string, unknown>)[key];
      }

      if (typeof cursor === 'string' && cursor !== canonicalMajorMinor) {
        this.violations.push({
          file,
          line: 0,
          text: `"${jsonPath.join('.')}": "${cursor}" (expected "${canonicalMajorMinor}")`,
        });
      }
    }
  }

  private scanFile(fullPath: string, relPath: string): void {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, idx) => {
      if (this.hasAllowlistMarker(line)) return;

      const hit = ACTIVE_VERSION_PATTERNS.some((pattern) => pattern.test(line));
      if (hit) {
        this.violations.push({ file: relPath, line: idx + 1, text: line.trim() });
      }
    });
  }

  private walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.git')) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(this.root, fullPath);

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        this.walk(fullPath);
        continue;
      }

      if (this.isAllowlisted(relPath)) continue;

      const ext = path.extname(entry.name);
      if (!SCAN_EXTENSIONS.has(ext)) continue;

      this.scanFile(fullPath, relPath);
    }
  }

  public run(): boolean {
    console.log(`=== Version Consistency Check (canonical: ${this.canonicalVersion}) ===`);
    this.walk(this.root);
    this.checkKnownVersionFields();

    if (this.violations.length === 0) {
      console.log('✅ No active references to a stale Kernel version (V4.1-V4.5) found.');
      return true;
    }

    console.error(`❌ Found ${this.violations.length} active reference(s) to a stale Kernel version:\n`);
    for (const v of this.violations) {
      console.error(`  ${v.file}:${v.line}  ${v.text}`);
    }
    console.error('\nIf a match is genuinely historical, add a marker word (e.g. "legacy", "Historical")');
    console.error('to the same line, or add the file/path to ALLOWLISTED_PATHS in this script.');
    return false;
  }
}

if (require.main === module) {
  const checker = new VersionConsistencyChecker();
  const passed = checker.run();
  process.exit(passed ? 0 : 1);
}

export { VersionConsistencyChecker };
