import type { CommandDefinition } from '../evaluator/definitions';
import { SnippetError } from '../evaluator/errors';
import type { Value } from '../evaluator/values';
import { rawSetting, rawText } from './args';

/** Tipos aceitos por {site: ...} (diferencia maiúsculas de minúsculas, como no Text Blaze). */
export const SITE_TYPES = [
  'url',
  'domain',
  'path',
  'protocol',
  'query',
  'hash',
  'title',
  'text',
  'html',
  'selection',
] as const;

type SiteType = (typeof SITE_TYPES)[number];

/**
 * {site: tipo; selector=...; multiple=yes|no}: lê dados da página atual.
 *
 * Exemplos, numa página https://test.com/my/page?foo=1#part:
 *   {site: domain}                         → test.com
 *   {site: query}                          → ?foo=1
 *   {site: text; selector=.cliente .nome}  → texto do 1º elemento que casa
 *   {site: text; selector=li; multiple=yes} → lista com o texto de todos os <li>
 */
export const site: CommandDefinition = {
  name: 'site',
  usage: '{site: url}',
  positional: { kind: 'raw', required: true, oneOf: SITE_TYPES },
  settings: {
    selector: { kind: 'raw' },
    multiple: { kind: 'raw', oneOf: ['yes', 'no'] },
  },
  embeddable: true,

  // Regras que envolvem mais de um argumento (checadas ao escrever o snippet).
  validate(node) {
    const type = rawText(node.positional);
    const selector = rawSetting(node, 'selector');
    const multiple = rawSetting(node, 'multiple');
    if ((selector !== null || multiple !== null) && type !== 'text' && type !== 'html') {
      return 'selector= e multiple= só valem com {site: text} ou {site: html}';
    }
    if (multiple !== null && selector === null) {
      return 'multiple= só funciona junto com selector= (ex.: {site: text; selector=li; multiple=yes})';
    }
    return null;
  },

  run(node, { context }) {
    const { page } = context;
    // O parser já garantiu que o tipo é um dos SITE_TYPES.
    const type = rawText(node.positional) as SiteType;

    switch (type) {
      case 'url':
        return page.url;
      case 'domain':
        return parsePageUrl(page.url).hostname;
      case 'path':
        return parsePageUrl(page.url).pathname;
      case 'protocol':
        return parsePageUrl(page.url).protocol.replace(/:$/, ''); // "https:" → "https"
      case 'query':
        return parsePageUrl(page.url).search;
      case 'hash':
        return parsePageUrl(page.url).hash;
      case 'title':
        return page.document.title;
      case 'selection':
        // Sem espaços/quebras nas pontas: o clique triplo seleciona a linha
        // inteira, junto com a quebra de linha do fim.
        return page.selection().trim();
      case 'text':
      case 'html':
        return readContent(
          page.document,
          type,
          rawSetting(node, 'selector'),
          rawSetting(node, 'multiple') === 'yes',
        );
    }
  },
};

function parsePageUrl(url: string): URL {
  try {
    return new URL(url);
  } catch {
    throw new SnippetError(`não foi possível ler a URL da página ("${url}")`);
  }
}

/** Texto ou HTML da página inteira ou dos elementos que casam com o seletor. */
function readContent(
  doc: Document,
  as: 'text' | 'html',
  selector: string | null,
  multiple: boolean,
): Value {
  const read = (element: Element) => (as === 'text' ? textOf(element) : element.outerHTML);

  if (selector === null) return read(as === 'text' ? doc.body : doc.documentElement);

  let elements: Element[];
  try {
    elements = Array.from(doc.querySelectorAll(selector));
  } catch {
    throw new SnippetError(`seletor CSS inválido: "${selector}"`);
  }

  if (multiple) return elements.map(read);

  const first = elements[0];
  if (!first) {
    throw new SnippetError(
      `nenhum elemento encontrado para o seletor "${selector}" (use catch() para definir um texto padrão)`,
    );
  }
  return read(first);
}

/**
 * Texto visível de um elemento.
 * innerText respeita o CSS (ignora o que está escondido), mas só existe em
 * elementos HTML de uma página renderizada; o jsdom (testes) não tem. Nesse
 * caso usamos textContent.
 */
function textOf(element: Element): string {
  const innerText = (element as Partial<HTMLElement>).innerText;
  const text = typeof innerText === 'string' ? innerText : (element.textContent ?? '');
  return text.trim();
}
