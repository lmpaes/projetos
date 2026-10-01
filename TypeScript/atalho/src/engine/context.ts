// =============================================================================
// RenderContext: tudo o que vem "de fora" do snippet.
// -----------------------------------------------------------------------------
// O motor (engine/) não acessa window, document nem chrome.* diretamente.
// Quem chama o motor entrega um RenderContext, e existem três versões dele:
//   - a real, no content script (página de verdade, clipboard de verdade);
//   - a simulada, no preview do dashboard (URL e HTML de teste);
//   - a falsa, nos testes (valores fixos, previsíveis).
// Isso é "injeção de dependência": deixa o motor 100% testável.
// =============================================================================

/** Acesso à página onde o snippet está sendo expandido (usado pelo {site}). */
export interface PageProvider {
  /** URL completa da página, ex.: https://test.com/my/page?foo=1#part */
  readonly url: string;
  /** Documento da página: título, texto, HTML e busca por seletor CSS. */
  readonly document: Document;
  /** Texto selecionado na página (ou o último selecionado antes de focar o campo). */
  selection(): string;
}

export interface RenderContext {
  readonly page: PageProvider;
  /** Lê o texto da área de transferência. */
  clipboard(): Promise<string>;
  /** Data e hora "atuais" (nos testes, um relógio parado). */
  now(): Date;
}
