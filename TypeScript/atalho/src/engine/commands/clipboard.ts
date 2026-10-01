import type { CommandDefinition } from '../evaluator/definitions';

/**
 * {clipboard}: texto da área de transferência.
 * ETAPA 4 (TDD): `run` ainda não implementado.
 */
export const clipboard: CommandDefinition = {
  name: 'clipboard',
  embeddable: true,
  run() {
    throw new Error('{clipboard}: não implementado (etapa 4)');
  },
};
