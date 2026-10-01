// =============================================================================
// Regra única de "o texto termina com o atalho", usada pelo content script
// (para expandir) e pelo dashboard (para avisar de conflitos entre atalhos).
// =============================================================================

/**
 * Caracteres que "grudam" o atalho no que vem antes: letras (com acento),
 * números, "_" e as barras de caminhos/URLs. Depois deles o atalho NÃO
 * expande. Assim "a/sig", "site.com/pag" e "https://pag" ficam como estão.
 * \p{L} = letras de qualquer idioma; \p{M} = acentos "soltos"; \p{N} = números.
 */
const GLUE_CHAR = /[\p{L}\p{M}\p{N}_/\\]/u;

/**
 * O texto termina com o atalho E o atalho está separado do que vem antes?
 * Separado = começo do texto (início do campo/linha), espaço, quebra de linha
 * ou pontuação como "(", aspas, ":" e ",".
 *
 *   endsWithShortcut('Olá /sig', '/sig')  → true
 *   endsWithShortcut('(/sig', '/sig')     → true
 *   endsWithShortcut('a/sig', '/sig')     → false (colado na letra)
 */
export function endsWithShortcut(text: string, shortcut: string): boolean {
  if (shortcut === '' || !text.endsWith(shortcut)) return false;
  // O caractere logo antes do atalho (undefined = o atalho está no começo).
  const previous = text.at(-shortcut.length - 1);
  return previous === undefined || !GLUE_CHAR.test(previous);
}
