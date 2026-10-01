import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { readClipboardViaOffscreen } from '@/background/offscreen-clipboard';
import { isReadClipboardRequest } from '@/shared/messages';
import { seedExamplesOnce } from '@/storage/examples';

// Service worker da extensão (Manifest V3).
// Ele "dorme" quando não está em uso, então não guardamos estado aqui:
// apenas reagimos a eventos.
export default defineBackground(() => {
  // Instalação ou atualização: cadastra os snippets de exemplo (só uma vez,
  // e só se a lista estiver vazia).
  browser.runtime.onInstalled.addListener(() => {
    void seedExamplesOnce();
  });

  // Clique no ícone da extensão → abre o dashboard (options page) numa aba.
  browser.action.onClicked.addListener(() => {
    void browser.runtime.openOptionsPage();
  });

  // Pedido do content script: "leia o clipboard para mim" (fallback do {clipboard}).
  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    if (!isReadClipboardRequest(message, 'background')) return; // não é para nós
    void readClipboardViaOffscreen().then(sendResponse);
    return true; // "vou responder depois" (resposta assíncrona)
  });
});
