// =============================================================================
// Modo diagnóstico: quando ligado no dashboard, cada passo da expansão aparece
// no console da página (F12 → Console). Serve para descobrir por que um site
// específico não funciona sem precisar mexer no código.
// =============================================================================

import { detectRichEditor } from './rich-editors';

/** Função que registra um passo da expansão (só escreve algo no modo diagnóstico). */
export type DiagnosticLog = (message: string, details?: Record<string, unknown>) => void;

/**
 * Cria a função de log. `isEnabled` é consultada a cada chamada, então ligar
 * ou desligar no dashboard vale na hora, sem recarregar a página.
 */
export function createDiagnosticLog(
  isEnabled: () => boolean,
  output: Pick<Console, 'info'> = console,
): DiagnosticLog {
  return (message, details) => {
    if (!isEnabled()) return;
    if (details === undefined) output.info(`[Atalho] ${message}`);
    else output.info(`[Atalho] ${message}`, details);
  };
}

/** Descrição curta de um elemento para os logs, ex.: "div.ck-editor__editable [ckeditor5]". */
export function describeElement(element: Element | null): string {
  if (!element) return '(nenhum)';
  const id = element.id ? `#${element.id}` : '';
  const classes = Array.from(element.classList)
    .slice(0, 3)
    .map((name) => `.${name}`)
    .join('');
  const editor = detectRichEditor(element);
  return `${element.tagName.toLowerCase()}${id}${classes}${editor ? ` [${editor}]` : ''}`;
}
