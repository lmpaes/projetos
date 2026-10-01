import type { FunctionDefinition } from '../evaluator/definitions';

/**
 * extractregex(texto, regex): extrai um pedaço do texto usando uma expressão regular.
 * ETAPA 3 (TDD): ainda não implementado.
 */
export const extractregex: FunctionDefinition = {
  name: 'extractregex',
  minArgs: 2,
  maxArgs: 2,
  call() {
    throw new Error('extractregex: não implementado (etapa 3)');
  },
};
