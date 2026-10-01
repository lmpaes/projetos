// =============================================================================
// Leitura do clipboard a partir do content script, em duas tentativas:
//   1. navigator.clipboard.readText(): direto, funciona na maioria das páginas;
//   2. se a página bloquear (Permissions-Policy, página http sem a API...),
//      pede ao background, que lê por um documento offscreen da extensão.
// =============================================================================

import { browser } from 'wxt/browser';
import { isReadClipboardResponse, type ReadClipboardRequest } from '@/shared/messages';

export async function readClipboard(nav: Pick<Navigator, 'clipboard'> = navigator): Promise<string> {
  try {
    // Em páginas http, navigator.clipboard é undefined → cai no catch também.
    return await nav.clipboard.readText();
  } catch {
    return readClipboardViaBackground();
  }
}

async function readClipboardViaBackground(): Promise<string> {
  const request: ReadClipboardRequest = { target: 'background', type: 'read-clipboard' };
  const response: unknown = await browser.runtime.sendMessage(request);
  if (!isReadClipboardResponse(response)) {
    throw new Error('o background não respondeu ao pedido de leitura');
  }
  if (!response.ok) throw new Error(response.error);
  return response.text;
}
