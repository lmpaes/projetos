// =============================================================================
// Parser de comandos: {nome}, {nome: posicional}, {nome: posicional; chave=valor}
// -----------------------------------------------------------------------------
// Não existe nenhum "if (name === 'site')" aqui: tudo é decidido pelo
// CommandSyntax que o comando registrou (ver syntax.ts).
// =============================================================================

import type { ArgValue, CommandNode, Span } from './ast';
import { TagError } from './errors';
import { parseExpression } from './parse-expression';
import type { ParserState } from './parser-state';
import { scanRawValue } from './raw-value';
import { isIdentifierStart } from './scanner';
import type { ArgSpec, CommandSyntax, SyntaxRegistry } from './syntax';

/**
 * Lê o restante de um comando depois do nome. O cursor está logo após o nome
 * (ex.: em "{site: url}", logo depois de "site"). Consome até o "}" final.
 *
 * @param tagStart posição da "{" que abriu o comando (início do span)
 * @param embedded true quando o comando está dentro de uma fórmula
 */
export function parseCommandBody(
  state: ParserState,
  name: string,
  nameSpan: Span,
  tagStart: number,
  embedded: boolean,
): CommandNode {
  const s = state.scanner;
  const spec = state.registry.commands.get(name);
  if (!spec) throw new TagError(unknownCommandMessage(name, state.registry), nameSpan);
  if (embedded && !spec.embeddable) {
    throw new TagError(`{${name}} não pode ser usado dentro de uma fórmula`, nameSpan);
  }

  s.skipWhitespace();
  let positional: ArgValue | null = null;
  const settings: Record<string, ArgValue> = {};

  if (s.peek() === ':') {
    s.advance();
    positional = parseArguments(state, spec, nameSpan, settings);
  } else if (s.peek() === '}') {
    s.advance();
  } else if (s.atEnd) {
    throw state.unclosedTagError();
  } else {
    throw new TagError(`Esperava ':' ou '}' depois de {${name}}`, { start: s.pos, end: s.pos + 1 });
  }

  const node: CommandNode = {
    type: 'command',
    name,
    positional,
    settings,
    span: { start: tagStart, end: s.pos },
  };

  if (spec.positional?.required && positional === null) {
    const example = spec.usage ? ` Exemplo: ${spec.usage}` : '';
    throw new TagError(`{${name}} precisa de um argumento.${example}`, nameSpan);
  }

  // Regras extras do próprio comando (ex.: selector= só com text/html).
  const customError = spec.validate?.(node);
  if (customError) throw new TagError(customError, node.span);

  return node;
}

/**
 * Lê tudo depois do ":" até o "}" final (inclusive). Preenche `settings` e
 * devolve o argumento posicional (ou null, se não houver).
 */
function parseArguments(
  state: ParserState,
  spec: CommandSyntax,
  nameSpan: Span,
  settings: Record<string, ArgValue>,
): ArgValue | null {
  const s = state.scanner;
  let positional: ArgValue | null = null;

  // 1º segmento: é o argumento posicional ou já é uma setting?
  s.skipWhitespace();
  if (!s.atEnd && s.peek() !== ';' && s.peek() !== '}') {
    if (startsWithSetting(state, spec)) {
      parseSetting(state, spec, settings);
    } else if (!spec.positional) {
      throw new TagError(`{${spec.name}} não aceita argumento`, nameSpan);
    } else {
      positional = parseArgValue(state, spec.positional, `em {${spec.name}}`);
    }
  }

  // Demais segmentos: "; chave=valor" até o "}".
  for (;;) {
    s.skipWhitespace();
    if (s.atEnd) throw state.unclosedTagError();
    const char = s.peek();

    if (char === '}') {
      s.advance();
      return positional;
    }

    if (char === ';') {
      s.advance();
      s.skipWhitespace();
      // ";" sobrando antes do "}" (ou ";;") é aceito sem reclamar.
      if (s.atEnd || s.peek() === ';' || s.peek() === '}') continue;
      parseSetting(state, spec, settings);
      continue;
    }

    throw new TagError(`Esperava ';' ou '}' em {${spec.name}}`, { start: s.pos, end: s.pos + 1 });
  }
}

/**
 * O próximo segmento tem a forma "chave=..."?
 * - Se o comando aceita argumento posicional, só conta como setting quando a
 *   chave é uma setting conhecida. Isso evita ambiguidade na Fase 2:
 *   em {if: x = "a"}, "x" não é setting do {if}, então é o posicional.
 * - Se o comando NÃO aceita posicional, qualquer "chave=" é tratada como setting.
 *
 * Só "espia": o cursor volta para onde estava.
 */
function startsWithSetting(state: ParserState, spec: CommandSyntax): boolean {
  const s = state.scanner;
  const saved = s.pos;
  try {
    if (!isIdentifierStart(s.peek())) return false;
    const key = s.readIdentifier();
    s.skipWhitespace();
    const looksLikeSetting = s.peek() === '=' && s.peek(1) !== '=';
    if (!looksLikeSetting) return false;
    return spec.positional ? getSettingSpec(spec, key) !== undefined : true;
  } finally {
    s.pos = saved;
  }
}

/** Lê "chave = valor" e guarda em `settings`. */
function parseSetting(
  state: ParserState,
  spec: CommandSyntax,
  settings: Record<string, ArgValue>,
): void {
  const s = state.scanner;
  const keyStart = s.pos;
  if (!isIdentifierStart(s.peek())) {
    throw new TagError(`Esperava uma configuração no formato chave=valor em {${spec.name}}`, {
      start: keyStart,
      end: keyStart + 1,
    });
  }

  const key = s.readIdentifier();
  const keySpan = { start: keyStart, end: s.pos };

  const argSpec = getSettingSpec(spec, key);
  if (!argSpec) throw new TagError(unknownSettingMessage(spec, key), keySpan);
  if (Object.hasOwn(settings, key)) {
    throw new TagError(`Configuração '${key}' repetida em {${spec.name}}`, keySpan);
  }

  s.skipWhitespace();
  if (s.peek() !== '=') {
    if (s.atEnd) throw state.unclosedTagError();
    throw new TagError(`Esperava '=' depois de '${key}' (ex.: ${key}=valor)`, {
      start: s.pos,
      end: s.pos + 1,
    });
  }
  s.advance();
  s.skipWhitespace();

  const value = parseArgValue(state, argSpec, `para ${key}= em {${spec.name}}`);
  if (value.kind === 'raw' && value.text === '') {
    throw new TagError(`Faltou o valor de ${key}= em {${spec.name}}`, keySpan);
  }
  settings[key] = value;
}

/** Lê um valor do jeito que o ArgSpec manda: texto cru ou expressão. */
function parseArgValue(state: ParserState, argSpec: ArgSpec, where: string): ArgValue {
  if (argSpec.kind === 'expr') {
    const start = state.scanner.pos;
    const expr = parseExpression(state);
    return { kind: 'expr', expr, span: { start, end: state.scanner.pos } };
  }

  const raw = scanRawValue(state);
  if (argSpec.oneOf && raw.text !== '' && !argSpec.oneOf.includes(raw.text)) {
    throw new TagError(
      `Valor inválido '${raw.text}' ${where}. Use um destes: ${argSpec.oneOf.join(', ')} ` +
        `(diferencia maiúsculas de minúsculas)`,
      raw.span,
    );
  }
  return { kind: 'raw', text: raw.text, span: raw.span };
}

/** Busca a spec de uma setting sem cair em armadilhas como a chave "__proto__". */
function getSettingSpec(spec: CommandSyntax, key: string): ArgSpec | undefined {
  return spec.settings && Object.hasOwn(spec.settings, key) ? spec.settings[key] : undefined;
}

function unknownCommandMessage(name: string, registry: SyntaxRegistry): string {
  const available = [...registry.commands.keys()];
  const hint = available.find((command) => command.toLowerCase() === name.toLowerCase());
  return (
    `Comando desconhecido: {${name}}. Comandos disponíveis: ${available.join(', ')}.` +
    (hint ? ` Você quis dizer {${hint}}? (os nomes diferenciam maiúsculas de minúsculas)` : '')
  );
}

function unknownSettingMessage(spec: CommandSyntax, key: string): string {
  const accepted = Object.keys(spec.settings ?? {});
  if (accepted.length === 0) {
    return `{${spec.name}} não aceita configurações (encontrei '${key}')`;
  }
  return `Configuração desconhecida '${key}' em {${spec.name}}. Aceitas: ${accepted.join(', ')}`;
}
