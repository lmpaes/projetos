import type { ReadClipboardResponse } from '@/shared/messages';

/**
 * Lê o clipboard "colando" numa textarea temporária.
 * Roda no documento offscreen (uma página escondida da própria extensão), onde
 * a permissão "clipboardRead" libera o execCommand('paste') sem depender da
 * página que o usuário está usando. Nunca lança: devolve { ok, ... }.
 */
export function readViaPaste(doc: Document): ReadClipboardResponse {
  const textarea = doc.createElement('textarea');
  doc.body.append(textarea);
  try {
    textarea.focus();
    if (!doc.execCommand('paste')) {
      return { ok: false, error: 'o navegador recusou o comando de colar' };
    }
    return { ok: true, text: textarea.value };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    textarea.remove();
  }
}
