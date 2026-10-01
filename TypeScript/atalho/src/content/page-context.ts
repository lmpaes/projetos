// =============================================================================
// Implementação REAL do PageProvider (o "{site}" lê a página por aqui).
// =============================================================================

import type { PageProvider } from '@/engine';

/** Campos onde o usuário digita: seleções feitas dentro deles não contam. */
const EDITABLE_SELECTOR = 'input, textarea, [contenteditable]:not([contenteditable="false"])';

/** Guarda a última seleção de texto feita na página (fora de campos editáveis). */
export interface SelectionTracker {
  lastSelection(): string;
  dispose(): void;
}

/**
 * Qual janela representa "a página"?
 * Editores de texto rico às vezes rodam dentro de um iframe "about:blank". Nesse
 * caso queremos a URL/título da página de cima (window.top). Só conseguimos ler
 * o top se ele for da mesma origem; senão o navegador lança SecurityError e
 * ficamos com o próprio frame.
 */
export function readableTopWindow(win: Window): Window {
  try {
    const top = win.top;
    if (top && top !== win) {
      void top.location.href; // lança SecurityError se for de outra origem
      return top;
    }
  } catch {
    // outra origem: não dá para ler o topo
  }
  return win;
}

/**
 * Quando o usuário clica num campo para digitar o atalho, a seleção da página
 * some. Por isso guardamos a última seleção feita FORA de campos editáveis:
 * o fluxo "seleciona o nome do cliente → clica no e-mail → digita /resposta"
 * funciona com {site: selection}.
 */
export function trackSelection(doc: Document): SelectionTracker {
  let last = '';

  const onSelectionChange = () => {
    const selection = doc.getSelection();
    const text = selection?.toString() ?? '';
    if (text.trim() !== '' && !isInsideEditable(selection?.anchorNode ?? null)) {
      last = text;
    }
  };

  doc.addEventListener('selectionchange', onSelectionChange);
  return {
    lastSelection: () => last,
    dispose: () => doc.removeEventListener('selectionchange', onSelectionChange),
  };
}

/** Cria o PageProvider da janela atual. URL e documento são lidos no momento do uso. */
export function createPageProvider(win: Window, tracker?: SelectionTracker): PageProvider {
  const pageWindow = readableTopWindow(win);
  return {
    get url() {
      return pageWindow.location.href;
    },
    get document() {
      return pageWindow.document;
    },
    selection() {
      const current = pageWindow.getSelection()?.toString() ?? '';
      return current.trim() !== '' ? current : (tracker?.lastSelection() ?? '');
    },
  };
}

function isInsideEditable(node: Node | null): boolean {
  const element = node instanceof Element ? node : (node?.parentElement ?? null);
  return element?.closest(EDITABLE_SELECTOR) != null;
}
