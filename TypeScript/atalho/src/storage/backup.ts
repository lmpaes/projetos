import type { Snippet, SnippetInput } from '@/shared/types';

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

/** ETAPA 5 (TDD): ainda não implementado. */
export function createBackup(snippets: readonly Snippet[], now: Date = new Date()): BackupFile {
  void snippets;
  void now;
  throw new Error('createBackup: não implementado (etapa 5)');
}

/** ETAPA 5 (TDD): ainda não implementado. */
export function backupFileName(now: Date = new Date()): string {
  void now;
  throw new Error('backupFileName: não implementado (etapa 5)');
}

/** ETAPA 5 (TDD): ainda não implementado. */
export function serializeBackup(backup: BackupFile): string {
  void backup;
  throw new Error('serializeBackup: não implementado (etapa 5)');
}

/** ETAPA 5 (TDD): ainda não implementado. */
export function parseBackup(text: string): ParseBackupResult {
  void text;
  throw new Error('parseBackup: não implementado (etapa 5)');
}

/** ETAPA 5 (TDD): ainda não implementado. */
export function planImport(
  existing: readonly Snippet[],
  incoming: readonly ImportedSnippet[],
  mode: ImportMode,
  options: { now: number; newId: () => string },
): { snippets: Snippet[]; report: ImportReport } {
  void existing;
  void incoming;
  void mode;
  void options;
  throw new Error('planImport: não implementado (etapa 5)');
}
