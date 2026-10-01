// =============================================================================
// O fluxo da expansão: ouvir a digitação → achar o atalho → renderizar o
// snippet → trocar o atalho pelo texto.
// =============================================================================

import type { RenderError, RenderResult } from '@/engine';
import type { Snippet } from '@/shared/types';
import type { DiagnosticLog } from './diagnostics';
import { readTextBeforeCaret } from './caret';
import { findEditableTarget } from './editable';
import { replaceBeforeCaret } from './insert';
import type { ShortcutMatcher } from './matcher';

export interface ExpanderOptions {
  /** Matcher com os snippets atuais (o content script troca quando a lista muda). */
  getMatcher(): ShortcutMatcher;
  /** Renderiza o conteúdo do snippet (comandos, fórmulas...). */
  render(content: string): Promise<RenderResult>;
  /** Chamado quando a expansão teve erros (para mostrar o aviso na página). */
  onErrors?(errors: RenderError[], snippet: Snippet): void;
  /** Registro dos passos (modo diagnóstico). Padrão: não registra nada. */
  log?: DiagnosticLog;
  /**
   * Decide se o evento veio do usuário. Padrão: event.isTrusted.
   * Só os testes trocam isso (o jsdom não gera eventos "confiáveis").
   */
  isTrusted?(event: Event): boolean;
}

/** Começa a ouvir a digitação no documento. Devolve a função que desliga. */
export function attachExpander(doc: Document, options: ExpanderOptions): () => void {
  const isTrusted = (event: Event) => (options.isTrusted ? options.isTrusted(event) : event.isTrusted);
  /** true enquanto NÓS estamos inserindo texto (não reagimos ao nosso próprio evento). */
  let inserting = false;
  /** true durante uma expansão (uma de cada vez). */
  let busy = false;

  const onInput = (event: Event) => {
    // SEGURANÇA: só eventos gerados pelo usuário de verdade. Sem isso, um
    // script da página poderia "digitar" um atalho sozinho e ler o resultado
    // (por exemplo, o conteúdo do seu clipboard).
    if (inserting || !isTrusted(event)) return;
    const inputEvent = event as InputEvent;
    // Só digitação comum: apagar, colar etc. não disparam a expansão.
    // Durante composição (IME, teclas mortas do ABNT2 no macOS) esperamos o compositionend.
    if (inputEvent.isComposing || inputEvent.inputType !== 'insertText') return;
    void expand(event.composedPath()[0] ?? event.target, inputEvent.data ?? '');
  };

  const onCompositionEnd = (event: Event) => {
    if (inserting || !isTrusted(event)) return;
    void expand(event.composedPath()[0] ?? event.target, (event as CompositionEvent).data);
  };

  async function expand(target: EventTarget | null, typed: string): Promise<void> {
    const matcher = options.getMatcher();
    // Filtro barato a cada tecla: se nenhum atalho termina com esta letra, nem olha o campo.
    if (!matcher.couldEndWith(typed.slice(-1))) return;

    const editable = findEditableTarget(target);
    if (!editable) return;
    const before = readTextBeforeCaret(editable, matcher.maxLength);
    if (before === null) return;
    const snippet = matcher.match(before);
    if (!snippet || busy) return;

    busy = true;
    try {
      // Deixa o evento da tecla terminar de ser processado pela página (ex.:
      // o React atualizar o estado) antes de mexermos no campo.
      await nextTask();
      const result = await options.render(snippet.content);

      // O usuário continuou digitando enquanto renderizávamos? Então desistimos.
      const current = readTextBeforeCaret(editable, matcher.maxLength);
      if (current === null || !current.endsWith(snippet.shortcut)) return;

      inserting = true;
      try {
        await replaceBeforeCaret(editable, snippet.shortcut.length, result.text);
      } finally {
        inserting = false;
      }
      if (result.errors.length > 0) options.onErrors?.(result.errors, snippet);
    } catch (error) {
      console.error('[Atalho] não foi possível expandir o snippet', error);
    } finally {
      busy = false;
    }
  }

  // Fase de captura (true): recebemos o evento antes dos scripts da página.
  doc.addEventListener('input', onInput, true);
  doc.addEventListener('compositionend', onCompositionEnd, true);
  return () => {
    doc.removeEventListener('input', onInput, true);
    doc.removeEventListener('compositionend', onCompositionEnd, true);
  };
}

function nextTask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
