import type { FunctionDefinition } from '../evaluator/definitions';

/**
 * catch(expressão, padrão): se a expressão falhar, devolve o padrão.
 * ETAPA 3 (TDD): ainda não implementado.
 */
export const catchFunction: FunctionDefinition = {
  name: 'catch',
  minArgs: 2,
  maxArgs: 2,
  lazy: true,
  call() {
    throw new Error('catch: não implementado (etapa 3)');
  },
};
