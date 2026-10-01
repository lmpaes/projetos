// =============================================================================
// Avaliador: percorre a AST (já montada pelo parser) e produz o texto final.
// -----------------------------------------------------------------------------
// Regras principais:
//   - os nós são executados em ordem, um de cada vez (async/await), para que
//     variáveis e efeitos aconteçam na sequência em que aparecem no snippet;
//   - um erro afeta só o seu trecho: ele vira "[ERRO: ...]" no texto e entra
//     na lista `errors`, e o resto do snippet continua sendo renderizado;
//   - dentro de uma fórmula, o erro "sobe" até ser pego por catch() ou chegar
//     à borda da fórmula.
// =============================================================================

import type { RenderContext } from '../context';
import { locate, type CommandNode, type Expr, type FunctionCall, type Node, type Span } from '../parser';
import type { EngineRegistry, EvalEnv } from './definitions';
import { SnippetError } from './errors';
import { Scope } from './scope';
import { toText, type Value } from './values';

/** Um erro mostrado ao usuário (no texto inserido, no toast e no dashboard). */
export interface RenderError {
  /** 'syntax' = snippet mal escrito; 'runtime' = falhou ao executar. */
  kind: 'syntax' | 'runtime';
  message: string;
  span: Span;
  line: number;
  column: number;
}

export interface RenderResult {
  /** Texto final, com "[ERRO: ...]" no lugar dos trechos que falharam. */
  text: string;
  /** Todos os erros, na ordem em que aparecem no snippet. */
  errors: RenderError[];
}

/** Executa os nós da AST, em ordem, e monta o texto final. */
export function evaluateNodes(
  nodes: readonly Node[],
  source: string,
  registry: EngineRegistry,
  context: RenderContext,
): Promise<RenderResult> {
  return new Evaluator(source, registry, context).run(nodes);
}

class Evaluator {
  private readonly env: EvalEnv;
  private readonly errors: RenderError[] = [];
  private output = '';

  constructor(
    private readonly source: string,
    private readonly registry: EngineRegistry,
    context: RenderContext,
  ) {
    // Cada renderização começa com variáveis zeradas.
    this.env = { context, scope: new Scope() };
  }

  async run(nodes: readonly Node[]): Promise<RenderResult> {
    for (const node of nodes) await this.renderNode(node);
    return { text: this.output, errors: this.errors };
  }

  // ---------------------------------------------------------------------------
  // Nós do template
  // ---------------------------------------------------------------------------

  private async renderNode(node: Node): Promise<void> {
    switch (node.type) {
      case 'text':
        this.output += node.value;
        return;

      case 'error':
        // Erro de sintaxe encontrado pelo parser.
        this.report('syntax', node.error.message, node.error.span);
        return;

      case 'block':
        // Nenhum comando de bloco existe na Fase 1 ({if} chega na Fase 2).
        this.report('runtime', `{${node.name}}: comandos de bloco ainda não são suportados`, node.span);
        return;

      case 'assign':
        // Guarda o valor OU o erro. O erro só aparece se a variável for usada
        // (e pode ser tratado com catch).
        try {
          this.env.scope.setValue(node.name, await this.evaluate(node.expr));
        } catch (error) {
          this.env.scope.setError(node.name, located(error, node.span));
        }
        return;

      case 'command':
      case 'formula':
        try {
          const value =
            node.type === 'command' ? await this.runCommand(node) : await this.evaluate(node.expr);
          this.output += toText(value);
        } catch (error) {
          const snippetError = located(error, node.span);
          this.report('runtime', snippetError.message, snippetError.span ?? node.span);
        }
        return;
    }
  }

  /** Coloca "[ERRO: ...]" no texto e registra o erro com linha/coluna. */
  private report(kind: RenderError['kind'], message: string, span: Span): void {
    this.output += `[ERRO: ${message}]`;
    this.errors.push({ kind, message, span, ...locate(this.source, span.start) });
  }

  // ---------------------------------------------------------------------------
  // Expressões
  // ---------------------------------------------------------------------------

  private async evaluate(expr: Expr): Promise<Value> {
    switch (expr.type) {
      case 'string':
        return expr.value;

      case 'variable': {
        const binding = this.env.scope.get(expr.name);
        if (!binding) {
          throw new SnippetError(
            `variável '${expr.name}' não foi definida (defina antes com {${expr.name}=...})`,
            expr.span,
          );
        }
        if (!binding.ok) throw binding.error; // a atribuição tinha falhado
        return binding.value;
      }

      case 'call':
        return this.callFunction(expr);

      case 'command':
        return this.runCommand(expr);
    }
  }

  private async runCommand(node: CommandNode): Promise<Value> {
    const command = this.registry.commands.get(node.name);
    if (!command) throw new SnippetError(`comando {${node.name}} não está disponível`, node.span);
    try {
      return await command.run(node, this.env);
    } catch (error) {
      throw withOrigin(error, `{${node.name}}`, node.span);
    }
  }

  private async callFunction(call: FunctionCall): Promise<Value> {
    const fn = this.registry.functions.get(call.name);
    if (!fn) throw new SnippetError(`função ${call.name} não está disponível`, call.span);

    if (fn.lazy === true) {
      // Função preguiçosa (ex.: catch): recebe "receitas" para calcular cada argumento.
      const thunks = call.args.map((arg) => () => this.evaluate(arg));
      try {
        return await fn.call(thunks, this.env);
      } catch (error) {
        throw withOrigin(error, call.name, call.span);
      }
    }

    // Função normal: calcula os argumentos em ordem. Se algum falhar, o erro
    // sobe como está (ele já sabe de onde veio).
    const values: Value[] = [];
    for (const arg of call.args) values.push(await this.evaluate(arg));
    try {
      return await fn.call(values, this.env);
    } catch (error) {
      throw withOrigin(error, call.name, call.span);
    }
  }
}

// -----------------------------------------------------------------------------
// Ajudantes de erro
// -----------------------------------------------------------------------------

/**
 * Prepara um erro que saiu de um comando/função:
 * - se ele já tem posição (veio de mais "fundo"), passa adiante sem mudar;
 * - se é um SnippetError "cru", ganha o prefixo (ex.: "{site}: ...") e a posição;
 * - se não é SnippetError, é um bug: vira "erro inesperado" em vez de travar tudo.
 */
function withOrigin(error: unknown, origin: string, span: Span): SnippetError {
  if (error instanceof SnippetError) {
    return error.span ? error : new SnippetError(`${origin}: ${error.message}`, span);
  }
  return new SnippetError(`${origin}: erro inesperado: ${errorMessage(error)}`, span);
}

/** Garante que o erro seja um SnippetError com posição. */
function located(error: unknown, span: Span): SnippetError {
  if (error instanceof SnippetError) {
    return error.span ? error : new SnippetError(error.message, span);
  }
  return new SnippetError(`erro inesperado: ${errorMessage(error)}`, span);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
