// Utilitários para deixar os testes do parser curtos e legíveis.
import { expect } from 'vitest';
import { parseTemplate, type ParseError, type ParseResult } from '@/engine/parser';
import { testRegistry } from '../fixtures/syntax';

// -----------------------------------------------------------------------------
// Atalhos para rodar o parser
// -----------------------------------------------------------------------------

/** Roda o parser com o registro de teste. */
export function parse(source: string): ParseResult {
  return parseTemplate(source, testRegistry);
}

/** Roda o parser, exige ZERO erros e devolve os nós sem as posições (spans). */
export function parseOk(source: string): unknown {
  const result = parse(source);
  expect(result.errors).toEqual([]);
  return stripSpans(result.nodes);
}

/** Roda o parser, exige EXATAMENTE um erro e devolve esse erro. */
export function parseOneError(source: string): ParseError {
  const { errors } = parse(source);
  expect(errors).toHaveLength(1);
  const [error] = errors;
  if (!error) throw new Error('nenhum erro encontrado');
  return error;
}

/**
 * Copia o valor removendo as chaves de posição (span, line, column).
 * Assim os testes de estrutura não precisam calcular índices à mão;
 * as posições têm testes próprios.
 */
export function stripSpans(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSpans);
  if (value !== null && typeof value === 'object') {
    const copy: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      if (key === 'span' || key === 'line' || key === 'column') continue;
      copy[key] = stripSpans(inner);
    }
    return copy;
  }
  return value;
}

// -----------------------------------------------------------------------------
// Construtores dos nós esperados (já sem spans)
// -----------------------------------------------------------------------------

export const text = (value: string) => ({ type: 'text', value });

export const raw = (value: string) => ({ kind: 'raw', text: value });
export const exprArg = (expr: unknown) => ({ kind: 'expr', expr });

export const cmd = (
  name: string,
  positional: unknown = null,
  settings: Record<string, unknown> = {},
) => ({ type: 'command', name, positional, settings });

export const str = (value: string) => ({ type: 'string', value });
export const variable = (name: string) => ({ type: 'variable', name });
export const call = (name: string, ...args: unknown[]) => ({ type: 'call', name, args });

export const formula = (expr: unknown) => ({ type: 'formula', expr });
export const assign = (name: string, expr: unknown) => ({ type: 'assign', name, expr });

export const section = (head: unknown, ...body: unknown[]) => ({ head, body });
export const block = (name: string, ...sections: unknown[]) => ({ type: 'block', name, sections });

/** ErrorNode cuja mensagem contém o trecho informado. */
export const errorNode = (messagePart: string) => ({
  type: 'error',
  error: { message: expect.stringContaining(messagePart) as unknown },
});
