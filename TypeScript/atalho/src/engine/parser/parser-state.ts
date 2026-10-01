import type { CommandNode } from './ast';
import type { TagError } from './errors';
import type { Scanner } from './scanner';
import type { SyntaxRegistry } from './syntax';

/**
 * O que as partes do parser compartilham entre si.
 *
 * Por que uma interface? Fórmulas podem conter comandos ({=catch({site: url}, "")})
 * e comandos podem conter fórmulas (o {if: ...} da Fase 2). Em vez de um
 * arquivo importar o outro e vice-versa (importação circular), quem sabe
 * ler um comando embutido é passado adiante por aqui.
 */
export interface ParserState {
  readonly scanner: Scanner;
  readonly registry: SyntaxRegistry;
  /** Lê um comando "{...}" que aparece dentro de uma fórmula. */
  parseEmbeddedCommand(): CommandNode;
  /** Cria o erro "faltou fechar a chave", apontando para a "{" do comando atual. */
  unclosedTagError(): TagError;
}
