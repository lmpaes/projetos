import type { PageProvider } from '@/engine';

/** Guarda a última seleção de texto feita na página (fora de campos editáveis). */
export interface SelectionTracker {
  lastSelection(): string;
  dispose(): void;
}

/** ETAPA 4 (TDD): ainda não implementado. */
export function readableTopWindow(win: Window): Window {
  void win;
  throw new Error('readableTopWindow: não implementado (etapa 4)');
}

/** ETAPA 4 (TDD): ainda não implementado. */
export function trackSelection(doc: Document): SelectionTracker {
  void doc;
  throw new Error('trackSelection: não implementado (etapa 4)');
}

/** ETAPA 4 (TDD): ainda não implementado. */
export function createPageProvider(win: Window, tracker?: SelectionTracker): PageProvider {
  void win;
  void tracker;
  throw new Error('createPageProvider: não implementado (etapa 4)');
}
