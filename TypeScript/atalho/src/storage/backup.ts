// =============================================================================
// Backup em JSON: exportar, ler (validando um arquivo que pode ter QUALQUER
// coisa) e planejar a importação. Tudo aqui é puro (sem storage).
// =============================================================================

import type { Snippet, SnippetInput } from '@/shared/types';
import { validateSnippet } from './validation';

export const BACKUP_APP = 'atalho';
export const BACKUP_VERSION = 1;

/** Formato do arquivo .json de backup. */
export interface BackupFile {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  /** Data da exportação (ISO 8601). */
  exportedAt: string;
  snippets: Snippet[];
}

/** Snippet lido de um backup: os campos do formulário e, se vierem, as datas. */
export type ImportedSnippet = SnippetInput & { createdAt?: number; updatedAt?: number };

export type ParseBackupResult = { ok: true; snippets: ImportedSnippet[] } | { ok: false; error: string };

/** 'merge' mantém os atuais e acrescenta; 'replace' apaga tudo e usa só o arquivo. */
export type ImportMode = 'merge' | 'replace';

export interface ImportReport {
  imported: number;
  skipped: Array<{ name: string; shortcut: string; reason: string }>;
}

// -----------------------------------------------------------------------------
// Exportar
// -----------------------------------------------------------------------------

export function createBackup(snippets: readonly Snippet[], now: Date = new Date()): BackupFile {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), snippets: [...snippets] };
}

/** Ex.: atalho-backup-2026-10-01.json (data local). */
export function backupFileName(now: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `atalho-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

/** JSON indentado: fica legível se você abrir o arquivo num editor. */
export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2);
}

// -----------------------------------------------------------------------------
// Ler um arquivo de backup
// -----------------------------------------------------------------------------

/**
 * Lê e valida o texto de um arquivo de backup.
 * O arquivo vem de fora, então não confiamos em nada: conferimos cada campo e
 * copiamos SÓ os campos conhecidos para objetos novos (campos extras, inclusive
 * "__proto__", são ignorados).
 */
export function parseBackup(text: string): ParseBackupResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'O arquivo não é um JSON válido.' };
  }

  if (!isRecord(data) || data.app !== BACKUP_APP) {
    return { ok: false, error: 'Este arquivo não parece ser um backup do Atalho.' };
  }
  if (data.version !== BACKUP_VERSION) {
    return { ok: false, error: `Versão de backup não suportada: ${String(data.version)}.` };
  }
  if (!Array.isArray(data.snippets)) {
    return { ok: false, error: 'O backup não tem a lista de snippets.' };
  }

  const items: unknown[] = data.snippets;
  const snippets: ImportedSnippet[] = [];
  for (const [index, item] of items.entries()) {
    const parsed = parseItem(item, index + 1);
    if (typeof parsed === 'string') return { ok: false, error: parsed };
    snippets.push(parsed);
  }
  return { ok: true, snippets };
}

/** Converte um item do arquivo, ou devolve a mensagem de erro. */
function parseItem(item: unknown, position: number): ImportedSnippet | string {
  const invalid = (reason: string) => `Snippet #${position} inválido: ${reason}.`;
  if (!isRecord(item)) return invalid('não é um objeto');

  const { name, shortcut, content, createdAt, updatedAt } = item;
  if (typeof name !== 'string') return invalid('o campo "name" precisa ser texto');
  if (typeof shortcut !== 'string') return invalid('o campo "shortcut" precisa ser texto');
  if (typeof content !== 'string') return invalid('o campo "content" precisa ser texto');

  const result: ImportedSnippet = { name, shortcut, content };
  if (isTimestamp(createdAt)) result.createdAt = createdAt;
  if (isTimestamp(updatedAt)) result.updatedAt = updatedAt;
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

// -----------------------------------------------------------------------------
// Planejar a importação
// -----------------------------------------------------------------------------

/**
 * Calcula a lista final de snippets depois de importar, sem salvar nada.
 * Cada item passa pelas mesmas regras do formulário; os que falham são
 * pulados e aparecem no relatório com o motivo.
 */
export function planImport(
  existing: readonly Snippet[],
  incoming: readonly ImportedSnippet[],
  mode: ImportMode,
  options: { now: number; newId: () => string },
): { snippets: Snippet[]; report: ImportReport } {
  const snippets: Snippet[] = mode === 'merge' ? [...existing] : [];
  const report: ImportReport = { imported: 0, skipped: [] };

  for (const item of incoming) {
    const name = item.name.trim();
    const shortcut = item.shortcut.trim();
    const [firstError] = validateSnippet(item, snippets).errors;
    if (firstError) {
      report.skipped.push({ name, shortcut, reason: firstError.message });
      continue;
    }
    const createdAt = item.createdAt ?? options.now;
    snippets.push({
      id: options.newId(), // id sempre novo: evita colidir com ids existentes
      name,
      shortcut,
      content: item.content,
      createdAt,
      updatedAt: item.updatedAt ?? createdAt,
    });
    report.imported++;
  }

  return { snippets, report };
}
