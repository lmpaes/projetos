// =============================================================================
// Aviso discreto no canto da página quando a expansão teve erros.
// -----------------------------------------------------------------------------
// Fica dentro de um Shadow DOM "fechado": o CSS da página não bagunça o aviso,
// e os scripts da página não conseguem mexer nele. Todo texto entra com
// textContent (nunca innerHTML), então mensagens nunca viram HTML.
// =============================================================================

import type { RenderError } from '@/engine';

const TAG = 'atalho-toast';
const MAX_MESSAGES = 3;
const DEFAULT_DURATION_MS = 8000;

const CSS = `
  :host {
    all: initial;
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 2147483647;
  }
  .toast {
    box-sizing: border-box;
    max-width: 380px;
    padding: 12px 36px 12px 14px;
    border-radius: 10px;
    background: #1f2933;
    color: #f5f7fa;
    font: 13px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif;
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.25);
    position: relative;
  }
  strong { display: block; margin-bottom: 4px; }
  ul { margin: 4px 0; padding-left: 18px; }
  li { margin: 2px 0; word-break: break-word; }
  p { margin: 4px 0 0; color: #cbd2d9; }
  button {
    position: absolute;
    top: 6px;
    right: 8px;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 18px;
    cursor: pointer;
  }
`;

export interface ToastHandle {
  /** Raiz do Shadow DOM (exposta para os testes lerem o conteúdo). */
  readonly root: ShadowRoot;
  dismiss(): void;
}

export interface ToastOptions {
  /** Tempo até sumir sozinho, em ms. */
  durationMs?: number;
}

export function showErrorToast(
  doc: Document,
  shortcut: string,
  errors: readonly RenderError[],
  options: ToastOptions = {},
): ToastHandle {
  // Só um aviso por vez.
  doc.querySelectorAll(TAG).forEach((old) => old.remove());

  const host = doc.createElement(TAG);
  const root = host.attachShadow({ mode: 'closed' });
  applyStyles(root, doc);

  const box = doc.createElement('div');
  box.className = 'toast';
  box.setAttribute('role', 'status');
  box.setAttribute('aria-live', 'polite');

  const count = errors.length;
  const title = doc.createElement('strong');
  title.textContent = `Atalho: ${shortcut} foi expandido com ${count} ${count === 1 ? 'erro' : 'erros'}`;

  const list = doc.createElement('ul');
  for (const error of errors.slice(0, MAX_MESSAGES)) {
    const item = doc.createElement('li');
    item.textContent = error.message;
    list.append(item);
  }

  const hint = doc.createElement('p');
  hint.textContent =
    (count > MAX_MESSAGES ? `… e mais ${count - MAX_MESSAGES}. ` : '') +
    'Os trechos com problema aparecem como [ERRO: ...] no texto.';

  const close = doc.createElement('button');
  close.type = 'button';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Fechar aviso');

  box.append(title, list, hint, close);
  root.append(box);
  doc.documentElement.append(host);

  const timer = setTimeout(dismiss, options.durationMs ?? DEFAULT_DURATION_MS);
  function dismiss() {
    clearTimeout(timer);
    host.remove();
  }
  close.addEventListener('click', dismiss);

  return { root, dismiss };
}

/**
 * Estilos via "constructable stylesheet" quando o navegador suporta: a
 * política de segurança (CSP) da página não bloqueia esse tipo de estilo.
 */
function applyStyles(root: ShadowRoot, doc: Document): void {
  if ('adoptedStyleSheets' in root) {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(CSS);
      root.adoptedStyleSheets = [sheet];
      return;
    } catch {
      // segue para o <style>
    }
  }
  const style = doc.createElement('style');
  style.textContent = CSS;
  root.append(style);
}
