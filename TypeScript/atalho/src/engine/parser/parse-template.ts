import type { ParseResult } from './ast';
import type { SyntaxRegistry } from './syntax';

/**
 * Transforma o texto de um snippet em nós da AST.
 *
 * Contrato (verificado pelos testes em tests/engine/parser/):
 * - nunca lança exceção por causa do texto do usuário: problemas viram
 *   ErrorNode no lugar do comando e uma entrada em `errors`;
 * - um erro afeta só o comando onde ele está; o resto continua sendo lido.
 *
 * ETAPA 1 (TDD): ainda não implementado, de propósito. Os testes foram
 * escritos primeiro e devem falhar até a etapa 2.
 */
export function parseTemplate(source: string, registry: SyntaxRegistry): ParseResult {
  void source;
  void registry;
  throw new Error('parseTemplate: não implementado (etapa 2)');
}
