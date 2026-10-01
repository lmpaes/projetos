import type { CommandDefinition } from '../evaluator/definitions';

/**
 * {time: formato}: data/hora atual formatada (tokens do dayjs, ex.: DD/MM/YYYY).
 * ETAPA 4 (TDD): `run` ainda não implementado.
 */
export const time: CommandDefinition = {
  name: 'time',
  usage: '{time: DD/MM/YYYY}',
  positional: { kind: 'raw', required: true },
  embeddable: true,
  run() {
    throw new Error('{time}: não implementado (etapa 4)');
  },
};
