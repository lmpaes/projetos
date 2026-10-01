import { browser } from 'wxt/browser';
import { readViaPaste } from '@/offscreen/read-via-paste';
import { isReadClipboardRequest } from '@/shared/messages';

// Documento offscreen: responde aos pedidos de leitura do clipboard feitos pelo background.
browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isReadClipboardRequest(message, 'offscreen')) return; // não é para nós
  sendResponse(readViaPaste(document));
});
