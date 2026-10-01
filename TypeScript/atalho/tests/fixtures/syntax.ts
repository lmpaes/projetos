// Registro de sintaxe usado SÓ nos testes do parser.
// Ele espelha os comandos da Fase 1 (site, time, clipboard) e adiciona um
// bloco fictício if/elseif/else/endif. Esse bloco não existe na extensão; ele
// serve para provar que o parser já aceita comandos de bloco (Fase 2) sem
// precisar ser reescrito.
import { createSyntaxRegistry, type CommandSyntax } from '@/engine/parser';

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

const site: CommandSyntax = {
  name: 'site',
  usage: '{site: url}',
  positional: { kind: 'raw', required: true, oneOf: SITE_TYPES },
  settings: {
    selector: { kind: 'raw' },
    multiple: { kind: 'raw', oneOf: ['yes', 'no'] },
  },
  embeddable: true,
  validate(node) {
    const type = node.positional?.kind === 'raw' ? node.positional.text : null;
    if ('selector' in node.settings && type !== 'text' && type !== 'html') {
      return 'selector= só vale com {site: text} ou {site: html}';
    }
    return null;
  },
};

const time: CommandSyntax = {
  name: 'time',
  usage: '{time: DD/MM/YYYY}',
  positional: { kind: 'raw', required: true },
  embeddable: true,
};

const clipboard: CommandSyntax = {
  name: 'clipboard',
  embeddable: true,
};

// --- Bloco fictício (só para testes) ---------------------------------------
const ifBlock: CommandSyntax = {
  name: 'if',
  usage: '{if: condição}',
  positional: { kind: 'expr', required: true },
  block: { end: 'endif', intermediates: ['elseif', 'else'] },
};
const elseIf: CommandSyntax = { name: 'elseif', positional: { kind: 'expr', required: true } };
const elseCmd: CommandSyntax = { name: 'else' };
const endIf: CommandSyntax = { name: 'endif' };

export const testRegistry = createSyntaxRegistry({
  commands: [site, time, clipboard, ifBlock, elseIf, elseCmd, endIf],
  functions: [
    { name: 'extractregex', minArgs: 2, maxArgs: 2 },
    { name: 'catch', minArgs: 2, maxArgs: 2 },
  ],
});
