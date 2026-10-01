import type { CommandDefinition } from '../evaluator/definitions';
import { rawText } from './args';

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

/**
 * {site: tipo; selector=...; multiple=yes|no}: lê dados da página atual.
 * ETAPA 4 (TDD): `run` ainda não implementado.
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
  validate(node) {
    void rawText(node.positional);
    return null;
  },
  run() {
    throw new Error('{site}: não implementado (etapa 4)');
  },
};
