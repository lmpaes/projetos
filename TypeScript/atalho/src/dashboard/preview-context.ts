import type { RenderContext } from '@/engine';

/** A "página de teste" do preview: o que o {site} e o {clipboard} enxergam. */
export interface PreviewPage {
  url: string;
  title: string;
  html: string;
  selection: string;
  clipboard: string;
}

export const DEFAULT_PREVIEW_PAGE: PreviewPage = {
  url: 'https://exemplo.com/pedidos/98765?id=123&tab=x#detalhes',
  title: 'Pedido 98765 — Minha Loja',
  html: [
    '<h1>Pedido 98765</h1>',
    '<div class="cliente">',
    '  <span class="nome">Maria Silva</span>',
    '</div>',
    '<ul class="itens">',
    '  <li>Camiseta</li>',
    '  <li>Boné</li>',
    '</ul>',
  ].join('\n'),
  selection: 'texto selecionado de exemplo',
  clipboard: 'texto copiado de exemplo',
};

/**
 * Monta o RenderContext do preview a partir da página de teste.
 *
 * O HTML é lido pelo DOMParser: ele cria um documento "de mentira", que NÃO
 * executa scripts nem carrega imagens. Por isso é seguro colar aqui o HTML de
 * qualquer página para testar seletores.
 */
export function createPreviewContext(page: PreviewPage, now: () => Date = () => new Date()): RenderContext {
  const doc = new DOMParser().parseFromString(page.html, 'text/html');
  if (page.title !== '') doc.title = page.title;
  return {
    page: { url: page.url, document: doc, selection: () => page.selection },
    clipboard: () => Promise.resolve(page.clipboard),
    now,
  };
}
