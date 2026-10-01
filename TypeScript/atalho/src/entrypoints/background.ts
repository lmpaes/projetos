import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';

// Service worker da extensão (Manifest V3).
// Ele "dorme" quando não está em uso, então não guardamos estado aqui:
// apenas reagimos a eventos.
export default defineBackground(() => {
  // Clique no ícone da extensão → abre o dashboard (options page) numa aba.
  browser.action.onClicked.addListener(() => {
    void browser.runtime.openOptionsPage();
  });
});
