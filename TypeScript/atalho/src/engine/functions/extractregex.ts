import type { FunctionDefinition } from '../evaluator/definitions';
import { SnippetError } from '../evaluator/errors';
import { toText, type Value } from '../evaluator/values';

/**
 * extractregex(texto, regex): extrai um pedaço do texto usando uma expressão regular.
 *
 * - Com grupo de captura "(...)": devolve o que o 1º grupo capturou.
 *     extractregex("?id=123&tab=x", "id=([^&]+)")  →  "123"
 * - Sem grupo: devolve o trecho inteiro encontrado.
 *     extractregex("pedido 4521", "[0-9]+")        →  "4521"
 * - Sem correspondência: devolve "" (texto vazio).
 *
 * Nota: a regex é do usuário e roda no navegador; uma regex muito "explosiva"
 * sobre um texto enorme pode deixar a aba lenta (JS não tem timeout de regex).
 */
export const extractregex: FunctionDefinition = {
  name: 'extractregex',
  minArgs: 2,
  maxArgs: 2,
  call(args: Value[]) {
    const text = toText(args[0] ?? '');
    const pattern = toText(args[1] ?? '');

    let regex: RegExp;
    try {
      regex = new RegExp(pattern);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new SnippetError(`regex inválida "${pattern}" (${detail})`);
    }

    const match = regex.exec(text);
    if (!match) return '';
    // match[0] = trecho inteiro; match[1] = 1º grupo (undefined se não participou).
    return match.length > 1 ? (match[1] ?? '') : match[0];
  },
};
