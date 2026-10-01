import type { CommandDefinition } from '../evaluator/definitions';
import { SnippetError } from '../evaluator/errors';

/** {clipboard}: texto da área de transferência (Ctrl+C). */
export const clipboard: CommandDefinition = {
  name: 'clipboard',
  embeddable: true,
  async run(_node, { context }) {
    try {
      return await context.clipboard();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new SnippetError(`não foi possível ler a área de transferência (${reason})`);
    }
  },
};
