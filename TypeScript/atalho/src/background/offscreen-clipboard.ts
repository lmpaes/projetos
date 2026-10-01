// =============================================================================
// Ponte background → documento offscreen para ler o clipboard.
// O service worker (background) não tem DOM, então não consegue "colar".
// Ele cria um documento offscreen (uma página invisível da extensão) e pede
// para ELE fazer a leitura.
// =============================================================================

import { browser } from 'wxt/browser';
import {
  isReadClipboardResponse,
  type ReadClipboardRequest,
  type ReadClipboardResponse,
} from '@/shared/messages';

/** Caminho do documento gerado a partir de src/entrypoints/offscreen/index.html. */
const OFFSCREEN_PATH = '/offscreen.html';

/** Evita criar dois documentos se dois pedidos chegarem ao mesmo tempo. */
let creating: Promise<void> | null = null;

async function ensureOffscreenDocument(): Promise<void> {
  const existing = await browser.runtime.getContexts({
    contextTypes: [browser.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (existing.length > 0) return;

  creating ??= browser.offscreen
    .createDocument({
      url: OFFSCREEN_PATH,
      reasons: [browser.offscreen.Reason.CLIPBOARD],
      justification: 'Ler a área de transferência para o comando {clipboard}.',
    })
    .finally(() => {
      creating = null;
    });
  await creating;
}

/** Lê o clipboard via documento offscreen. Nunca rejeita: devolve { ok, ... }. */
export async function readClipboardViaOffscreen(): Promise<ReadClipboardResponse> {
  try {
    await ensureOffscreenDocument();
    const request: ReadClipboardRequest = { target: 'offscreen', type: 'read-clipboard' };
    const response: unknown = await browser.runtime.sendMessage(request);
    return isReadClipboardResponse(response)
      ? response
      : { ok: false, error: 'o documento offscreen não respondeu' };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
