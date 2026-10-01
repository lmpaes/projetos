import type { RenderError } from '@/engine';

export interface ToastHandle {
  /** Raiz do Shadow DOM (exposta para os testes lerem o conteúdo). */
  readonly root: ShadowRoot;
  dismiss(): void;
}

export interface ToastOptions {
  /** Tempo até sumir sozinho, em ms. */
  durationMs?: number;
}

/** ETAPA 6 (TDD): ainda não implementado. */
export function showErrorToast(
  doc: Document,
  shortcut: string,
  errors: readonly RenderError[],
  options: ToastOptions = {},
): ToastHandle {
  void doc;
  void shortcut;
  void errors;
  void options;
  throw new Error('showErrorToast: não implementado (etapa 6)');
}
