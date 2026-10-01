// =============================================================================
// Montagem de blocos: transforma a lista "plana" de nós numa árvore.
// -----------------------------------------------------------------------------
//   {if: x}A{else}B{endif}   →   lista plana: [if, "A", else, "B", endif]
//                            →   árvore: Block(if) com seções [if → "A"], [else → "B"]
//
// Nenhum comando da Fase 1 é de bloco, mas este passo já existe para que o
// {if}/{repeat} da Fase 2 só precisem registrar um `block` no CommandSyntax.
// =============================================================================

import type { BlockSection, CommandNode, ErrorNode, Node, ParseError, Span } from './ast';
import type { BlockSpec, SyntaxRegistry } from './syntax';

/** Bloco aberto que ainda está esperando o comando de fechamento. */
interface OpenBlock {
  opener: CommandNode;
  spec: BlockSpec;
  sections: BlockSection[];
}

export function buildBlocks(
  flat: readonly Node[],
  registry: SyntaxRegistry,
  makeError: (message: string, span: Span) => ParseError,
): Node[] {
  // Para cada nome de fechamento/intermediário, qual comando o abre.
  // Ex.: endif → if, else → if. Usado na mensagem "{endif} sem um {if}".
  const ownerOf = new Map<string, string>();
  for (const command of registry.commands.values()) {
    if (!command.block) continue;
    ownerOf.set(command.block.end, command.name);
    for (const part of command.block.intermediates ?? []) ownerOf.set(part, command.name);
  }

  const toErrorNode = (node: Node, message: string): ErrorNode => ({
    type: 'error',
    error: makeError(message, node.span),
    span: node.span,
  });

  const root: Node[] = [];
  const stack: OpenBlock[] = [];
  /** Onde o próximo nó deve entrar: no corpo da seção atual do bloco aberto, ou na raiz. */
  const currentBody = (): Node[] => stack.at(-1)?.sections.at(-1)?.body ?? root;

  for (const node of flat) {
    if (node.type !== 'command') {
      currentBody().push(node);
      continue;
    }

    const blockSpec = registry.commands.get(node.name)?.block;
    const top = stack.at(-1);

    if (blockSpec) {
      // Abre um bloco novo (pode estar dentro de outro).
      stack.push({ opener: node, spec: blockSpec, sections: [{ head: node, body: [] }] });
    } else if (top && node.name === top.spec.end) {
      // Fecha o bloco aberto mais recente.
      stack.pop();
      currentBody().push({
        type: 'block',
        name: top.opener.name,
        sections: top.sections,
        span: { start: top.opener.span.start, end: node.span.end },
      });
    } else if (top?.spec.intermediates?.includes(node.name)) {
      // {elseif}/{else}: começa uma seção nova no bloco aberto.
      top.sections.push({ head: node, body: [] });
    } else if (ownerOf.has(node.name)) {
      // {endif}/{else} sem o {if} correspondente.
      const owner = ownerOf.get(node.name) ?? '';
      currentBody().push(toErrorNode(node, `{${node.name}} sem um {${owner}} correspondente`));
    } else {
      currentBody().push(node);
    }
  }

  // Blocos que nunca foram fechados: erro na abertura, e o conteúdo volta ao
  // nível de cima (para o resto do snippet continuar aparecendo).
  while (stack.length > 0) {
    const open = stack.pop();
    if (!open) break;
    const opener = open.opener.name;
    const flattened: Node[] = [];
    open.sections.forEach((section, index) => {
      flattened.push(
        index === 0
          ? toErrorNode(section.head, `{${opener}} não foi fechado: faltou {${open.spec.end}}`)
          : toErrorNode(section.head, `{${section.head.name}} pertence a um {${opener}} que não foi fechado`),
      );
      flattened.push(...section.body);
    });
    currentBody().push(...flattened);
  }

  return root;
}
