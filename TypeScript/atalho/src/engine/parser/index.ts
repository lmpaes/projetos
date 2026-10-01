// API pública do parser: quem está fora desta pasta importa daqui.
export type * from './ast';
export type { ArgKind, ArgSpec, BlockSpec, CommandSyntax, FunctionSyntax, SyntaxRegistry } from './syntax';
export { createSyntaxRegistry } from './syntax';
export { parseTemplate } from './parse-template';
