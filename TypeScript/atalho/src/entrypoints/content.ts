import { defineContentScript } from 'wxt/utils/define-content-script';

// Content script: código que o Chrome injeta em cada página visitada.
// Roda num "mundo isolado": enxerga o DOM da página, mas não as variáveis
// JavaScript dela (e a página também não enxerga as nossas).
export default defineContentScript({
  // Um expansor de texto precisa funcionar em qualquer site.
  matches: ['<all_urls>'],
  // Também roda dentro de iframes (vários editores de texto ricos usam iframe)...
  allFrames: true,
  // ...inclusive iframes "about:blank", comuns em editores como o TinyMCE.
  matchAboutBlank: true,
  matchOriginAsFallback: true,

  main() {
    // Etapa 0: só prova que o script foi injetado. A detecção de atalhos
    // chega na etapa 6.
    console.debug('[Atalho] content script carregado em', location.href);
  },
});
