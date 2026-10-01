import type { FunctionDefinition, Thunk } from '../evaluator/definitions';
import { SnippetError } from '../evaluator/errors';

/**
 * catch(expressão, padrão): se a expressão falhar, devolve o padrão.
 *
 *   {=catch({site: text; selector=.cliente .nome}, "Não encontrado")}
 *
 * É "preguiçosa" (lazy): recebe os argumentos como funções e só calcula o
 * padrão se a expressão falhar. Erros de SINTAXE não são pegos, porque o
 * snippet nem chega a ser executado (ex.: comando com nome errado).
 */
export const catchFunction: FunctionDefinition = {
  name: 'catch',
  minArgs: 2,
  maxArgs: 2,
  lazy: true,
  async call(args: Thunk[]) {
    const [expression, fallback] = args;
    if (!expression || !fallback) throw new SnippetError('catch precisa de 2 argumentos');
    try {
      return await expression();
    } catch {
      return fallback();
    }
  },
};
